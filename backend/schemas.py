"""
schemas.py — Pydantic v2 request/response schemas for the Flashcard API.

Sections:
  - Shared enums
  - Flashcard schemas
  - Deck schemas
  - ReviewLog schemas
  - Upload schemas
  - API response wrappers
"""

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from models import CardType, GenerationMode


# ---------------------------------------------------------------------------
# Generic API response wrapper
# ---------------------------------------------------------------------------
T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standard envelope returned by every endpoint.

    {
        "success": true,
        "message": "Flashcards generated successfully.",
        "data": { ... }
    }
    """
    success: bool = True
    message: str  = "OK"
    data:    Optional[T] = None


class ErrorResponse(BaseModel):
    """Returned on 4xx / 5xx errors."""
    success: bool = False
    message: str
    detail:  Optional[Any] = None


# ---------------------------------------------------------------------------
# ReviewLog schemas
# ---------------------------------------------------------------------------
class ReviewLogBase(BaseModel):
    ease_factor:   float = Field(2.5,  ge=1.3,  description="SM-2 easiness factor")
    interval:      int   = Field(1,    ge=1,    description="Days until next review")
    repetitions:   int   = Field(0,    ge=0,    description="Consecutive correct reviews")
    due_date:      datetime
    last_reviewed: Optional[datetime] = None


class ReviewLogOut(ReviewLogBase):
    """Schema returned to the client for a review log entry."""
    id:           int
    flashcard_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Flashcard schemas
# ---------------------------------------------------------------------------
class FlashcardBase(BaseModel):
    type:  CardType = Field(..., description="'question' or 'note'")
    front: str      = Field(..., min_length=1, description="Question or note title")
    back:  str      = Field(..., min_length=1, description="Answer or explanation")


class FlashcardCreate(FlashcardBase):
    """Used internally when bulk-inserting AI-generated cards."""
    deck_id: int


class FlashcardOut(FlashcardBase):
    """
    Full flashcard returned to the frontend.

    Matches the agreed data format:
      { "type": "question", "front": "What is X?", "back": "X is ..." }
    """
    id:         int
    deck_id:    int
    created_at: datetime
    review_log: Optional[ReviewLogOut] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Deck schemas
# ---------------------------------------------------------------------------
class DeckBase(BaseModel):
    title: str            = Field(..., min_length=1, max_length=255, description="PDF filename / deck name")
    mode:  GenerationMode = Field(..., description="'questions' or 'notes'")


class DeckCreate(DeckBase):
    """Payload used when creating a new deck (internal use)."""
    pass


class DeckOut(DeckBase):
    """Deck summary — no cards embedded (use DeckDetailOut for cards)."""
    id:         int
    created_at: datetime
    card_count: int = Field(0, description="Total number of cards in this deck")

    model_config = ConfigDict(from_attributes=True)


class DeckDetailOut(DeckOut):
    """Full deck including all flashcards — returned after PDF processing."""
    flashcards: List[FlashcardOut] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Upload schemas
# ---------------------------------------------------------------------------
class UploadRequest(BaseModel):
    """
    Query parameters / form fields sent with the PDF upload.

    - mode       : 'questions' | 'notes'
    - card_count : how many flashcards to generate (1-30)
    """
    mode:       GenerationMode = Field(
        GenerationMode.questions,
        description="Generation mode: 'questions' for Q&A pairs, 'notes' for short notes",
    )
    card_count: int = Field(
        10,
        ge=1,
        le=30,
        description="Number of flashcards to generate (1–30)",
    )


class UploadResponse(BaseModel):
    """Returned immediately after a successful PDF upload + AI generation."""
    deck:    DeckDetailOut
    message: str = "Flashcards generated successfully."


# ---------------------------------------------------------------------------
# Review schemas
# ---------------------------------------------------------------------------
class ReviewQuality(BaseModel):
    """
    SM-2 quality rating submitted by the user after reviewing a card.

    quality:
      0 — complete blackout
      1 — incorrect, but remembered on seeing the answer
      2 — incorrect, but easy to recall
      3 — correct with serious difficulty
      4 — correct after hesitation
      5 — perfect recall
    """
    flashcard_id: int = Field(..., description="ID of the card being reviewed")
    quality:      int = Field(..., ge=0, le=5, description="SM-2 quality score (0–5)")


class ReviewResult(BaseModel):
    """SM-2 result returned after processing a review submission."""
    flashcard_id:  int
    next_interval: int   = Field(..., description="Days until next review")
    ease_factor:   float = Field(..., description="Updated easiness factor")
    due_date:      datetime
    message:       str


class DueCardsOut(BaseModel):
    """Response for GET /review/due — cards scheduled for today."""
    due_count:  int
    flashcards: List[FlashcardOut]