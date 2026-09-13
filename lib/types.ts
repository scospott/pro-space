// Modèle de données (docs/SPEC.md §4), complété pour LigneDevis et Totaux.

export type Civilite = "madame" | "monsieur" | "societe";
export type TypeLogement = "appartement" | "maison" | "local" | "cave_garage";
export type Stationnement = "prive" | "rue_libre" | "zone_bleue" | "centre_difficile";
export type TypePrestation = "debarras" | "nettoyage" | "debarras_nettoyage";
export type Destination = "dechetterie" | "ressourcerie" | "tri";
export type TypeNettoyage = "fin_de_bail" | "apres_travaux" | "insalubre";
export type Filiere = "dechetterie" | "ressourcerie" | "sens" | "special";
export type Etat = "bon" | "use" | "hs";

export interface Client {
  civilite: Civilite;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

export interface Lieu {
  rue: string;
  npa: string;
  localite: string;
  type: TypeLogement;
  pieces?: string;
  surfaceM2?: number;
  etage: number;
  ascenseur: boolean;
  portageM: number;
  stationnement: Stationnement;
}

export interface Prestation {
  type: TypePrestation;
  destination: Destination;
  typeNettoyage?: TypeNettoyage;
  dateSouhaitee?: string;
  remarques?: string;
}

export interface Trajet {
  kmAller: number;
  minAller: number;
  source: "calcule" | "manuel";
  /** Ex. « Payerne – Lausanne ». */
  libelle: string;
  /** Adresse qui a servi au dernier calcul, pour ne pas le relancer à l'identique. */
  adresse?: string;
}

/** Métadonnées d'une photo ; le blob JPEG est dans IndexedDB sous `blobKey`. */
export interface Photo {
  id: string;
  pieceId: string;
  blobKey: string;
  width: number;
  height: number;
  addedAt: string;
}

export interface AnalysePiece {
  at: string;
  status: "ok" | "erreur";
  remarques?: string;
  /** Empreinte des photos au moment de l'analyse. */
  hash: string;
  erreur?: string;
}

export interface Piece {
  id: string;
  nom: string;
  hashPhotos: string;
  analyse?: AnalysePiece;
  /** Vrai si Ethan a corrigé l'inventaire de cette pièce depuis la dernière analyse. */
  corrige?: boolean;
}

export interface InventaireItem {
  id: string;
  pieceId: string;
  categoryId: string;
  label: string;
  quantite: number;
  confiance: number | null;
  etat: Etat;
  filiere: Filiere;
  /** Vrai quand Ethan a choisi la filière à la main : elle écrase la règle (§6.1, point 3). */
  filiereManuelle?: boolean;
  photos: number[];
  origine: "ia" | "manuel";
  note?: string;
}

export interface Categorie {
  id: string;
  label: string;
  volumeM3: number;
  poidsKg: number;
  manutentionMin: number;
  prixCHF: number;
  filiereDefaut: Filiere;
  taxeUnitaireCHF?: number;
  groupe: string;
  exemples?: string;
}

export interface GrilleParams {
  tauxHoraireEquipe: number;
  tarifKm: number;
  tarifTonneDechetterie: number;
  majorationEtagePct: number;
  majorationEtageMaxPct: number;
  portageInclusM: number;
  portageSuppCHF: number;
  stationnement: Record<Stationnement, number>;
  nettoyageM2: Record<TypeNettoyage, number>;
  nettoyageMinimumCHF: number;
  minimumFacturationHT: number;
  tvaPct: number;
  arrondiTTC: number;
}

export interface Grille {
  version: number;
  updatedAt: string;
  params: GrilleParams;
  catalogue: Categorie[];
}

export type SectionDevis = "debarras" | "tri" | "acces" | "nettoyage" | "remise";

export interface LigneDevis {
  section: SectionDevis;
  designation: string;
  detail?: string;
  /** Nom de la pièce, affiché en gris à côté de la désignation. */
  piece?: string;
  quantite?: number;
  volumeM3?: number;
  surfaceM2?: number;
  montantCHF: number;
  /** Ligne à compléter (ex. nettoyage sans surface). */
  avertissement?: boolean;
}

export interface Totaux {
  manutention: number;
  majorationEtage: number;
  majorationEtagePct: number;
  portage: number;
  stationnement: number;
  deplacement: number;
  elimination: number;
  taxesSpeciales: number;
  nettoyage: number;
  nettoyageAPreciser: boolean;
  /** Montant négatif (ou 0). */
  remise: number;
  sousTotalHT: number;
  minimumApplique: boolean;
  minimumHT: number;
  totalHT: number;
  tvaPct: number;
  tva: number;
  totalTTC: number;
  volumeM3: number;
  poidsDechetterieKg: number;
  poidsRessourcerieKg: number;
  poidsSensKg: number;
  dureeMin: number;
}

export interface ResultatDevis {
  lignes: LigneDevis[];
  totaux: Totaux;
}

export interface Remise {
  type: "pct" | "chf";
  valeur: number;
}

export interface SnapshotDevis {
  grilleVersion: number;
  lignes: LigneDevis[];
  totaux: Totaux;
  sentAt?: string;
  sentTo?: string;
}

export interface Devis {
  id: string;
  numero: string;
  createdAt: string;
  statut: "brouillon" | "envoye";
  client: Client;
  lieu: Lieu;
  prestation: Prestation;
  trajet: Trajet;
  pieces: Piece[];
  photos: Photo[];
  inventaire: InventaireItem[];
  nettoyageInclus: boolean;
  remise?: Remise;
  snapshot?: SnapshotDevis;
  /** Devis d'exemple chargé en mode démo. */
  exemple?: boolean;
}
