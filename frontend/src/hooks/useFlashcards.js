/**
 * hooks/useFlashcards.js — Fetch and manage flashcard/deck state.
 *
 * Usage:
 *   const { decks, loading, error, fetchDecks, removeDecks } = useFlashcards();
 *   const { deck, cards, loading, error } = useFlashcards(deckId);
 */

import { useState, useEffect, useCallback } from "react";
import { listDecks, getDeck, deleteDeck } from "../api/client";

export function useFlashcards(deckId = null) {
  const [decks,   setDecks]   = useState([]);
  const [deck,    setDeck]    = useState(null);
  const [cards,   setCards]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Fetch all decks ──────────────────────────────────────────────────
  const fetchDecks = useCallback(async (skip = 0, limit = 20) => {
    setLoading(true);
    setError("");
    try {
      const res = await listDecks(skip, limit);
      setDecks(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load decks.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch single deck ────────────────────────────────────────────────
  const fetchDeck = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDeck(id);
      setDeck(res.data);
      setCards(res.data?.flashcards || []);
    } catch (err) {
      setError(err.message || "Failed to load deck.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Delete a deck ────────────────────────────────────────────────────
  const removeDeck = useCallback(async (id) => {
    try {
      await deleteDeck(id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete deck.");
      return false;
    }
  }, []);

  // ── Auto-fetch on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
    } else {
      fetchDecks();
    }
  }, [deckId]);

  return {
    // List mode
    decks,
    fetchDecks,
    removeDeck,
    // Detail mode
    deck,
    cards,
    fetchDeck,
    // Shared
    loading,
    error,
    setError,
  };
}