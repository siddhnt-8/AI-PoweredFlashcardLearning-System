/**
 * DeckListPage.jsx — Lists all generated flashcard decks.
 * Users can view, study, or delete any deck from here.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listDecks, deleteDeck } from "../api/client";

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });

const modeColors = {
  questions: "bg-violet-950/50 text-violet-400 border-violet-800",
  notes:     "bg-blue-950/50   text-blue-400   border-blue-800",
};

const modeIcons = {
  questions: "❓",
  notes:     "📝",
};

export default function DeckListPage() {
  const navigate = useNavigate();

  const [decks,   setDecks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [deleting, setDeleting] = useState(null); // deck id being deleted

  // ── Fetch decks ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDecks();
      setDecks(res.data || []);
    } catch {
      setError("Failed to load decks. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete deck ────────────────────────────────────────────────────────
  const handleDelete = async (e, deckId) => {
    e.stopPropagation(); // don't navigate to deck
    if (!confirm("Delete this deck and all its flashcards?")) return;

    setDeleting(deckId);
    try {
      await deleteDeck(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch {
      alert("Failed to delete deck. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              My <span className="text-violet-400">Decks</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {decks.length} deck{decks.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            + New Deck
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading decks…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-400 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchDecks} className="text-sm underline ml-4">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-6xl">📭</div>
            <h2 className="text-xl font-bold text-gray-300">No decks yet</h2>
            <p className="text-gray-500 max-w-xs">
              Upload a PDF to generate your first set of AI-powered flashcards.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
            >
              Upload PDF
            </button>
          </div>
        )}

        {/* Deck list */}
        {!loading && decks.length > 0 && (
          <div className="space-y-3">
            {decks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => navigate(`/deck/${deck.id}`)}
                className="group relative bg-gray-900 border border-gray-800 hover:border-violet-700 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-violet-900/20 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left — info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Mode badge */}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${modeColors[deck.mode]}`}>
                        {modeIcons[deck.mode]} {deck.mode}
                      </span>
                    </div>

                    <h2 className="text-white font-bold text-lg truncate group-hover:text-violet-300 transition-colors">
                      {deck.title}
                    </h2>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>🃏 {deck.card_count} cards</span>
                      <span>📅 {formatDate(deck.created_at)}</span>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/deck/${deck.id}`); }}
                      className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-all"
                    >
                      Study →
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, deck.id)}
                      disabled={deleting === deck.id}
                      className="text-sm px-3 py-2 border border-gray-700 hover:border-red-700 hover:text-red-400 text-gray-500 rounded-lg transition-all"
                    >
                      {deleting === deck.id ? "…" : "🗑"}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}