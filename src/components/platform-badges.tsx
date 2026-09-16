import { platformLabel, type PlatformId } from "@/lib/platforms";

export function PlatformBadges({ platforms }: { platforms: readonly PlatformId[] }) {
  if (platforms.length === 0) return null;

  return (
    <ul aria-label="Plays on" className="flex flex-wrap gap-2">
      {platforms.map((id) => (
        <li
          key={id}
          className="border-2 border-p2 px-2 py-0.5 font-pixel text-[11px] text-p2 uppercase shadow-[2px_2px_0_var(--color-shade)]"
        >
          {platformLabel(id)}
        </li>
      ))}
    </ul>
  );
}
