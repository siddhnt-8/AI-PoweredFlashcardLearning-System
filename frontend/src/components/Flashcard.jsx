/**
 * components/Flashcard.jsx — Single flashcard with 3D flip animation.
 *
 * Props:
 *   front   {string}  — Question or note title (shown by default)
 *   back    {string}  — Answer or explanation (shown after flip)
 *   type    {string}  — "question" | "note"
 *   flipped {boolean} — Controlled flip state
 *   onFlip  {fn}      — Called when card is clicked
 */

export default function Flashcard({ front, back, type, flipped, onFlip }) {
  return (
    <div
      onClick={onFlip}
      className="w-full max-w-2xl cursor-pointer"
      style={{ perspective: "1200px" }}
    >
      {/* Card wrapper — rotates on flip */}
      <div
        style={{
          position:        "relative",
          width:           "100%",
          minHeight:       "280px",
          transformStyle:  "preserve-3d",
          transition:      "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform:       flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ─────────────────────────────────────────────────── */}
        <div
          style={{
            position:         "absolute",
            inset:            0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className="rounded-2xl border border-gray-700 bg-gray-900 p-8 flex flex-col justify-between shadow-2xl"
        >
          {/* Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border
              ${type === "question"
                ? "text-violet-400 border-violet-800 bg-violet-950/50"
                : "text-blue-400 border-blue-800 bg-blue-950/50"
              }`}
            >
              {type === "question" ? "❓ Question" : "📝 Note"}
            </span>
            <span className="text-gray-600 text-xs">click to flip →</span>
          </div>

          {/* Front content */}
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-white text-xl font-semibold text-center leading-relaxed">
              {front}
            </p>
          </div>

          {/* Bottom hint */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-700"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────────── */}
        <div
          style={{
            position:         "absolute",
            inset:            0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform:        "rotateY(180deg)",
          }}
          className="rounded-2xl border border-violet-700/50 bg-gradient-to-br from-violet-950/80 to-gray-900 p-8 flex flex-col justify-between shadow-2xl"
        >
          {/* Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border text-violet-300 border-violet-700 bg-violet-900/40">
              {type === "question" ? "✅ Answer" : "💡 Explanation"}
            </span>
            <span className="text-gray-600 text-xs">← click to flip back</span>
          </div>

          {/* Back content */}
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-gray-100 text-lg text-center leading-relaxed">
              {back}
            </p>
          </div>

          {/* Subtle glow */}
          <div className="flex justify-center">
            <div className="w-16 h-0.5 bg-violet-500/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}