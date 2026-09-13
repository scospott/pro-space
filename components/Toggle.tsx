"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
};

/** Interrupteur 44 × 26 dans une zone tactile de 48 px. */
export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-rs disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span
        className={`relative block h-[26px] w-11 rounded-full transition-colors ${checked ? "bg-ok" : "bg-line"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : ""
          }`}
        />
      </span>
    </button>
  );
}
