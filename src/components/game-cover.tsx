import Image from "next/image";
import { toneFor } from "@/lib/tone";

const sizes = {
  xs: {
    frame: "shadow-[0_-3px_0_var(--color-ink),0_3px_0_var(--color-ink),-3px_0_0_var(--color-ink),3px_0_0_var(--color-ink)]",
    title: "hidden",
    image: "64px",
  },
  sm: {
    frame: "shadow-[0_-4px_0_var(--color-ink),0_4px_0_var(--color-ink),-4px_0_0_var(--color-ink),4px_0_0_var(--color-ink)]",
    title: "right-3 bottom-3 left-3 text-sm",
    image: "(min-width: 1280px) 180px, (min-width: 768px) 22vw, 45vw",
  },
  lg: {
    frame: "shadow-[0_-6px_0_var(--color-ink),0_6px_0_var(--color-ink),-6px_0_0_var(--color-ink),6px_0_0_var(--color-ink)]",
    title: "right-4 bottom-4 left-4 text-2xl",
    image: "300px",
  },
};

type GameCoverProps = {
  title: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  /** Load right away instead of lazily, for the main cover above the fold. */
  eager?: boolean;
  className?: string;
};

export function GameCover({ title, imageUrl, size = "lg", eager = false, className = "" }: GameCoverProps) {
  const settings = sizes[size];

  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden ${settings.frame} ${className}`}
      style={{ backgroundColor: toneFor(title) }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title} cover`}
          fill
          sizes={settings.image}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-black/25" />
          <span className={`absolute font-pixel leading-none font-bold uppercase text-ink ${settings.title}`}>
            {title}
          </span>
        </>
      )}
    </div>
  );
}
