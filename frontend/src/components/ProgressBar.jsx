/**
 * components/ProgressBar.jsx — Study session progress indicator.
 *
 * Props:
 *   current  {number} — Current card index (1-based)
 *   total    {number} — Total number of cards in deck
 *   reviewed {number} — Number of cards rated so far
 */

export default function ProgressBar({ current = 1, total = 1, reviewed = 0 }) {
  const progressPct = total > 0 ? Math.round((current / total) * 100)  : 0;
  const reviewedPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">

      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Progress{" "}
          <span className="text-violet-400 font-semibold">{progressPct}%</span>
        </span>
        <span className="text-gray-500">
          Reviewed{" "}
          <span className="text-green-400 font-semibold">{reviewed}</span>
          <span className="text-gray-600"> / {total}</span>
        </span>
      </div>

      {/* Track */}
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">

        {/* Reviewed layer (green, underneath) */}
        <div
          className="absolute inset-y-0 left-0 bg-green-700/50 rounded-full transition-all duration-500"
          style={{ width: `${reviewedPct}%` }}
        />

        {/* Current position layer (violet, on top) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300
            bg-gradient-to-r from-violet-600 to-violet-400"
          style={{ width: `${progressPct}%` }}
        />

        {/* Animated shimmer on the progress bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: `${progressPct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
            animate-[shimmer_1.8s_infinite]"
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>
      </div>

      {/* Segment ticks — one per card */}
      {total <= 30 && (
        <div className="flex gap-0.5 w-full">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-sm transition-all duration-300
                ${i < reviewed
                  ? "bg-green-600"
                  : i < current
                  ? "bg-violet-500"
                  : "bg-gray-800"
                }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}