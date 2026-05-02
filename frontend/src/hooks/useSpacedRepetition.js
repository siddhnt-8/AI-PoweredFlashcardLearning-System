/**
 * hooks/useSpacedRepetition.js — Client-side spaced repetition state manager.
 *
 * Wraps the submitReview API call and tracks per-session review progress.
 *
 * Usage:
 *   const {
 *     submitRating,
 *     reviewed,
 *     ratings,
 *     sessionStats,
 *     isReviewed,
 *     reset,
 *   } = useSpacedRepetition(cards);
 */

import { useState, useCallback, useMemo } from "react";
import { submitReview } from "../api/client";

// Quality label map for display purposes
export const QUALITY_LABELS = {
  0: { label: "Blank",  emoji: "😵", color: "text-gray-400"   },
  1: { label: "Again",  emoji: "😞", color: "text-red-400"    },
  2: { label: "Forgot", emoji: "🤔", color: "text-orange-400" },
  3: { label: "Hard",   emoji: "😐", color: "text-yellow-400" },
  4: { label: "Good",   emoji: "🙂", color: "text-blue-400"   },
  5: { label: "Easy",   emoji: "😄", color: "text-green-400"  },
};

export function useSpacedRepetition(cards = []) {
  // Map of cardId → quality score rated this session
  const [ratings,  setRatings]  = useState({});
  // Map of cardId → API result (next interval, due date, etc.)
  const [results,  setResults]  = useState({});
  // Map of cardId → loading state
  const [pending,  setPending]  = useState({});
  // Map of cardId → error string
  const [errors,   setErrors]   = useState({});

  // ── Submit a rating ──────────────────────────────────────────────────
  const submitRating = useCallback(async (cardId, quality) => {
    // Optimistically mark as reviewed
    setRatings((prev) => ({ ...prev, [cardId]: quality }));
    setPending((prev) => ({ ...prev, [cardId]: true  }));
    setErrors ((prev) => ({ ...prev, [cardId]: ""    }));

    try {
      const res = await submitReview(cardId, quality);
      setResults((prev) => ({ ...prev, [cardId]: res.data }));
    } catch (err) {
      // Revert on failure
      setRatings((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      setErrors((prev) => ({
        ...prev,
        [cardId]: err.message || "Failed to submit review.",
      }));
    } finally {
      setPending((prev) => ({ ...prev, [cardId]: false }));
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────
  const isReviewed = useCallback(
    (cardId) => cardId in ratings,
    [ratings]
  );

  const isPending = useCallback(
    (cardId) => !!pending[cardId],
    [pending]
  );

  const getError = useCallback(
    (cardId) => errors[cardId] || "",
    [errors]
  );

  const getResult = useCallback(
    (cardId) => results[cardId] || null,
    [results]
  );

  // ── Session statistics ───────────────────────────────────────────────
  const sessionStats = useMemo(() => {
    const ratedCards   = Object.entries(ratings);
    const total        = cards.length;
    const reviewed     = ratedCards.length;
    const remaining    = total - reviewed;

    const correct      = ratedCards.filter(([, q]) => q >= 3).length;
    const incorrect    = ratedCards.filter(([, q]) => q <  3).length;
    const accuracy     = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

    const avgQuality   = reviewed > 0
      ? (ratedCards.reduce((sum, [, q]) => sum + q, 0) / reviewed).toFixed(1)
      : 0;

    // Distribution per quality level
    const distribution = Object.fromEntries(
      [0, 1, 2, 3, 4, 5].map((q) => [
        q,
        ratedCards.filter(([, rating]) => rating === q).length,
      ])
    );

    return {
      total,
      reviewed,
      remaining,
      correct,
      incorrect,
      accuracy,
      avgQuality: Number(avgQuality),
      distribution,
      isComplete: reviewed === total && total > 0,
    };
  }, [ratings, cards]);

  // ── Reset session ────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setRatings({});
    setResults({});
    setPending({});
    setErrors({});
  }, []);

  return {
    submitRating,   // (cardId, quality: 0–5) => Promise<void>
    ratings,        // { [cardId]: quality }
    results,        // { [cardId]: ReviewResult }
    sessionStats,   // aggregated session stats
    isReviewed,     // (cardId) => boolean
    isPending,      // (cardId) => boolean
    getError,       // (cardId) => string
    getResult,      // (cardId) => ReviewResult | null
    reset,          // () => void — clear session state
  };
}