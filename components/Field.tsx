import type { ReactNode } from "react";

export const inputClass =
  "h-[46px] w-full min-w-0 rounded-rs border border-line bg-surface px-3 aria-[invalid=true]:border-danger";

export const textareaClass =
  "min-h-[70px] w-full min-w-0 resize-none rounded-rs border border-line bg-surface px-3 py-2.5 aria-[invalid=true]:border-danger";

type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Libellé, champ, aide et erreur. `className` porte l'emprise dans la grille (col-span-*). */
export function Field({ label, htmlFor, required, error, hint, className = "", children }: FieldProps) {
  const errorId = htmlFor ? `${htmlFor}-erreur` : undefined;
  return (
    <div className={`flex min-w-0 flex-col gap-[5px] ${className}`}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-muted">
        {label}
        {required ? (
          <span className="text-accent-ink" aria-hidden="true">
            {" "}*
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obligatoire)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
