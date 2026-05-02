"""
routers/review.py — Spaced repetition review endpoints.

Endpoints:
  POST /review/        — Submit a quality rating for a card (SM-2 algorithm)
  GET  /review/due     — Get all cards due for review today
  GET  /review/stats   — Get overall review statistics
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Flashcard, ReviewLog
from schemas import APIResponse, DueCardsOut, FlashcardOut, ReviewQuality, ReviewResult
from services.scheduler import apply_sm2

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_review_log_or_404(flashcard_id: int, db: Session) -> ReviewLog:
    """Fetch a ReviewLog by flashcard_id or raise 404."""
    log = (
        db.query(ReviewLog)
        .filter(ReviewLog.flashcard_id == flashcard_id)
        .first()
    )
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No review log found for flashcard id={flashcard_id}.",
        )
    return log


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=APIResponse[ReviewResult],
    summary="Submit a card review",
    description=(
        "Accept a SM-2 quality score (0–5) for a flashcard and update its "
        "review schedule. Returns the next due date and updated ease factor."
    ),
)
def submit_review(
    payload: ReviewQuality,
    db:      Session = Depends(get_db),
):
    # Verify the flashcard exists
    card = db.query(Flashcard).filter(Flashcard.id == payload.flashcard_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flashcard id={payload.flashcard_id} not found.",
        )

    # Fetch or create the review log
    log = db.query(ReviewLog).filter(
        ReviewLog.flashcard_id == payload.flashcard_id
    ).first()

    if not log:
        from config import settings
        log = ReviewLog(
            flashcard_id=payload.flashcard_id,
            ease_factor=settings.sr_default_ease_factor,
            interval=settings.sr_initial_interval,
            repetitions=0,
        )
        db.add(log)
        db.flush()

    # Apply SM-2 algorithm
    updated = apply_sm2(
        ease_factor=log.ease_factor,
        interval=log.interval,
        repetitions=log.repetitions,
        quality=payload.quality,
    )

    # Persist updated state
    log.ease_factor   = updated["ease_factor"]
    log.interval      = updated["interval"]
    log.repetitions   = updated["repetitions"]
    log.due_date      = updated["due_date"]
    log.last_reviewed = datetime.now(timezone.utc)

    db.commit()
    db.refresh(log)

    return APIResponse(
        data=ReviewResult(
            flashcard_id=payload.flashcard_id,
            next_interval=log.interval,
            ease_factor=log.ease_factor,
            due_date=log.due_date,
            message=(
                f"Card scheduled for review in {log.interval} day(s). "
                f"Ease factor: {log.ease_factor:.2f}."
            ),
        ),
        message="Review submitted successfully.",
    )


@router.get(
    "/due",
    response_model=APIResponse[DueCardsOut],
    summary="Get all cards due for review today",
    description="Returns every flashcard whose next review date is today or in the past.",
)
def get_due_cards(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    due_logs = (
        db.query(ReviewLog)
        .filter(ReviewLog.due_date <= now)
        .order_by(ReviewLog.due_date.asc())
        .all()
    )

    flashcard_ids = [log.flashcard_id for log in due_logs]

    flashcards = (
        db.query(Flashcard)
        .filter(Flashcard.id.in_(flashcard_ids))
        .all()
    ) if flashcard_ids else []

    cards_out = [FlashcardOut.model_validate(c) for c in flashcards]

    return APIResponse(
        data=DueCardsOut(
            due_count=len(cards_out),
            flashcards=cards_out,
        ),
        message=f"{len(cards_out)} card(s) due for review.",
    )


@router.get(
    "/stats",
    response_model=APIResponse[dict],
    summary="Get overall review statistics",
    description="Returns aggregate stats: total cards, reviewed today, average ease factor.",
)
def get_stats(
    db: Session = Depends(get_db),
):
    now       = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_cards = db.query(ReviewLog).count()

    reviewed_today = (
        db.query(ReviewLog)
        .filter(ReviewLog.last_reviewed >= today_start)
        .count()
    )

    due_count = (
        db.query(ReviewLog)
        .filter(ReviewLog.due_date <= now)
        .count()
    )

    # Average ease factor across all logs
    all_logs     = db.query(ReviewLog).all()
    avg_ease     = (
        round(sum(l.ease_factor for l in all_logs) / len(all_logs), 2)
        if all_logs else 0.0
    )

    return APIResponse(
        data={
            "total_cards":     total_cards,
            "reviewed_today":  reviewed_today,
            "due_now":         due_count,
            "avg_ease_factor": avg_ease,
        },
        message="Review statistics retrieved successfully.",
    )