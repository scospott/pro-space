/** Lecture d'un nombre saisi (virgule ou point, apostrophes ignorées). undefined = champ vide, null = saisie invalide. */
export function lireNombre(s: string): number | undefined | null {
  const t = s.trim().replace(/[\s']/g, "").replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
