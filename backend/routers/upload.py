"""
routers/upload.py — Handles PDF upload, text extraction, and AI generation.

Endpoints:
  POST /upload/pdf — Accept a PDF file, extract text, generate flashcards via
                     MiMo-v2-Flash (OpenRouter), persist to DB, return deck.

Protected: requires valid JWT Bearer token.
"""

import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import CardType, Deck, Flashcard, GenerationMode, ReviewLog, User
from schemas import DeckDetailOut, GenerationMode, UploadResponse
from services.ai_processor import generate_flashcards
from services.auth_service import get_current_user
from services.pdf_extractor import extract_text_from_pdf

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _validate_pdf(file: UploadFile) -> None:
    if file.content_type not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Only PDFs are accepted.",
        )


async def _save_upload(file: UploadFile) -> str:
    ext       = os.path.splitext(file.filename or "upload.pdf")[1] or ".pdf"
    filename  = f"{uuid.uuid4().hex}{ext}"
    file_path = settings.upload_path / filename

    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 64):
            if file_path.stat().st_size > settings.max_upload_size_bytes:
                f.close()
                os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the {settings.max_upload_size_bytes // (1024*1024)} MB limit.",
                )
            f.write(chunk)

    return str(file_path)


def _persist_deck(
    db:         Session,
    title:      str,
    mode:       GenerationMode,
    cards_data: list[dict],
    user_id:    int,
) -> Deck:
    # 1. Create deck linked to user
    deck = Deck(title=title, mode=mode, user_id=user_id)
    db.add(deck)
    db.flush()

    # 2. Create flashcards and seed review logs
    for card in cards_data:
        flashcard = Flashcard(
            deck_id=deck.id,
            type=CardType(card.get("type", "question")),
            front=card["front"],
            back=card["back"],
        )
        db.add(flashcard)
        db.flush()

        review_log = ReviewLog(
            flashcard_id=flashcard.id,
            ease_factor=settings.sr_default_ease_factor,
            interval=settings.sr_initial_interval,
            repetitions=0,
        )
        db.add(review_log)

    db.commit()
    db.refresh(deck)
    return deck


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/pdf",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF and generate flashcards",
)
async def upload_pdf(
    file:         UploadFile     = File(..., description="PDF file to upload"),
    mode:         GenerationMode = Form(GenerationMode.questions, description="'questions' or 'notes'"),
    card_count:   int            = Form(10, ge=1, le=30, description="Number of flashcards to generate"),
    db:           Session        = Depends(get_db),
    current_user: User           = Depends(get_current_user),
):
    # 1. Validate
    _validate_pdf(file)

    # 2. Save to disk
    file_path = await _save_upload(file)

    try:
        # 3. Extract text
        text = extract_text_from_pdf(file_path)
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract any text from the uploaded PDF.",
            )

        # 4. Generate flashcards via MiMo-v2-Flash
        cards_data = await generate_flashcards(
            text=text,
            mode=mode,
            card_count=min(card_count, settings.max_card_count),
        )

        if not cards_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The AI model returned no flashcards. Please try again.",
            )

        # 5. Persist deck + cards + review logs linked to current user
        title = os.path.splitext(file.filename or "Untitled")[0]
        deck  = _persist_deck(
            db,
            title=title,
            mode=mode,
            cards_data=cards_data,
            user_id=current_user.id,
        )

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    # 6. Return response
    return UploadResponse(
        deck=DeckDetailOut.model_validate(deck),
        message=f"✅ Generated {len(deck.flashcards)} flashcards from '{file.filename}'.",
    )