// Formats suisses : montants, dates, durées.

const FUSEAU = "Europe/Zurich";

function milliers(entier: string): string {
  return entier.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** Nombre avec apostrophe des milliers et `decimales` décimales : 2653.4 → « 2'653.40 ». */
export function nombre(n: number, decimales = 2): string {
  const abs = Math.abs(n).toFixed(decimales);
  const [entier, dec] = abs.split(".");
  const signe = n < 0 && Number(abs) !== 0 ? "-" : "";
  return `${signe}${milliers(entier)}${dec !== undefined ? `.${dec}` : ""}`;
}

/** « CHF 2'653.40 ». */
export function chf(n: number): string {
  return `CHF ${nombre(n, 2)}`;
}

function parties(iso: string | Date): Record<string, string> {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const fmt = new Intl.DateTimeFormat("fr-CH", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** « 13.09.2026 » (heure de Zurich). */
export function dateCH(iso: string | Date): string {
  const p = parties(iso);
  return `${p.day}.${p.month}.${p.year}`;
}

/** « 14:41 » (heure de Zurich). */
export function heureCH(iso: string | Date): string {
  const p = parties(iso);
  return `${p.hour}:${p.minute}`;
}

/** Année civile à Zurich. */
export function anneeCH(iso: string | Date): number {
  return Number(parties(iso).year);
}

/** Ajoute des jours à une date ISO. */
export function ajouterJours(iso: string, jours: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

/** Minutes → « 5 h 00 », arrondi au quart d'heure. */
export function dureeHumaine(minutes: number): string {
  const quart = Math.round(Math.max(0, minutes) / 15) * 15;
  const h = Math.floor(quart / 60);
  const m = quart % 60;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** 1 → « 1er », 3 → « 3e ». */
export function ordinal(n: number): string {
  return n === 1 ? "1er" : `${n}e`;
}

/** Première lettre en minuscule. */
export function minusculeInitiale(s: string): string {
  return s.length > 0 ? s.charAt(0).toLocaleLowerCase("fr-CH") + s.slice(1) : s;
}

/** Pluriel simple. */
export function pluriel(n: number, singulier: string, plurielForme?: string): string {
  return `${n} ${n > 1 ? (plurielForme ?? `${singulier}s`) : singulier}`;
}
