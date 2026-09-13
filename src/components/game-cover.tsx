const placeholderTones = ["#22404d", "#3b2a4d", "#4a2f24", "#233d2e", "#2d3350", "#4a2438"];

function toneFor(title: string) {
  let hash = 0;
  for (const char of title) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return placeholderTones[hash % placeholderTones.length];
}

type GameCoverProps = {
  title: string;
  className?: string;
};

export function GameCover({ title, className = "" }: GameCoverProps) {
  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden shadow-[0_-6px_0_var(--color-ink),0_6px_0_var(--color-ink),-6px_0_0_var(--color-ink),6px_0_0_var(--color-ink)] ${className}`}
      style={{ backgroundColor: toneFor(title) }}
    >
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-black/25" />
      <span className="absolute right-4 bottom-4 left-4 font-pixel text-2xl leading-none font-bold uppercase text-ink">
        {title}
      </span>
    </div>
  );
}
