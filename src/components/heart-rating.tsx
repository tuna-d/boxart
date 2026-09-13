const HEART_PATH = "M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z";

const sizes = {
  xs: "h-3 w-3.5",
  sm: "h-4 w-[18px]",
  lg: "h-[21px] w-6",
};

type HeartRatingProps = {
  value: number;
  size?: keyof typeof sizes;
};

export function HeartRating({ value, size = "sm" }: HeartRatingProps) {
  return (
    <span role="img" aria-label={`${value} out of 5`} className="flex gap-[3px]">
      {[1, 2, 3, 4, 5].map((position) => {
        const fill = Math.min(Math.max(value - (position - 1), 0), 1);
        return (
          <span key={position} className={`relative ${sizes[size]}`}>
            <PixelHeart className="text-line" />
            {fill > 0 && (
              <PixelHeart
                className="text-p1"
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function PixelHeart({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 7 6"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={style}
    >
      <path d={HEART_PATH} />
    </svg>
  );
}
