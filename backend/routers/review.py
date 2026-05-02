"""
routers/review.py — Spaced repetition review endpoints.

All endpoints are protected — requires valid JWT Bearer token.
Users can only review their own flashcards.

Endpoints:
  POST /review/      — Submit a quality rating for a card (SM-2 algorithm)
  GET  /review/due   — Get all cards due for review today
  GET  /review/stats — Get overall review statistics
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Deck, Flashcard, ReviewLog, User
from schemas import APIResponse, DueCardsOut, FlashcardOut, ReviewQuality, ReviewResult
from services.auth_service import get_current_user
from services.scheduler import apply_sm2

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_card_for_user(card_id: int, user_id: int, db: Session) -> Flashcard:
    """Fetch a Flashcard that belongs to the current user or raise 404."""
    card = (
        db.query(Flashcard)
        .join(Deck, Deck.id == Flashcard.deck_id)
        .filter(Flashcard.id == card_id, Deck.user_id == user_id)
        .first()
    )
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flashcard id={card_id} not found.",
        )
    return card


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=APIResponse[ReviewResult],
    summary="Submit a card review",
)
def submit_review(
    payload:      ReviewQuality,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    # Verify card belongs to current user
    card = _get_card_for_user(payload.flashcard_id, current_user.id, db)

    # Fetch or create review log
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

    # Apply SM-2
    updated = apply_sm2(
        ease_factor=log.ease_factor,
        interval=log.interval,
        repetitions=log.repetitions,
        quality=payload.quality,
    )

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
            message=f"Card scheduled in {log.interval} day(s). Ease: {log.ease_factor:.2f}.",
        ),
        message="Review submitted successfully.",
    )


@router.get(
    "/due",
    response_model=APIResponse[DueCardsOut],
    summary="Get all cards due for review today",
)
def get_due_cards(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    # Only fetch cards belonging to the current user
    due_cards = (
        db.query(Flashcard)
        .join(Deck, Deck.id == Flashcard.deck_id)
        .join(ReviewLog, ReviewLog.flashcard_id == Flashcard.id)
        .filter(
            Deck.user_id == current_user.id,
            ReviewLog.due_date <= now,
        )
        .order_by(ReviewLog.due_date.asc())
        .all()
    )

    cards_out = [FlashcardOut.model_validate(c) for c in due_cards]

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
    summary="Get review statistics for current user",
)
def get_stats(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    now         = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # All review logs for this user's cards
    user_logs = (
        db.query(ReviewLog)
        .join(Flashcard, Flashcard.id == ReviewLog.flashcard_id)
        .join(Deck, Deck.id == Flashcard.deck_id)
        .filter(Deck.user_id == current_user.id)
        .all()
    )

    total_cards    = len(user_logs)
    reviewed_today = sum(1 for l in user_logs if l.last_reviewed and l.last_reviewed >= today_start)
    due_now        = sum(1 for l in user_logs if l.due_date <= now)
    avg_ease       = (
        round(sum(l.ease_factor for l in user_logs) / total_cards, 2)
        if total_cards else 0.0
    )

    return APIResponse(
        data={
            "total_cards":     total_cards,
            "reviewed_today":  reviewed_today,
            "due_now":         due_now,
            "avg_ease_factor": avg_ease,
        },
        message="Review statistics retrieved successfully.",
    )