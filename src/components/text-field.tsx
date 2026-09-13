import type { ComponentProps } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: string;
};

export function TextField({ id, label, hint, className = "", ...inputProps }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-pixel text-sm text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={`h-12 border-2 border-line bg-transparent px-3 text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none ${className}`}
        {...inputProps}
      />
      {hint && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}
