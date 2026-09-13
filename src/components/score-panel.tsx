import type { RatingStats } from "@/lib/types";

export function ScorePanel({ stats }: { stats: RatingStats }) {
  const peak = Math.max(...stats.distribution, 1);

  return (
    <aside aria-label="Player ratings" className="flex h-fit flex-col gap-3 border-2 border-line p-5">
      <span className="font-pixel text-sm text-ink-soft">Hi-score</span>
      <span className="text-[88px] leading-none font-semibold tracking-tight text-accent tabular-nums">
        {stats.average.toFixed(1)}
      </span>
      <span className="text-[13px] text-muted uppercase">
        Avg of {stats.count.toLocaleString("en-US")} players
      </span>
      <div className="mt-2 flex h-[70px] items-end gap-1.5">
        {stats.distribution.map((count, index) => (
          <div
            key={index}
            title={`${index + 1} hearts: ${count.toLocaleString("en-US")}`}
            className={`flex-1 ${count === peak ? "bg-accent" : "bg-line"}`}
            style={{ height: `${Math.max((count / peak) * 100, 6)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted">
        {[1, 2, 3, 4, 5].map((hearts) => (
          <span key={hearts} className="flex-1 text-center">
            {hearts}
          </span>
        ))}
      </div>
    </aside>
  );
}
