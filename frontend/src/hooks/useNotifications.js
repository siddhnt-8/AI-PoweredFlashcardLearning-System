/**
 * hooks/useNotifications.js — Browser notification scheduling for flashcards.
 *
 * Usage:
 *   const { permitted, enable, disable, active } = useNotifications(cards, intervalMs);
 *
 * Behaviour:
 *   - Requests browser notification permission on enable()
 *   - Cycles through cards at the given interval (default 2 minutes)
 *   - For Q&A cards: shows the question first; a follow-up notification
 *     reveals the answer 15 seconds later if the user hasn't clicked
 *   - For note cards: shows front + back together
 *   - Cleans up all timers on disable() or unmount
 */

import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_INTERVAL_MS   = 2 * 60 * 1000; // 2 minutes between cards
const ANSWER_REVEAL_DELAY   = 15 * 1000;      // 15 seconds to reveal answer

export function useNotifications(cards = [], intervalMs = DEFAULT_INTERVAL_MS) {
  const [permitted, setPermitted] = useState(
    () => Notification.permission === "granted"
  );
  const [active,    setActive]    = useState(false);

  const intervalRef   = useRef(null);
  const answerTimers  = useRef([]);
  const cardIndexRef  = useRef(0);

  // ── Request permission & start ─────────────────────────────────────
  const enable = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications.");
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      setPermitted(false);
      return;
    }

    setPermitted(true);
    setActive(true);
  }, []);

  // ── Stop & clean up ────────────────────────────────────────────────
  const disable = useCallback(() => {
    setActive(false);
    clearInterval(intervalRef.current);
    answerTimers.current.forEach(clearTimeout);
    answerTimers.current = [];
  }, []);

  // ── Show one card notification ─────────────────────────────────────
  const showCard = useCallback(() => {
    if (!cards.length) return;

    const card  = cards[cardIndexRef.current % cards.length];
    cardIndexRef.current += 1;

    if (card.type === "question") {
      // Step 1: show the question
      const questionNotif = new Notification("FlashAI — Question", {
        body:    card.front,
        icon:    "/favicon.ico",
        tag:     `flashcard-q-${card.id}`,
        silent:  false,
      });

      // Step 2: reveal the answer after delay
      const timer = setTimeout(() => {
        new Notification("FlashAI — Answer", {
          body:   card.back,
          icon:   "/favicon.ico",
          tag:    `flashcard-a-${card.id}`,
          silent: true,
        });
      }, ANSWER_REVEAL_DELAY);

      answerTimers.current.push(timer);

      // Clicking the question notification closes the pending answer reveal
      questionNotif.onclick = () => {
        clearTimeout(timer);
        questionNotif.close();
      };
    } else {
      // Note card — show front + back together
      new Notification(`FlashAI — ${card.front}`, {
        body:   card.back,
        icon:   "/favicon.ico",
        tag:    `flashcard-n-${card.id}`,
        silent: false,
      });
    }
  }, [cards]);

  // ── Start/stop interval when active changes ────────────────────────
  useEffect(() => {
    if (active && permitted && cards.length > 0) {
      // Show immediately, then on interval
      showCard();
      intervalRef.current = setInterval(showCard, intervalMs);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      clearInterval(intervalRef.current);
      answerTimers.current.forEach(clearTimeout);
      answerTimers.current = [];
    };
  }, [active, permitted, cards, intervalMs, showCard]);

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      answerTimers.current.forEach(clearTimeout);
    };
  }, []);

  return {
    permitted,  // boolean — permission granted
    active,     // boolean — notifications currently running
    enable,     // fn — request permission and start
    disable,    // fn — stop notifications
  };
}