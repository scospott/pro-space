import { MODE_FIXTURE, PIECES_MAISON_DEMO } from "./demo/mode";
import { empreintePhotos } from "./hash";
import { nouvelId } from "./id";
import type { Piece, TypeLogement } from "./types";

export const MAX_PHOTOS_PIECE = 8;
export const MAX_PHOTOS_LOGEMENT = 20;

export const PIECES_PAR_DEFAUT: Record<TypeLogement, string[]> = {
  appartement: ["Salon", "Cuisine", "Chambre", "Salle de bain", "Cave"],
  maison: ["Salon", "Cuisine", "Chambre", "Salle de bain", "Cave", "Garage", "Grenier", "Extérieur"],
  local: ["Local", "Réserve"],
  cave_garage: ["Cave", "Garage"],
};

/** Noms des pièces proposées pour un type de logement ; en mode démo scripté, la maison suit la fixture Fribourg. */
export function nomsPiecesParDefaut(type: TypeLogement, demo: boolean = MODE_FIXTURE): string[] {
  if (demo && type === "maison") return [...PIECES_MAISON_DEMO];
  return [...PIECES_PAR_DEFAUT[type]];
}

export function piecesParDefaut(type: TypeLogement): Piece[] {
  const vide = empreintePhotos([]);
  return nomsPiecesParDefaut(type).map((nom) => ({ id: nouvelId("pc"), nom, hashPhotos: vide }));
}

/**
 * Pièces après un changement de type de logement : ajoute les pièces par défaut manquantes du nouveau type et retire
 * seulement les pièces par défaut de l'ancien type, vides et absentes de la nouvelle liste. `occupees` : identifiants
 * des pièces qui ont des photos ou un inventaire, jamais retirées.
 */
export function piecesApresChangementType(pieces: Piece[], ancien: TypeLogement, nouveau: TypeLogement, occupees: Set<string>): Piece[] {
  const anciensNoms = nomsPiecesParDefaut(ancien);
  const nouveauxNoms = nomsPiecesParDefaut(nouveau);
  const gardees = pieces.filter((p) => occupees.has(p.id) || !anciensNoms.includes(p.nom) || nouveauxNoms.includes(p.nom));
  const vide = empreintePhotos([]);
  const ajoutees = nouveauxNoms.filter((nom) => !gardees.some((p) => p.nom === nom)).map((nom) => ({ id: nouvelId("pc"), nom, hashPhotos: vide }));
  return [...gardees, ...ajoutees];
}
