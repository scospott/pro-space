import type { Devis } from "./types";

export type ChampEtape1 =
  | "prenom"
  | "nom"
  | "email"
  | "telephone"
  | "rue"
  | "npa"
  | "localite"
  | "surfaceM2"
  | "etage"
  | "portageM";

export type ErreursEtape1 = Partial<Record<ChampEtape1, string>>;

/** Ordre d'affichage, pour placer le focus sur le premier champ en erreur. */
export const ORDRE_CHAMPS: ChampEtape1[] = ["prenom", "nom", "email", "telephone", "rue", "npa", "localite", "surfaceM2", "etage", "portageM"];

export const NOM_COURT_CHAMP: Record<ChampEtape1, string> = {
  prenom: "prénom",
  nom: "nom",
  email: "e-mail",
  telephone: "téléphone",
  rue: "rue",
  npa: "NPA",
  localite: "localité",
  surfaceM2: "surface",
  etage: "étage",
  portageM: "portage",
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function erreursEtape1(d: Devis): ErreursEtape1 {
  const e: ErreursEtape1 = {};
  const { client, lieu } = d;
  const societe = client.civilite === "societe";

  if (!societe && !client.prenom.trim()) e.prenom = "Indiquez le prénom du client.";
  if (!client.nom.trim()) e.nom = societe ? "Indiquez la raison sociale." : "Indiquez le nom du client.";
  if (!client.email.trim()) e.email = "Indiquez l'e-mail : le devis y sera envoyé.";
  else if (!RE_EMAIL.test(client.email.trim())) e.email = "Adresse e-mail invalide, par exemple nom@domaine.ch.";
  const chiffres = client.telephone.replace(/\D/g, "");
  if (client.telephone.trim() && chiffres.length < 9) e.telephone = "Numéro incomplet, par exemple 079 412 88 30.";

  if (!lieu.rue.trim()) e.rue = "Indiquez la rue et le numéro.";
  if (!lieu.npa.trim()) e.npa = "Indiquez le NPA.";
  else if (!/^\d{4}$/.test(lieu.npa.trim())) e.npa = "Le NPA suisse compte 4 chiffres, par exemple 1530.";
  if (!lieu.localite.trim()) e.localite = "Indiquez la localité.";
  if (lieu.surfaceM2 !== undefined && (lieu.surfaceM2 <= 0 || lieu.surfaceM2 > 5000)) {
    e.surfaceM2 = "Surface entre 1 et 5000 m², ou laissez vide.";
  }
  if (!Number.isInteger(lieu.etage) || lieu.etage < 0 || lieu.etage > 40) e.etage = "Étage entre 0 (rez) et 40.";
  if (!Number.isFinite(lieu.portageM) || lieu.portageM < 0 || lieu.portageM > 500) e.portageM = "Distance entre 0 et 500 m.";
  return e;
}

export function etape1Valide(d: Devis): boolean {
  return Object.keys(erreursEtape1(d)).length === 0;
}

/** Le devis peut être généré : au moins une photo, ou un inventaire existant, ou un nettoyage seul. */
export function peutGenerer(d: Devis): boolean {
  return d.photos.length > 0 || d.inventaire.length > 0 || d.prestation.type === "nettoyage";
}

/** L'étape 3 est accessible : étape 1 valide et un inventaire déjà produit (ou un nettoyage seul). */
export function etape3Accessible(d: Devis): boolean {
  if (d.statut === "envoye") return true;
  return (
    etape1Valide(d) &&
    (d.inventaire.length > 0 || d.pieces.some((p) => p.analyse?.status === "ok") || d.prestation.type === "nettoyage")
  );
}
