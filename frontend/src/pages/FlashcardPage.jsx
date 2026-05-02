/**
 * FlashcardPage.jsx — Flashcard study viewer.
 * Displays a deck of flashcards with flip animation, navigation,
 * spaced repetition rating, and browser notification toggle.
 */

import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getDeck, submitReview } from "../api/client";
import Flashcard from "../components/Flashcard";
import ProgressBar from "../components/ProgressBar";
import NotificationManager from "../components/NotificationManager";

export default function FlashcardPage() {
  const { deckId }   = useParams();
  const { state }    = useLocation();
  const navigate     = useNavigate();

  const [deck,        setDeck]        = useState(state?.deck || null);
  const [cards,       setCards]       = useState([]);
  const [current,     setCurrent]     = useState(0);
  const [flipped,     setFlipped]     = useState(false);
  const [loading,     setLoading]     = useState(!state?.deck);
  const [error,       setError]       = useState("");
  const [reviewed,    setReviewed]    = useState(new Set());
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [ratingDone,  setRatingDone]  = useState(false);

  // ── Fetch deck if not passed via router state ──────────────────────────
  useEffect(() => {
    if (!deck) {
      setLoading(true);
      getDeck(deckId)
        .then((res) => {
          setDeck(res.data);
          setCards(res.data.flashcards || []);
        })
        .catch(() => setError("Failed to load deck."))
        .finally(() => setLoading(false));
    } else {
      setCards(deck.flashcards || []);
    }
  }, [deckId]);

  // Reset flip state when navigating cards
  useEffect(() => {
    setFlipped(false);
    setRatingDone(false);
  }, [current]);

  // ── Navigation ─────────────────────────────────────────────────────────
  const goNext = () => {
    if (current < cards.length - 1) setCurrent((c) => c + 1);
  };
  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  // ── Spaced repetition rating ───────────────────────────────────────────
  const handleRate = async (quality) => {
    const card = cards[current];
    try {
      await submitReview(card.id, quality);
      setReviewed((prev) => new Set(prev).add(card.id));
      setRatingDone(true);
      // Auto-advance after rating
      setTimeout(() => {
        if (current < cards.length - 1) setCurrent((c) => c + 1);
      }, 600);
    } catch {
      // silently fail rating — don't block the UI
    }
  };

  // ── Render states ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-violet-400 text-xl animate-pulse">Loading deck…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate("/")} className="text-violet-400 underline">
          Go back
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">No cards found in this deck.</p>
      </div>
    );
  }

  const card         = cards[current];
  const isLast       = current === cards.length - 1;
  const isFirst      = current === 0;
  const totalReviewed = reviewed.size;
  const isCompleted  = totalReviewed === cards.length;

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <button
          onClick={() => navigate("/decks")}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          ← All Decks
        </button>

        <div className="text-center">
          <h1 className="text-white font-bold text-lg truncate max-w-xs">
            {deck?.title || "Flashcards"}
          </h1>
          <p className="text-gray-500 text-xs capitalize">{deck?.mode} mode</p>
        </div>

        {/* Notification toggle */}
        <button
          onClick={() => setShowNotifs((v) => !v)}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-all
            ${showNotifs
              ? "border-violet-500 text-violet-400 bg-violet-950/30"
              : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
        >
          🔔 {showNotifs ? "Notifs On" : "Notifs Off"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <ProgressBar current={current + 1} total={cards.length} reviewed={totalReviewed} />
      </div>

      {/* Card counter */}
      <div className="text-center mt-2 text-gray-500 text-sm">
        Card {current + 1} of {cards.length}
        {totalReviewed > 0 && (
          <span className="ml-2 text-violet-400">• {totalReviewed} reviewed</span>
        )}
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <Flashcard
          front={card.front}
          back={card.back}
          type={card.type}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        {/* Flip hint */}
        {!flipped && (
          <p className="text-gray-600 text-sm mt-4 animate-pulse">
            Click the card to reveal the {card.type === "question" ? "answer" : "explanation"}
          </p>
        )}

        {/* SM-2 Rating buttons — shown after flip */}
        {flipped && !ratingDone && (
          <div className="mt-6 w-full max-w-md">
            <p className="text-center text-gray-400 text-sm mb-3">
              How well did you know this?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { q: 1, label: "Again",  emoji: "😞", color: "border-red-800   hover:bg-red-950/40   text-red-400"   },
                { q: 3, label: "Hard",   emoji: "😐", color: "border-yellow-800 hover:bg-yellow-950/40 text-yellow-400" },
                { q: 4, label: "Good",   emoji: "🙂", color: "border-blue-800  hover:bg-blue-950/40  text-blue-400"  },
                { q: 5, label: "Easy",   emoji: "😄", color: "border-green-800 hover:bg-green-950/40 text-green-400" },
                { q: 2, label: "Forgot", emoji: "🤔", color: "border-orange-800 hover:bg-orange-950/40 text-orange-400"},
                { q: 0, label: "Blank",  emoji: "😵", color: "border-gray-700  hover:bg-gray-800     text-gray-400"  },
              ].map(({ q, label, emoji, color }) => (
                <button
                  key={q}
                  onClick={() => handleRate(q)}
                  className={`border rounded-xl py-2 px-3 text-sm font-medium transition-all ${color}`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rated confirmation */}
        {ratingDone && (
          <p className="mt-4 text-green-400 text-sm animate-pulse">
            ✅ Rated! Moving to next card…
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex items-center justify-between max-w-2xl mx-auto w-full">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`px-6 py-3 rounded-xl font-semibold transition-all
            ${isFirst
              ? "bg-gray-900 text-gray-700 cursor-not-allowed"
              : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
        >
          ← Prev
        </button>

        {isLast && isCompleted ? (
          <button
            onClick={() => navigate("/decks")}
            className="px-6 py-3 rounded-xl font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all"
          >
            🎉 Finish
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={isLast}
            className={`px-6 py-3 rounded-xl font-semibold transition-all
              ${isLast
                ? "bg-gray-900 text-gray-700 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white"
              }`}
          >
            Next →
          </button>
        )}
      </div>

      {/* Notification Manager (invisible, handles scheduling) */}
      {showNotifs && <NotificationManager cards={cards} />}
    </div>
  );
}