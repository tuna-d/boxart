import type { RatingStats } from "@/lib/types";

type ScorePanelProps = {
  stats: RatingStats;
  title?: string;
  /** Names what was counted, such as "player" on a game page or "game" on a profile. */
  countNoun?: string;
  label?: string;
};

export function ScorePanel({
  stats,
  title = "Hi-score",
  countNoun = "player",
  label = "Player ratings",
}: ScorePanelProps) {
  const peak = Math.max(...stats.distribution, 1);

  return (
    <aside aria-label={label} className="flex h-fit flex-col gap-3 border-2 border-line p-5">
      <span className="font-pixel text-sm text-ink-soft">{title}</span>
      <span className="font-pixel text-[80px] leading-none text-accent">
        {stats.average.toFixed(1)}
      </span>
      <span className="text-[13px] text-muted uppercase">
        Avg of {stats.count.toLocaleString("en-US")} {stats.count === 1 ? countNoun : `${countNoun}s`}
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
