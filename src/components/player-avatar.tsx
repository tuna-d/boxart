import { toneFor } from "@/lib/tone";

const sizes = {
  sm: "h-10 w-10 text-lg",
  lg: "h-28 w-28 text-5xl",
};

type PlayerAvatarProps = {
  username: string;
  size?: keyof typeof sizes;
};

export function PlayerAvatar({ username, size = "sm" }: PlayerAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-pixel font-bold text-ink uppercase ${sizes[size]}`}
      style={{ backgroundColor: toneFor(username) }}
    >
      {username.charAt(0)}
    </span>
  );
}
