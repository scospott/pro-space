// État des analyses par pièce (ré-analyse partielle, docs/SPEC.md §3 règle UX 2). Fonctions pures.
import type { Devis, Piece } from "./types";

export function photosParPiece(d: Pick<Devis, "photos">): Map<string, number> {
  const n = new Map<string, number>();
  for (const photo of d.photos) n.set(photo.pieceId, (n.get(photo.pieceId) ?? 0) + 1);
  return n;
}

/** Pièces à envoyer à l'analyse : elles ont des photos et aucune analyse réussie sur ces photos-là. */
export function piecesAAnalyser(d: Pick<Devis, "photos" | "pieces">): Piece[] {
  const n = photosParPiece(d);
  return d.pieces.filter((p) => (n.get(p.id) ?? 0) > 0 && (p.analyse?.status !== "ok" || p.analyse.hash !== p.hashPhotos));
}

/** Pièces analysées dont toutes les photos ont été retirées depuis : leur inventaire détecté est à oublier. */
export function piecesAOublier(d: Pick<Devis, "photos" | "pieces">): Piece[] {
  const n = photosParPiece(d);
  return d.pieces.filter((p) => (n.get(p.id) ?? 0) === 0 && p.analyse !== undefined && p.analyse.hash !== p.hashPhotos);
}

/** Pièces analysées avec succès dont les photos ont changé depuis (bandeau de l'écran devis). */
export function piecesModifiees(d: Pick<Devis, "pieces">): Piece[] {
  return d.pieces.filter((p) => p.analyse?.status === "ok" && p.analyse.hash !== p.hashPhotos);
}

/** L'inventaire correspond aux photos actuelles : « Voir le devis » plutôt que « Générer le devis ». */
export function inventaireAJour(d: Pick<Devis, "photos" | "pieces" | "inventaire">): boolean {
  const dejaGenere = d.inventaire.length > 0 || d.pieces.some((p) => p.analyse?.status === "ok");
  return dejaGenere && piecesAAnalyser(d).length === 0 && piecesAOublier(d).length === 0;
}
