import { toneFor } from "@/lib/tone";

const sizes = {
  xs: {
    frame: "shadow-[0_-3px_0_var(--color-ink),0_3px_0_var(--color-ink),-3px_0_0_var(--color-ink),3px_0_0_var(--color-ink)]",
    title: "hidden",
  },
  sm: {
    frame: "shadow-[0_-4px_0_var(--color-ink),0_4px_0_var(--color-ink),-4px_0_0_var(--color-ink),4px_0_0_var(--color-ink)]",
    title: "right-3 bottom-3 left-3 text-sm",
  },
  lg: {
    frame: "shadow-[0_-6px_0_var(--color-ink),0_6px_0_var(--color-ink),-6px_0_0_var(--color-ink),6px_0_0_var(--color-ink)]",
    title: "right-4 bottom-4 left-4 text-2xl",
  },
};

type GameCoverProps = {
  title: string;
  size?: keyof typeof sizes;
  className?: string;
};

export function GameCover({ title, size = "lg", className = "" }: GameCoverProps) {
  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden ${sizes[size].frame} ${className}`}
      style={{ backgroundColor: toneFor(title) }}
    >
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-black/25" />
      <span
        className={`absolute font-pixel leading-none font-bold uppercase text-ink ${sizes[size].title}`}
      >
        {title}
      </span>
    </div>
  );
}
