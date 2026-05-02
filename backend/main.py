"""
main.py — FastAPI entry point for the AI-powered Flashcard application.

Responsibilities:
  - Create and configure the FastAPI app instance
  - Set up CORS middleware (allows React dev server on port 5173)
  - Initialize the SQLite database on startup
  - Register all routers (upload, flashcards, review)
  - Expose a health-check endpoint
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import flashcards, review, upload


# ---------------------------------------------------------------------------
# Lifespan: runs once on startup and once on shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables (if they don't exist) when the server starts."""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready.")
    yield
    # Nothing special needed on shutdown, but this is the right place for it
    print("🛑 Shutting down Flashcard API.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Flashcard API",
    description=(
        "Upload PDFs, generate AI-powered notes or Q&A flashcards via "
        "MiMo-v2-Flash (OpenRouter), and study with spaced repetition."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS — allow the React frontend (Vite default port 5173) and any localhost
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # CRA / fallback
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
# POST /upload/pdf          — upload a PDF and generate flashcards via AI
app.include_router(upload.router, prefix="/upload", tags=["Upload"])

# GET  /flashcards/         — list all decks
# GET  /flashcards/{deck_id}— get all cards in a deck
# DELETE /flashcards/{id}   — delete a deck
app.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])

# POST /review/             — submit a card review (spaced repetition)
# GET  /review/due          — get cards due for review today
app.include_router(review.router, prefix="/review", tags=["Review"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    """Simple liveness probe — useful for Docker / deployment checks."""
    return {"status": "ok", "message": "Flashcard API is running 🚀"}