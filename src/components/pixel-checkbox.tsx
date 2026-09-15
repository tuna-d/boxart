type PixelCheckboxProps = {
  name: string;
  label: string;
  hint?: string;
} & (
  | { checked: boolean; onChange: (checked: boolean) => void; defaultChecked?: never }
  | { defaultChecked: boolean; checked?: never; onChange?: never }
);

/** A native checkbox drawn as an arcade style [ ] / [x] box. */
export function PixelCheckbox({ name, label, hint, checked, onChange, defaultChecked }: PixelCheckboxProps) {
  const boxClass =
    "mt-0.5 font-pixel whitespace-pre text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent";

  return (
    <label className="flex w-fit cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        className="peer sr-only"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange && ((event) => onChange(event.target.checked))}
      />
      <span aria-hidden="true" className={`${boxClass} peer-checked:hidden`}>
        [ ]
      </span>
      <span aria-hidden="true" className={`${boxClass} hidden peer-checked:inline`}>
        [x]
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-pixel text-sm">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
