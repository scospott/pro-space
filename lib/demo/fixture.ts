// Rejeu de la fixture Fribourg : fonctions pures, sans réseau. Le chiffrage reste celui du moteur et de la grille du store.
import { nouvelId } from "../id";
import { filiereEffective } from "../pricing";
import type { Destination, Grille, InventaireItem, Trajet } from "../types";
import { DEMO_INVENTAIRE, type PieceFixture } from "./fixture-fribourg";

export const PHRASE_MIROIR = "Miroir soleil doré non compté, conservé selon les remarques du dossier.";
export const REMARQUE_PIECE_INCONNUE = "Aucun objet reconnu, ajoutez-les à la main";
export const DELAI_TRAJET_MS = 600;

/** Minuscules, sans accents, espaces réduits ; « chambre » seul vaut « chambre 1 ». */
export function normaliserNomPiece(nom: string): string {
  const cle = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return cle === "chambre" ? "chambre 1" : cle;
}

/** Inventaire scripté d'une pièce, ou null si la pièce n'existe pas dans la fixture. */
export function inventaireFixture(nomPiece: string, remarquesDossier: string | undefined): PieceFixture | null {
  const cle = normaliserNomPiece(nomPiece);
  if (!Object.prototype.hasOwnProperty.call(DEMO_INVENTAIRE, cle)) return null;
  const piece = DEMO_INVENTAIRE[cle];
  const items = piece.items.map((item) => ({ ...item, photos: [...item.photos] }));
  if (cle !== "salon") return { remarques: piece.remarques, items };

  const miroirConserve = (remarquesDossier ?? "").toLowerCase().includes("miroir");
  return {
    remarques: miroirConserve ? `${PHRASE_MIROIR} ${piece.remarques}` : piece.remarques,
    items: items.map((item) => (item.categoryId === "miroir_cadre" ? { ...item, quantite: miroirConserve ? 4 : 5 } : item)),
  };
}

/** Lignes d'inventaire prêtes pour le store : sans fusion, origine 'ia', filière initiale selon la destination saisie. */
export function itemsDepuisFixture(fixture: PieceFixture, pieceId: string, destination: Destination, grille: Grille): InventaireItem[] {
  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));
  return fixture.items.map((item) => ({
    id: nouvelId("it"),
    pieceId,
    categoryId: item.categoryId,
    label: item.label,
    quantite: item.quantite,
    confiance: item.confiance,
    etat: item.etat,
    filiere: filiereEffective({ etat: item.etat, filiere: "dechetterie" }, categories.get(item.categoryId), destination),
    photos: [...item.photos],
    origine: "ia",
  }));
}

/** 2 000 ms + 800 ms par photo, ±20 % : les pièces se terminent dans le désordre, comme des appels réels en parallèle. */
export function delaiSimule(nbPhotos: number, aleatoire: () => number = Math.random): number {
  return Math.round((2000 + 800 * nbPhotos) * (0.8 + 0.4 * aleatoire()));
}

/** Trajet scripté pour Fribourg, ou null pour laisser le calcul réel. */
export function trajetFixture(localite: string): Trajet | null {
  if (!localite.toLowerCase().includes("fribourg")) return null;
  return { kmAller: 27, minAller: 30, source: "calcule", libelle: "Payerne – Fribourg" };
}
