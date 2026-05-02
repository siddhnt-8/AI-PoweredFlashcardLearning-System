/**
 * components/ModeSelector.jsx — Toggle between Q&A and Notes generation mode.
 *
 * Props:
 *   selected {string} — Currently selected mode: "questions" | "notes"
 *   onChange {fn}     — Called with the new mode string when selection changes
 */

const MODES = [
  {
    id:       "questions",
    icon:     "❓",
    label:    "Q&A Flashcards",
    tagline:  "Best for exams & active recall",
    desc:     "AI generates question and answer pairs from your PDF. Ideal for testing your knowledge and memorising key concepts.",
    bullets:  ["Question on front", "Answer on back", "SM-2 spaced repetition"],
    accent:   {
      border:  "border-violet-600",
      bg:      "bg-violet-950/30",
      badge:   "bg-violet-950/50 text-violet-400 border-violet-800",
      bullet:  "bg-violet-500",
      glow:    "shadow-violet-900/30",
      ring:    "ring-violet-600",
    },
  },
  {
    id:       "notes",
    icon:     "📝",
    label:    "Short Notes",
    tagline:  "Best for quick review & reference",
    desc:     "AI extracts key topics and writes concise summaries. Great for revision overviews and concept mapping.",
    bullets:  ["Topic title on front", "Explanation on back", "Scannable summaries"],
    accent:   {
      border:  "border-blue-600",
      bg:      "bg-blue-950/30",
      badge:   "bg-blue-950/50 text-blue-400 border-blue-800",
      bullet:  "bg-blue-500",
      glow:    "shadow-blue-900/30",
      ring:    "ring-blue-600",
    },
  },
];

export default function ModeSelector({ selected, onChange }) {
  return (
    <div className="space-y-3">

      {/* Section label */}
      <div>
        <p className="text-white font-semibold text-sm">Generation Mode</p>
        <p className="text-gray-500 text-xs mt-0.5">
          Choose how you want the AI to process your PDF
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const isSelected = selected === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`relative text-left rounded-2xl border p-5 transition-all duration-200
                ${isSelected
                  ? `${m.accent.border} ${m.accent.bg} shadow-lg ${m.accent.glow} ring-1 ${m.accent.ring}`
                  : "border-gray-800 bg-gray-900 hover:border-gray-600"
                }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{m.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${m.accent.badge}`}>
                    {m.tagline}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-xs leading-relaxed mb-3">
                {m.desc}
              </p>

              {/* Bullets */}
              <ul className="space-y-1.5">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.accent.bullet}`} />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

    </div>
  );
}