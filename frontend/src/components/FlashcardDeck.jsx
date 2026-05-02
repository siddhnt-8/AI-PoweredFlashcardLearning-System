/**
 * components/FlashcardDeck.jsx — Full deck navigator with flip, rating & progress.
 *
 * Self-contained component that manages:
 *   - Current card index
 *   - Flip state per card
 *   - SM-2 rating via useSpacedRepetition hook
 *   - Session completion screen
 *
 * Props:
 *   cards    {Array}  — Array of flashcard objects { id, type, front, back }
 *   deckTitle {string} — Deck name shown in the header
 *   onFinish  {fn}    — Called when session is complete
 */

import { useState, useEffect } from "react";
import Flashcard from "./Flashcard";
import ProgressBar from "./ProgressBar";
import { useSpacedRepetition, QUALITY_LABELS } from "../hooks/useSpacedRepetition";

export default function FlashcardDeck({ cards = [], deckTitle = "", onFinish }) {
  const [current, setCurrent] = useState(0);
  const [flipped,  setFlipped] = useState(false);

  const {
    submitRating,
    sessionStats,
    isReviewed,
    isPending,
    getError,
    getResult,
    reset,
  } = useSpacedRepetition(cards);

  // Reset flip when card changes
  useEffect(() => {
    setFlipped(false);
  }, [current]);

  if (!cards.length) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        No cards in this deck.
      </div>
    );
  }

  const card    = cards[current];
  const isFirst = current === 0;
  const isLast  = current === cards.length - 1;

  // ── Rate and optionally advance ──────────────────────────────────────
  const handleRate = async (quality) => {
    await submitRating(card.id, quality);
    if (!isLast) {
      setTimeout(() => setCurrent((c) => c + 1), 500);
    }
  };

  // ── Restart session ──────────────────────────────────────────────────
  const handleRestart = () => {
    reset();
    setCurrent(0);
    setFlipped(false);
  };

  // ── Completion screen ────────────────────────────────────────────────
  if (sessionStats.isComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-6 py-10">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-black text-white">Session Complete!</h2>
        <p className="text-gray-400">You reviewed all {sessionStats.total} cards.</p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Accuracy",    value: `${sessionStats.accuracy}%`,      color: "text-violet-400" },
            { label: "Correct",     value: sessionStats.correct,              color: "text-green-400"  },
            { label: "Needs Work",  value: sessionStats.incorrect,            color: "text-red-400"    },
            { label: "Avg Quality", value: `${sessionStats.avgQuality} / 5`,  color: "text-blue-400"   },
            { label: "Cards Done",  value: sessionStats.reviewed,             color: "text-white"      },
            { label: "Total Cards", value: sessionStats.total,                color: "text-white"      },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Quality distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left">
          <p className="text-gray-400 text-sm font-medium mb-3">Rating breakdown</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1, 0].map((q) => {
              const count   = sessionStats.distribution[q] || 0;
              const pct     = sessionStats.reviewed > 0
                ? Math.round((count / sessionStats.reviewed) * 100)
                : 0;
              const { label, emoji, color } = QUALITY_LABELS[q];
              return (
                <div key={q} className="flex items-center gap-3">
                  <span className={`text-sm w-20 ${color}`}>{emoji} {label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
          >
            🔁 Study Again
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all"
            >
              ✅ Finish
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Main deck view ───────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* Progress */}
      <div className="w-full max-w-2xl">
        <ProgressBar
          current={current + 1}
          total={cards.length}
          reviewed={sessionStats.reviewed}
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Card {current + 1} of {cards.length}</span>
          <span>{sessionStats.reviewed} reviewed • {sessionStats.remaining} left</span>
        </div>
      </div>

      {/* Flashcard */}
      <Flashcard
        front={card.front}
        back={card.back}
        type={card.type}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {/* Flip hint */}
      {!flipped && (
        <p className="text-gray-600 text-sm animate-pulse">
          Click the card to reveal the {card.type === "question" ? "answer" : "explanation"}
        </p>
      )}

      {/* Rating buttons — after flip */}
      {flipped && !isReviewed(card.id) && (
        <div className="w-full max-w-2xl">
          <p className="text-center text-gray-400 text-sm mb-3">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { q: 5, label: "Easy",   emoji: "😄", cls: "border-green-800  hover:bg-green-950/40  text-green-400"  },
              { q: 4, label: "Good",   emoji: "🙂", cls: "border-blue-800   hover:bg-blue-950/40   text-blue-400"   },
              { q: 3, label: "Hard",   emoji: "😐", cls: "border-yellow-800 hover:bg-yellow-950/40 text-yellow-400" },
              { q: 2, label: "Forgot", emoji: "🤔", cls: "border-orange-800 hover:bg-orange-950/40 text-orange-400" },
              { q: 1, label: "Again",  emoji: "😞", cls: "border-red-800    hover:bg-red-950/40    text-red-400"    },
              { q: 0, label: "Blank",  emoji: "😵", cls: "border-gray-700   hover:bg-gray-800      text-gray-400"   },
            ].map(({ q, label, emoji, cls }) => (
              <button
                key={q}
                onClick={() => handleRate(q)}
                disabled={isPending(card.id)}
                className={`border rounded-xl py-2.5 px-3 text-sm font-medium transition-all ${cls}
                  ${isPending(card.id) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
          {getError(card.id) && (
            <p className="text-red-400 text-xs text-center mt-2">{getError(card.id)}</p>
          )}
        </div>
      )}

      {/* Rated confirmation + next interval */}
      {isReviewed(card.id) && (
        <div className="text-center space-y-1">
          <p className="text-green-400 text-sm">✅ Rated!</p>
          {getResult(card.id) && (
            <p className="text-gray-600 text-xs">
              Next review in {getResult(card.id).next_interval} day(s)
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4 w-full max-w-2xl justify-between">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className={`px-6 py-3 rounded-xl font-semibold transition-all
            ${isFirst
              ? "bg-gray-900 text-gray-700 cursor-not-allowed"
              : "bg-gray-800 hover:bg-gray-700 text-white"}`}
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 overflow-hidden max-w-xs">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all flex-shrink-0
                ${i === current
                  ? "bg-violet-400 w-4"
                  : isReviewed(c.id)
                  ? "bg-violet-700"
                  : "bg-gray-700 hover:bg-gray-500"
                }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((c) => c + 1)}
          disabled={isLast}
          className={`px-6 py-3 rounded-xl font-semibold transition-all
            ${isLast
              ? "bg-gray-900 text-gray-700 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-500 text-white"}`}
        >
          Next →
        </button>
      </div>

    </div>
  );
}