// Dossier de référence Rochat (docs/SPEC.md §6.3). Partagé par les tests unitaires et le parcours Playwright.
// Imports relatifs : ce fichier est aussi chargé par Playwright, hors alias @.

import { empreintePhotos } from "../hash";
import { filiereParRegle } from "../pricing";
import type { Devis, Etat, Grille } from "../types";

export const ROCHAT_PIECES = ["Salon", "Cuisine", "Chambre", "Salle de bain", "Cave"] as const;

export type LigneRochat = { piece: (typeof ROCHAT_PIECES)[number]; categoryId: string; quantite: number; etat: Etat };

export const ROCHAT_INVENTAIRE: LigneRochat[] = [
  { piece: "Salon", categoryId: "canape_3p", quantite: 1, etat: "use" },
  { piece: "Salon", categoryId: "meuble_tv", quantite: 1, etat: "bon" },
  { piece: "Salon", categoryId: "table_basse", quantite: 1, etat: "bon" },
  { piece: "Salon", categoryId: "bibliotheque", quantite: 2, etat: "use" },
  { piece: "Salon", categoryId: "carton", quantite: 6, etat: "use" },
  { piece: "Cuisine", categoryId: "refrigerateur", quantite: 1, etat: "use" },
  { piece: "Cuisine", categoryId: "table_cuisine", quantite: 1, etat: "bon" },
  { piece: "Cuisine", categoryId: "chaise", quantite: 4, etat: "bon" },
  { piece: "Cuisine", categoryId: "carton", quantite: 4, etat: "use" },
  { piece: "Chambre", categoryId: "lit_double", quantite: 1, etat: "use" },
  { piece: "Chambre", categoryId: "armoire_3p", quantite: 1, etat: "bon" },
  { piece: "Chambre", categoryId: "commode", quantite: 1, etat: "bon" },
  { piece: "Salle de bain", categoryId: "meuble_sdb", quantite: 1, etat: "use" },
  { piece: "Cave", categoryId: "etagere_metal", quantite: 3, etat: "use" },
  { piece: "Cave", categoryId: "velo", quantite: 1, etat: "bon" },
  { piece: "Cave", categoryId: "carton", quantite: 10, etat: "use" },
  { piece: "Cave", categoryId: "pneu", quantite: 4, etat: "hs" },
];

export const ROCHAT_CLIENT = {
  civilite: "madame",
  prenom: "Isabelle",
  nom: "Rochat",
  email: "isabelle.rochat@bluewin.ch",
  telephone: "079 412 88 30",
} as const;

export const ROCHAT_LIEU = {
  rue: "Avenue de Béthusy 24",
  npa: "1005",
  localite: "Lausanne",
  pieces: "3,5",
  surfaceM2: 75,
  etage: 3,
  portageM: 25,
} as const;

export function devisRochat(grille: Grille): Devis {
  const vide = empreintePhotos([]);
  const pieces = ROCHAT_PIECES.map((nom, i) => ({ id: `piece_${i + 1}`, nom, hashPhotos: vide }));
  const idPiece = new Map(pieces.map((p) => [p.nom, p.id]));
  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));
  return {
    id: "dv_rochat",
    numero: "",
    createdAt: "2026-09-13T12:00:00.000Z",
    statut: "brouillon",
    client: { ...ROCHAT_CLIENT },
    lieu: {
      ...ROCHAT_LIEU,
      type: "appartement",
      ascenseur: false,
      stationnement: "zone_bleue",
    },
    prestation: {
      type: "debarras_nettoyage",
      destination: "tri",
      typeNettoyage: "fin_de_bail",
      dateSouhaitee: "Semaine du 21.09.2026",
      remarques: "Vider entièrement, conserver le piano (non compté)",
    },
    trajet: { kmAller: 49, minAller: 45, source: "calcule", libelle: "Payerne – Lausanne" },
    pieces,
    photos: [],
    inventaire: ROCHAT_INVENTAIRE.map((l, i) => ({
      id: `item_${i + 1}`,
      pieceId: idPiece.get(l.piece) ?? "",
      categoryId: l.categoryId,
      label: categories.get(l.categoryId)?.label ?? l.categoryId,
      quantite: l.quantite,
      confiance: 0.9,
      etat: l.etat,
      filiere: filiereParRegle(categories.get(l.categoryId), l.etat, "tri"),
      photos: [1],
      origine: "ia",
    })),
    nettoyageInclus: true,
  };
}
