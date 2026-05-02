"""
routers/flashcards.py — CRUD endpoints for Decks and Flashcards.

Endpoints:
  GET    /flashcards/              — list all decks (paginated)
  GET    /flashcards/{deck_id}     — get a single deck with all its cards
  DELETE /flashcards/{deck_id}     — delete a deck and all its cards
  GET    /flashcards/card/{card_id}— get a single flashcard by ID
  DELETE /flashcards/card/{card_id}— delete a single flashcard
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import Deck, Flashcard
from schemas import APIResponse, DeckDetailOut, DeckOut, FlashcardOut

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_deck_or_404(deck_id: int, db: Session) -> Deck:
    """Fetch a Deck by ID or raise a 404."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deck with id={deck_id} not found.",
        )
    return deck


def _get_card_or_404(card_id: int, db: Session) -> Flashcard:
    """Fetch a Flashcard by ID or raise a 404."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flashcard with id={card_id} not found.",
        )
    return card


# ---------------------------------------------------------------------------
# Deck endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=APIResponse[list[DeckOut]],
    summary="List all decks",
    description="Returns a paginated list of all decks ordered by creation date (newest first).",
)
def list_decks(
    skip:  int     = Query(0,  ge=0,  description="Number of records to skip"),
    limit: int     = Query(20, ge=1, le=100, description="Max records to return"),
    db:    Session = Depends(get_db),
):
    decks = (
        db.query(Deck)
        .order_by(Deck.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    deck_list = []
    for deck in decks:
        deck_out            = DeckOut.model_validate(deck)
        deck_out.card_count = len(deck.flashcards)
        deck_list.append(deck_out)

    return APIResponse(
        data=deck_list,
        message=f"Found {len(deck_list)} deck(s).",
    )


@router.get(
    "/{deck_id}",
    response_model=APIResponse[DeckDetailOut],
    summary="Get a deck with all its flashcards",
)
def get_deck(
    deck_id: int,
    db:      Session = Depends(get_db),
):
    deck     = _get_deck_or_404(deck_id, db)
    deck_out = DeckDetailOut.model_validate(deck)
    deck_out.card_count = len(deck.flashcards)

    return APIResponse(
        data=deck_out,
        message=f"Deck '{deck.title}' with {deck_out.card_count} card(s).",
    )


@router.delete(
    "/{deck_id}",
    response_model=APIResponse[None],
    summary="Delete a deck and all its flashcards",
)
def delete_deck(
    deck_id: int,
    db:      Session = Depends(get_db),
):
    deck = _get_deck_or_404(deck_id, db)
    title = deck.title

    db.delete(deck)
    db.commit()

    return APIResponse(
        data=None,
        message=f"Deck '{title}' and all its cards have been deleted.",
    )


# ---------------------------------------------------------------------------
# Flashcard endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/card/{card_id}",
    response_model=APIResponse[FlashcardOut],
    summary="Get a single flashcard by ID",
)
def get_card(
    card_id: int,
    db:      Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)

    return APIResponse(
        data=FlashcardOut.model_validate(card),
        message="Flashcard retrieved successfully.",
    )


@router.delete(
    "/card/{card_id}",
    response_model=APIResponse[None],
    summary="Delete a single flashcard",
)
def delete_card(
    card_id: int,
    db:      Session = Depends(get_db),
):
    card = _get_card_or_404(card_id, db)

    db.delete(card)
    db.commit()

    return APIResponse(
        data=None,
        message=f"Flashcard id={card_id} has been deleted.",
    )