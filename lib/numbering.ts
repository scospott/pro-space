import { anneeCH } from "./format";

/** Numéro de devis au format AAAA-NNNN : numeroSuivant(413, 2026-09-13) → « 2026-0413 ». */
export function numeroSuivant(compteur: number, date: Date | string): string {
  return `${anneeCH(date)}-${String(Math.max(0, Math.trunc(compteur))).padStart(4, "0")}`;
}
