/**
 * hooks/useNotifications.js — Per-deck notification pool management.
 *
 * Behaviour:
 *   - Each deck can be independently added/removed from the notification pool
 *   - All active decks' cards are merged into one cycling pool
 *   - State persists in localStorage — survives navigation
 *   - One global interval applies to all cards
 *   - Self-scheduling setTimeout to avoid drift
 *
 * localStorage keys:
 *   notif_active        — "true" | "false"
 *   notif_interval      — interval in ms
 *   notif_pool          — JSON: { [deckId]: { title, cards[] } }
 *   notif_card_index    — current position in merged pool
 */

import { useState, useEffect, useRef, useCallback } from "react";

const ANSWER_REVEAL_DELAY  = 15 * 1000;
const STORAGE_ACTIVE_KEY   = "notif_active";
const STORAGE_INTERVAL_KEY = "notif_interval";
const STORAGE_POOL_KEY     = "notif_pool";
const STORAGE_INDEX_KEY    = "notif_card_index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const loadPool = () => {
  try {
    const raw = localStorage.getItem(STORAGE_POOL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const savePool = (pool) =>
  localStorage.setItem(STORAGE_POOL_KEY, JSON.stringify(pool));

const getMergedCards = (pool) =>
  Object.values(pool).flatMap((d) => d.cards);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications(intervalMs = 2 * 60 * 1000) {
  const [permitted,    setPermitted]    = useState(
    () => Notification.permission === "granted"
  );
  const [active,       setActive]       = useState(
    () => localStorage.getItem(STORAGE_ACTIVE_KEY) === "true"
  );
  const [pool,         setPool]         = useState(loadPool);   // { [deckId]: {title, cards} }
  const [nextFireTime, setNextFireTime] = useState(null);

  const timerRef     = useRef(null);
  const answerTimers = useRef([]);
  const activeRef    = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  // ── Show one card ──────────────────────────────────────────────────
  const showCard = useCallback(() => {
    if (!activeRef.current) return;

    const currentPool = loadPool();
    const allCards    = getMergedCards(currentPool);
    if (!allCards.length) return;

    const idx  = parseInt(localStorage.getItem(STORAGE_INDEX_KEY) || "0", 10);
    const card = allCards[idx % allCards.length];
    localStorage.setItem(STORAGE_INDEX_KEY, String(idx + 1));

    if (card.type === "question") {
      const qNotif = new Notification("FlashAI — Question 🧠", {
        body:   card.front,
        icon:   "/favicon.ico",
        tag:    `fq-${card.id}`,
        silent: false,
      });
      const t = setTimeout(() => {
        if (!activeRef.current) return;
        new Notification("FlashAI — Answer ✅", {
          body: card.back, icon: "/favicon.ico",
          tag: `fa-${card.id}`, silent: true,
        });
      }, ANSWER_REVEAL_DELAY);
      answerTimers.current.push(t);
      qNotif.onclick = () => { clearTimeout(t); qNotif.close(); };
    } else {
      new Notification(`FlashAI — ${card.front} 📝`, {
        body: card.back, icon: "/favicon.ico",
        tag: `fn-${card.id}`, silent: false,
      });
    }
  }, []);

  // ── Self-scheduling loop ───────────────────────────────────────────
  const scheduleNext = useCallback((interval) => {
    if (!activeRef.current) return;
    showCard();
    setNextFireTime(new Date(Date.now() + interval));
    timerRef.current = setTimeout(() => {
      const saved = parseInt(
        localStorage.getItem(STORAGE_INTERVAL_KEY) || String(interval), 10
      );
      scheduleNext(saved);
    }, interval);
  }, [showCard]);

  // ── Start global notifications ─────────────────────────────────────
  const startNotifications = useCallback(async (interval) => {
    if (!("Notification" in window)) return;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") { setPermitted(false); return; }

    const eff = interval || intervalMs;
    localStorage.setItem(STORAGE_ACTIVE_KEY,   "true");
    localStorage.setItem(STORAGE_INTERVAL_KEY, String(eff));
    localStorage.setItem(STORAGE_INDEX_KEY,    "0");

    setPermitted(true);
    activeRef.current = true;
    setActive(true);
    clearTimeout(timerRef.current);
    scheduleNext(eff);
  }, [intervalMs, scheduleNext]);

  // ── Stop global notifications ──────────────────────────────────────
  const stopNotifications = useCallback(() => {
    localStorage.setItem(STORAGE_ACTIVE_KEY, "false");
    localStorage.removeItem(STORAGE_INDEX_KEY);
    activeRef.current = false;
    setActive(false);
    setNextFireTime(null);
    clearTimeout(timerRef.current);
    answerTimers.current.forEach(clearTimeout);
    answerTimers.current = [];
  }, []);

  // ── Add deck to pool ───────────────────────────────────────────────
  const addDeck = useCallback((deckId, title, cards) => {
    const current = loadPool();
    current[String(deckId)] = { title, cards };
    savePool(current);
    setPool({ ...current });
    localStorage.setItem(STORAGE_INDEX_KEY, "0"); // reset index on pool change
  }, []);

  // ── Remove deck from pool ──────────────────────────────────────────
  const removeDeck = useCallback((deckId) => {
    const current = loadPool();
    delete current[String(deckId)];
    savePool(current);
    setPool({ ...current });
    localStorage.setItem(STORAGE_INDEX_KEY, "0");

    // If pool is now empty, stop notifications
    if (Object.keys(current).length === 0) {
      stopNotifications();
    }
  }, [stopNotifications]);

  // ── Check if a deck is in the pool ────────────────────────────────
  const isDeckActive = useCallback((deckId) => {
    return String(deckId) in loadPool();
  }, []);

  // ── Total cards in pool ────────────────────────────────────────────
  const totalCards = getMergedCards(pool);

  // ── Auto-resume on mount ───────────────────────────────────────────
  useEffect(() => {
    const wasActive = localStorage.getItem(STORAGE_ACTIVE_KEY) === "true";
    const savedInterval = parseInt(
      localStorage.getItem(STORAGE_INTERVAL_KEY) || String(intervalMs), 10
    );
    const savedPool = loadPool();

    if (wasActive && Notification.permission === "granted" &&
        Object.keys(savedPool).length > 0) {
      activeRef.current = true;
      setActive(true);
      setPermitted(true);
      setPool(savedPool);
      scheduleNext(savedInterval);
    }

    return () => {
      clearTimeout(timerRef.current);
      answerTimers.current.forEach(clearTimeout);
    };
  }, []);

  return {
    permitted,
    active,
    pool,                 // { [deckId]: { title, cards[] } }
    totalCards,           // merged cards array
    nextFireTime,
    startNotifications,
    stopNotifications,
    addDeck,              // (deckId, title, cards) => void
    removeDeck,           // (deckId) => void
    isDeckActive,         // (deckId) => boolean
  };
}