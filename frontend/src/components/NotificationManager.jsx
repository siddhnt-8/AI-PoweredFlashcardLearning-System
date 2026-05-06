/**
 * components/NotificationManager.jsx — Global notification panel.
 *
 * Shows:
 *   - Active deck pool (each deck independently toggled)
 *   - Live countdown to next notification
 *   - Interval selector
 *   - Global start/stop button
 *
 * This component is mounted at App root level — never unmounts.
 * It renders as a floating panel only when there are decks in the pool
 * OR when explicitly opened.
 */

import { useState, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

const INTERVAL_OPTIONS = [
  { label: "1 min",  value: 1  * 60 * 1000 },
  { label: "2 min",  value: 2  * 60 * 1000 },
  { label: "5 min",  value: 5  * 60 * 1000 },
  { label: "10 min", value: 10 * 60 * 1000 },
];

// ── Live countdown ─────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!targetDate) { setTimeLeft(""); return; }
    const tick = () => {
      const diff = Math.max(0, targetDate - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${String(secs).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// ── Hook context passed from App ───────────────────────────────────────────
// NotificationManager receives the hook instance from App.jsx via props
export default function NotificationManager({ notifHook }) {
  const {
    permitted, active, pool, totalCards,
    nextFireTime, startNotifications, stopNotifications,
    removeDeck,
  } = notifHook;

  const [intervalMs, setIntervalMs] = useState(() => {
    const saved = localStorage.getItem("notif_interval");
    return saved ? parseInt(saved, 10) : 2 * 60 * 1000;
  });
  const [open, setOpen] = useState(false);

  const countdown  = useCountdown(nextFireTime);
  const deckList   = Object.entries(pool);
  const totalCount = totalCards.length;

  // Auto-open panel when first deck is added
  useEffect(() => {
    if (deckList.length > 0) setOpen(true);
  }, [deckList.length]);

  if (!("Notification" in window)) return null;

  return (
    <>
      {/* ── Floating toggle button ──────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Panel */}
        {open && (
          <div className="w-80 bg-gray-900 border border-gray-700 rounded-2xl
            shadow-2xl shadow-black/50 overflow-hidden animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3
              border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <div>
                  <p className="text-white font-bold text-sm">Notifications</p>
                  <p className="text-gray-500 text-xs">
                    {totalCount} card{totalCount !== 1 ? "s" : ""} in{" "}
                    {deckList.length} deck{deckList.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-400 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">

              {/* Countdown */}
              {active && countdown && (
                <div className="bg-violet-950/40 border border-violet-800/50
                  rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-violet-400 text-xs">Next reminder</p>
                    <p className="text-violet-300 text-xl font-black font-mono">
                      {countdown}
                    </p>
                  </div>
                  <span className="text-2xl">⏰</span>
                </div>
              )}

              {/* Active deck pool */}
              {deckList.length > 0 ? (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-widest">
                    Active Decks
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {deckList.map(([deckId, { title, cards }]) => (
                      <div key={deckId}
                        className="flex items-center justify-between bg-gray-800
                          rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">
                            {title}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {cards.length} card{cards.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDeck(deckId)}
                          className="text-gray-600 hover:text-red-400 text-xs
                            ml-2 transition-colors shrink-0"
                          title="Remove from notifications"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-gray-600 text-xs">
                    No decks added yet. Go to a deck and click 🔔 to add it.
                  </p>
                </div>
              )}

              {/* Interval selector */}
              <div>
                <p className="text-gray-400 text-xs font-medium mb-2">
                  Interval
                  {active && <span className="text-gray-600 ml-1">(stop to change)</span>}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => !active && setIntervalMs(opt.value)}
                      disabled={active}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${intervalMs === opt.value
                          ? "border-violet-600 bg-violet-950/40 text-violet-400"
                          : "border-gray-700 bg-gray-800 text-gray-500"
                        }
                        ${active ? "opacity-50 cursor-not-allowed" : "hover:border-gray-500 cursor-pointer"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start / Stop button */}
              {Notification.permission === "denied" ? (
                <p className="text-red-400 text-xs text-center">
                  🚫 Notifications blocked in browser settings
                </p>
              ) : (
                <button
                  onClick={active
                    ? stopNotifications
                    : () => startNotifications(intervalMs)
                  }
                  disabled={deckList.length === 0}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all
                    ${deckList.length === 0
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : active
                      ? "bg-red-950/50 hover:bg-red-900/50 text-red-400 border border-red-800"
                      : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}
                >
                  {active
                    ? "🔕 Stop Notifications"
                    : permitted
                    ? "🔔 Start Notifications"
                    : "🔔 Enable Notifications"
                  }
                </button>
              )}

            </div>
          </div>
        )}

        {/* Floating bell button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-12 h-12 rounded-full flex items-center justify-center
            shadow-lg transition-all duration-200 hover:scale-110 active:scale-95
            ${active
              ? "bg-violet-600 shadow-violet-900/50"
              : deckList.length > 0
              ? "bg-gray-800 border border-gray-600"
              : "bg-gray-900 border border-gray-800"
            }`}
        >
          <span className="text-xl">{active ? "🔔" : "🔕"}</span>
          {/* Active deck count badge */}
          {deckList.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full
              bg-violet-500 text-white text-xs font-bold flex items-center
              justify-center">
              {deckList.length}
            </span>
          )}
        </button>

      </div>
    </>
  );
}