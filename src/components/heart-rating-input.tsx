"use client";

import { useState } from "react";
import { PixelHeart } from "@/components/heart-rating";

const keySteps: Record<string, number> = {
  ArrowRight: 0.5,
  ArrowUp: 0.5,
  ArrowLeft: -0.5,
  ArrowDown: -0.5,
};

function clampRating(value: number) {
  return Math.min(Math.max(value, 0), 5);
}

type HeartRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  labelledBy: string;
};

export function HeartRatingInput({ value, onChange, labelledBy }: HeartRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  // The left half of a heart picks a half point, the right half picks the whole heart.
  function valueAt(event: React.MouseEvent<HTMLElement>, position: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? position - 0.5 : position;
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key in keySteps) {
      onChange(clampRating(value + keySteps[event.key]));
    } else if (event.key === "Home" || event.key === "Delete" || event.key === "Backspace") {
      onChange(0);
    } else if (event.key === "End") {
      onChange(5);
    } else {
      return;
    }
    event.preventDefault();
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={value === 0 ? "No rating" : `${value} out of 5 hearts`}
      onKeyDown={handleKeyDown}
      onPointerLeave={() => setHover(null)}
      className="flex w-fit gap-1.5 py-1"
    >
      {[1, 2, 3, 4, 5].map((position) => {
        const fill = Math.min(Math.max(shown - (position - 1), 0), 1);
        return (
          <span
            key={position}
            className="relative h-[31px] w-9 cursor-pointer"
            onPointerMove={(event) => setHover(valueAt(event, position))}
            onClick={(event) => {
              const next = valueAt(event, position);
              onChange(next === value ? 0 : next);
            }}
          >
            <PixelHeart className="text-line" />
            {fill > 0 && (
              <PixelHeart
                className={hover === null ? "text-p1" : "text-p1/70"}
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
