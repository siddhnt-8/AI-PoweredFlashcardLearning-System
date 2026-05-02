"""
models.py — SQLAlchemy ORM models for the Flashcard application.

Tables:
  - Deck        : a collection of flashcards generated from one PDF
  - Flashcard   : individual card belonging to a Deck
  - ReviewLog   : SM-2 spaced repetition state per Flashcard
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class CardType(str, enum.Enum):
    """Whether the card was generated as a Q&A pair or a short note."""
    question = "question"
    note     = "note"


class GenerationMode(str, enum.Enum):
    """Mode chosen by the user at upload time."""
    questions = "questions"
    notes     = "notes"


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _now() -> datetime:
    """UTC-aware current timestamp used as column defaults."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Deck
# ---------------------------------------------------------------------------
class Deck(Base):
    """
    Represents one PDF upload session.
    A Deck groups all Flashcards generated from a single document.
    """
    __tablename__ = "decks"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(255), nullable=False)          # PDF filename
    mode       = Column(Enum(GenerationMode), nullable=False) # notes | questions
    created_at = Column(DateTime(timezone=True), default=_now)

    # One Deck → many Flashcards; deleting the deck cascades to its cards
    flashcards = relationship(
        "Flashcard",
        back_populates="deck",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Deck id={self.id} title={self.title!r} mode={self.mode}>"


# ---------------------------------------------------------------------------
# Flashcard
# ---------------------------------------------------------------------------
class Flashcard(Base):
    """
    A single flashcard.

    - front : question text  OR  note title
    - back  : answer text    OR  note explanation
    - type  : 'question' | 'note'
    """
    __tablename__ = "flashcards"

    id         = Column(Integer, primary_key=True, index=True)
    deck_id    = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    type       = Column(Enum(CardType), nullable=False)
    front      = Column(Text, nullable=False)   # question / note title
    back       = Column(Text, nullable=False)   # answer   / explanation
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    deck       = relationship("Deck", back_populates="flashcards")
    review_log = relationship(
        "ReviewLog",
        back_populates="flashcard",
        uselist=False,                  # one-to-one
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Flashcard id={self.id} type={self.type} front={self.front[:40]!r}>"


# ---------------------------------------------------------------------------
# ReviewLog  (SM-2 spaced repetition state)
# ---------------------------------------------------------------------------
class ReviewLog(Base):
    """
    Stores the SM-2 spaced repetition state for each Flashcard.

    Fields follow the standard SM-2 algorithm:
      - ease_factor   : how easy the card is (starts at 2.5, min 1.3)
      - interval      : days until next review
      - repetitions   : how many times reviewed successfully in a row
      - due_date      : next date the card should be shown
      - last_reviewed : timestamp of the most recent review
    """
    __tablename__ = "review_logs"

    id            = Column(Integer, primary_key=True, index=True)
    flashcard_id  = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # SM-2 state
    ease_factor   = Column(Float,   nullable=False, default=2.5)
    interval      = Column(Integer, nullable=False, default=1)    # days
    repetitions   = Column(Integer, nullable=False, default=0)
    due_date      = Column(DateTime(timezone=True), default=_now)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)

    # Relationship back to the card
    flashcard     = relationship("Flashcard", back_populates="review_log")

    def __repr__(self) -> str:
        return (
            f"<ReviewLog flashcard_id={self.flashcard_id} "
            f"interval={self.interval}d ease={self.ease_factor:.2f}>"
        )