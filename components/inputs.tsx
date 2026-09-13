"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { enregistrerFlush } from "@/lib/saisie";
import { inputClass, textareaClass } from "./Field";

type Equivalence = (a: string, b: string) => boolean;
const egal: Equivalence = (a, b) => a === b;

/**
 * Valeur locale d'un champ, écrite dans le store 300 ms après la dernière frappe,
 * immédiatement à la sortie du champ, au démontage ou sur flushSaisies().
 */
export function useSaisieDifferee(valeur: string, onCommit: (v: string) => void, delai = 300, equivalent: Equivalence = egal) {
  const [local, setLocal] = useState(valeur);
  const [precedente, setPrecedente] = useState(valeur);
  const [edition, setEdition] = useState(false);

  // Valeur modifiée ailleurs (réinitialisation, calcul automatique) : on la reprend si l'on n'est pas en train de taper.
  if (valeur !== precedente) {
    setPrecedente(valeur);
    if (!edition && !equivalent(local, valeur)) setLocal(valeur);
  }

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aEcrire = useRef<string | null>(null);
  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  const flush = useCallback(() => {
    if (minuteur.current !== null) {
      clearTimeout(minuteur.current);
      minuteur.current = null;
    }
    const v = aEcrire.current;
    aEcrire.current = null;
    if (v !== null) commitRef.current(v);
    setEdition(false);
  }, []);

  const changer = useCallback(
    (v: string) => {
      setLocal(v);
      setEdition(true);
      aEcrire.current = v;
      if (minuteur.current !== null) clearTimeout(minuteur.current);
      minuteur.current = setTimeout(flush, delai);
    },
    [delai, flush],
  );

  useEffect(() => {
    const retirer = enregistrerFlush(flush);
    return () => {
      retirer();
      flush();
    };
  }, [flush]);

  return { local, changer, flush, remplacer: setLocal };
}

type SaisieTexteProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> & {
  value: string;
  onCommit: (v: string) => void;
  suffixe?: string;
  invalid?: boolean;
};

export function SaisieTexte({ value, onCommit, suffixe, invalid, className = "", onBlur, id, ...rest }: SaisieTexteProps) {
  const { local, changer, flush } = useSaisieDifferee(value, onCommit);
  return (
    <div className="relative">
      <input
        {...rest}
        id={id}
        value={local}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? `${id}-erreur` : undefined}
        onChange={(e) => changer(e.target.value)}
        onBlur={(e) => {
          flush();
          onBlur?.(e);
        }}
        className={`${inputClass} ${suffixe ? "pr-11" : ""} ${className}`}
      />
      {suffixe ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted" aria-hidden="true">
          {suffixe}
        </span>
      ) : null}
    </div>
  );
}

type SaisieZoneProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "defaultValue"> & {
  value: string;
  onCommit: (v: string) => void;
};

export function SaisieZone({ value, onCommit, className = "", onBlur, ...rest }: SaisieZoneProps) {
  const { local, changer, flush } = useSaisieDifferee(value, onCommit);
  return (
    <textarea
      {...rest}
      value={local}
      onChange={(e) => changer(e.target.value)}
      onBlur={(e) => {
        flush();
        onBlur?.(e);
      }}
      className={`${textareaClass} ${className}`}
    />
  );
}

/** undefined = champ vide, null = saisie invalide. */
export function lireNombre(s: string): number | undefined | null {
  const t = s.trim().replace(/[\s']/g, "").replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const nombresEquivalents: Equivalence = (a, b) => lireNombre(a) === lireNombre(b);

type SaisieNombreProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue" | "type" | "min" | "max"> & {
  value: number | undefined;
  onCommit: (n: number | undefined) => void;
  /** Le champ peut rester vide (valeur undefined). */
  videPermis?: boolean;
  entier?: boolean;
  min?: number;
  max?: number;
  suffixe?: string;
  invalid?: boolean;
};

export function SaisieNombre({
  value,
  onCommit,
  videPermis,
  entier,
  min,
  max,
  suffixe,
  invalid,
  className = "",
  onBlur,
  id,
  ...rest
}: SaisieNombreProps) {
  const accepte = useCallback(
    (texte: string): { ok: true; n: number | undefined } | { ok: false } => {
      const n = lireNombre(texte);
      if (n === null) return { ok: false };
      if (n === undefined) return videPermis ? { ok: true, n: undefined } : { ok: false };
      const v = entier ? Math.round(n) : n;
      if ((min !== undefined && v < min) || (max !== undefined && v > max)) return { ok: false };
      return { ok: true, n: v };
    },
    [videPermis, entier, min, max],
  );

  const commit = useCallback(
    (texte: string) => {
      const r = accepte(texte);
      if (r.ok) onCommit(r.n);
    },
    [accepte, onCommit],
  );

  const texteValeur = value === undefined ? "" : String(value);
  const { local, changer, flush, remplacer } = useSaisieDifferee(texteValeur, commit, 300, nombresEquivalents);
  const localInvalide = !accepte(local).ok;

  return (
    <div className="relative">
      <input
        {...rest}
        id={id}
        type="text"
        inputMode={entier ? "numeric" : "decimal"}
        value={local}
        aria-invalid={invalid || localInvalide || undefined}
        aria-describedby={invalid && id ? `${id}-erreur` : undefined}
        onChange={(e) => changer(e.target.value)}
        onBlur={(e) => {
          flush();
          if (!accepte(local).ok) remplacer(texteValeur);
          onBlur?.(e);
        }}
        className={`${inputClass} montant ${suffixe ? "pr-11" : ""} ${className}`}
      />
      {suffixe ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted" aria-hidden="true">
          {suffixe}
        </span>
      ) : null}
    </div>
  );
}

type ChoixProps<T extends string> = {
  id?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function Choix<T extends string>({ id, value, options, onChange, disabled, ariaLabel }: ChoixProps<T>) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        const opt = options.find((o) => o.value === e.target.value);
        if (opt) onChange(opt.value);
      }}
      className={`${inputClass} pr-2`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
