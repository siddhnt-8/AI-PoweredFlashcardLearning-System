"""
schemas.py — Pydantic v2 request/response schemas for the Flashcard API.

Sections:
  - Generic API response wrapper
  - Auth schemas
  - Flashcard schemas
  - Deck schemas
  - ReviewLog schemas
  - Upload schemas
  - Review schemas
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
    { "success": true, "message": "...", "data": { ... } }
    """
    success: bool        = True
    message: str         = "OK"
    data:    Optional[T] = None


class ErrorResponse(BaseModel):
    """Returned on 4xx / 5xx errors."""
    success: bool = False
    message: str
    detail:  Optional[Any] = None


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    """Payload for POST /auth/signup."""
    email:    str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""
    email:    str = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserOut(BaseModel):
    """Public user info returned in auth responses."""
    id:    int
    email: str

    model_config = ConfigDict(from_attributes=True)


class SignupResponse(BaseModel):
    """Returned after successful signup."""
    access_token: str
    token_type:   str     = "bearer"
    user:         UserOut
    message:      str     = "Account created successfully!"


class LoginResponse(BaseModel):
    """Returned after successful login."""
    access_token: str
    token_type:   str     = "bearer"
    user:         UserOut
    message:      str     = "Login successful!"


# ---------------------------------------------------------------------------
# ReviewLog schemas
# ---------------------------------------------------------------------------
class ReviewLogBase(BaseModel):
    ease_factor:   float = Field(2.5, ge=1.3)
    interval:      int   = Field(1,   ge=1)
    repetitions:   int   = Field(0,   ge=0)
    due_date:      datetime
    last_reviewed: Optional[datetime] = None


class ReviewLogOut(ReviewLogBase):
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
    deck_id: int


class FlashcardOut(FlashcardBase):
    """
    Full flashcard returned to the frontend.
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
    title: str            = Field(..., min_length=1, max_length=255)
    mode:  GenerationMode = Field(..., description="'questions' or 'notes'")


class DeckCreate(DeckBase):
    pass


class DeckOut(DeckBase):
    """Deck summary — no cards embedded."""
    id:         int
    user_id:    int
    created_at: datetime
    card_count: int = Field(0)

    model_config = ConfigDict(from_attributes=True)


class DeckDetailOut(DeckOut):
    """Full deck including all flashcards."""
    flashcards: List[FlashcardOut] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Upload schemas
# ---------------------------------------------------------------------------
class UploadRequest(BaseModel):
    mode:       GenerationMode = Field(GenerationMode.questions)
    card_count: int            = Field(10, ge=1, le=30)


class UploadResponse(BaseModel):
    deck:    DeckDetailOut
    message: str = "Flashcards generated successfully."


# ---------------------------------------------------------------------------
# Review schemas
# ---------------------------------------------------------------------------
class ReviewQuality(BaseModel):
    """
    SM-2 quality rating submitted by the user after reviewing a card.
    quality: 0 (blank) to 5 (perfect)
    """
    flashcard_id: int = Field(..., description="ID of the card being reviewed")
    quality:      int = Field(..., ge=0, le=5, description="SM-2 quality score (0-5)")


class ReviewResult(BaseModel):
    """SM-2 result returned after processing a review submission."""
    flashcard_id:  int
    next_interval: int
    ease_factor:   float
    due_date:      datetime
    message:       str


class DueCardsOut(BaseModel):
    """Response for GET /review/due."""
    due_count:  int
    flashcards: List[FlashcardOut]