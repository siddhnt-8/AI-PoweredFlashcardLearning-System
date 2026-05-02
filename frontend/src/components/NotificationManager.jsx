/**
 * components/NotificationManager.jsx — Browser notification scheduler UI.
 *
 * Wraps the useNotifications hook and renders a small control panel
 * that lets the user:
 *   - Enable / disable flashcard reminder notifications
 *   - Choose the reminder interval (1 min, 2 min, 5 min, 10 min)
 *   - See permission status
 *
 * Props:
 *   cards {Array} — Flashcard array to cycle through in notifications
 */

import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

const INTERVAL_OPTIONS = [
  { label: "1 min",  value: 1  * 60 * 1000 },
  { label: "2 min",  value: 2  * 60 * 1000 },
  { label: "5 min",  value: 5  * 60 * 1000 },
  { label: "10 min", value: 10 * 60 * 1000 },
];

export default function NotificationManager({ cards = [] }) {
  const [intervalMs, setIntervalMs] = useState(2 * 60 * 1000);

  const { permitted, active, enable, disable } = useNotifications(cards, intervalMs);

  // ── Browser support check ────────────────────────────────────────────
  if (!("Notification" in window)) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
        <p className="text-gray-500 text-sm">
          🔕 Your browser does not support notifications.
        </p>
      </div>
    );
  }

  // ── Permission denied state ──────────────────────────────────────────
  if (Notification.permission === "denied") {
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-2xl p-4">
        <p className="text-red-400 text-sm font-medium">🚫 Notifications blocked</p>
        <p className="text-gray-500 text-xs mt-1">
          Allow notifications in your browser settings to enable this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <div>
            <p className="text-white font-semibold text-sm">Flashcard Reminders</p>
            <p className="text-gray-500 text-xs">
              Get notified to review cards at set intervals
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
          ${active
            ? "text-green-400 border-green-800 bg-green-950/40"
            : "text-gray-500 border-gray-700 bg-gray-800"
          }`}
        >
          {active ? "● Active" : "○ Off"}
        </span>
      </div>

      {/* Interval selector */}
      <div>
        <p className="text-gray-400 text-xs mb-2 font-medium">Reminder interval</p>
        <div className="grid grid-cols-4 gap-2">
          {INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIntervalMs(opt.value)}
              disabled={active}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all
                ${intervalMs === opt.value
                  ? "border-violet-600 bg-violet-950/40 text-violet-400"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                }
                ${active ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {active && (
          <p className="text-gray-600 text-xs mt-1.5">
            Stop notifications to change the interval.
          </p>
        )}
      </div>

      {/* Info box */}
      <div className="bg-gray-800/60 rounded-xl px-4 py-3 space-y-1">
        <p className="text-gray-400 text-xs font-medium">How it works</p>
        <ul className="space-y-1 text-gray-500 text-xs">
          <li>• Q&A cards show the question first</li>
          <li>• Answer appears 15 seconds later</li>
          <li>• Note cards show title + explanation together</li>
          <li>• Cards cycle in deck order</li>
        </ul>
      </div>

      {/* Cards count */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
        <span>🃏 {cards.length} card{cards.length !== 1 ? "s" : ""} in rotation</span>
        {active && (
          <span className="text-violet-400 animate-pulse">
            Sending reminders every{" "}
            {INTERVAL_OPTIONS.find((o) => o.value === intervalMs)?.label}
          </span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={active ? disable : enable}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200
          ${active
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.01] active:scale-[0.99]"
          }`}
      >
        {active
          ? "🔕 Stop Notifications"
          : permitted
          ? "🔔 Start Notifications"
          : "🔔 Enable Notifications"
        }
      </button>

    </div>
  );
}