import type {
  Civilite,
  Destination,
  Etat,
  Filiere,
  SectionDevis,
  Stationnement,
  TypeLogement,
  TypeNettoyage,
  TypePrestation,
} from "./types";

/** Groupes d'affichage du catalogue (docs/SPEC.md §5.2). */
export const GROUPES = ["Séjour", "Cuisine", "Chambre", "Salle de bain", "Cave et extérieur", "Divers"] as const;

export const FILIERES_DEFAUT: { value: Filiere; label: string }[] = [
  { value: "dechetterie", label: "Déchetterie" },
  { value: "ressourcerie", label: "Ressourcerie" },
  { value: "sens", label: "Reprise gratuite (SENS)" },
  { value: "special", label: "Taxe spéciale" },
];

export const CIVILITES:{ value: Civilite; label: string }[] = [
  { value: "madame", label: "Madame" },
  { value: "monsieur", label: "Monsieur" },
  { value: "societe", label: "Société" },
];

export const TYPES_LOGEMENT: { value: TypeLogement; label: string }[] = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "local", label: "Local commercial" },
  { value: "cave_garage", label: "Cave ou garage seul" },
];

export const STATIONNEMENTS: { value: Stationnement; label: string }[] = [
  { value: "prive", label: "Place privée ou accès direct" },
  { value: "rue_libre", label: "Rue sans restriction" },
  { value: "zone_bleue", label: "Zone bleue, autorisation communale" },
  { value: "centre_difficile", label: "Centre-ville, accès difficile" },
];

export const PRESTATIONS: { value: TypePrestation; label: string }[] = [
  { value: "debarras", label: "Débarras" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "debarras_nettoyage", label: "Débarras + nettoyage" },
];

export const DESTINATIONS: { value: Destination; label: string }[] = [
  { value: "dechetterie", label: "Déchetterie" },
  { value: "ressourcerie", label: "Ressourcerie" },
  { value: "tri", label: "Tri sur place" },
];

export const TYPES_NETTOYAGE: { value: TypeNettoyage; label: string }[] = [
  { value: "fin_de_bail", label: "Fin de bail" },
  { value: "apres_travaux", label: "Après travaux" },
  { value: "insalubre", label: "Insalubre" },
];

export const FILIERES_CHOIX: { value: Exclude<Filiere, "special">; label: string }[] = [
  { value: "dechetterie", label: "Déchetterie" },
  { value: "ressourcerie", label: "Ressourcerie" },
  { value: "sens", label: "Reprise gratuite" },
];

export const LIBELLE_FILIERE: Record<Filiere, string> = {
  dechetterie: "Déchetterie",
  ressourcerie: "Ressourcerie",
  sens: "Reprise gratuite",
  special: "Taxe spéciale",
};

export const LIBELLE_ETAT: Record<Etat, string> = {
  bon: "Bon état",
  use: "Usé",
  hs: "Hors d'usage",
};

export const LIBELLE_SECTION: Record<SectionDevis, string> = {
  debarras: "Débarras et manutention",
  tri: "Tri et élimination",
  acces: "Accès et déplacement",
  nettoyage: "Nettoyage",
  remise: "Remise",
};

export const LIBELLE_NETTOYAGE_LIGNE: Record<TypeNettoyage, string> = {
  fin_de_bail: "Nettoyage de fin de bail",
  apres_travaux: "Nettoyage après travaux",
  insalubre: "Nettoyage d'un logement insalubre",
};

export const LIBELLE_STATIONNEMENT_LIGNE: Record<Stationnement, string> = {
  prive: "Stationnement, place privée",
  rue_libre: "Stationnement, rue sans restriction",
  zone_bleue: "Autorisation de stationnement, zone bleue",
  centre_difficile: "Stationnement en centre-ville, accès difficile",
};

export function libelleDe<T extends string>(liste: { value: T; label: string }[], value: T | undefined): string {
  return liste.find((o) => o.value === value)?.label ?? "";
}
