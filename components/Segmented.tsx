"use client";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  options: readonly Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  ariaLabel: string;
  id?: string;
  size?: "md" | "sm";
  disabled?: boolean;
  invalid?: boolean;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  id,
  size = "md",
  disabled,
  invalid,
}: SegmentedProps<T>) {
  const height = size === "md" ? "h-[46px]" : "h-12";
  const text = size === "md" ? "" : "text-[12.5px]";
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={`flex ${height} overflow-hidden rounded-rs border bg-surface ${invalid ? "border-danger" : "border-line"}`}
    >
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`min-w-0 flex-1 px-2 leading-tight ${text} ${i > 0 ? "border-l border-line" : ""} ${
              on ? "bg-brand-soft font-semibold text-brand" : "font-medium text-muted"
            } disabled:cursor-not-allowed`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
