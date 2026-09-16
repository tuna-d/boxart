import { PLATFORMS, type PlatformId } from "@/lib/platforms";

type PlatformPickerProps = {
  selected: readonly PlatformId[];
  labelledBy: string;
};

/** Toggle chips for the platforms a player plays on. Submits every ticked id as `platforms`. */
export function PlatformPicker({ selected, labelledBy }: PlatformPickerProps) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => (
        <label key={platform.id}>
          <input
            type="checkbox"
            name="platforms"
            value={platform.id}
            defaultChecked={selected.includes(platform.id)}
            className="peer sr-only"
          />
          <span className="flex h-10 cursor-pointer items-center gap-2 border-2 border-line px-3 text-sm font-semibold uppercase peer-checked:border-p2 peer-checked:text-p2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-muted peer-checked:[&>.mark]:inline peer-checked:[&>.plus]:hidden">
            <span aria-hidden="true" className="plus font-pixel text-muted">
              +
            </span>
            <span aria-hidden="true" className="mark hidden font-pixel">
              x
            </span>
            {platform.label}
          </span>
        </label>
      ))}
    </div>
  );
}
