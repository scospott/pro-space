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
