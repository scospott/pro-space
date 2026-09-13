// Contenu du document devis (docs/SPEC.md §9), partagé par l'aperçu HTML et le PDF.
import { ajouterJours, dateCH, dureeHumaine, minusculeInitiale, nombre, ordinal } from "./format";
import { LIBELLE_NETTOYAGE_LIGNE, LIBELLE_SECTION } from "./libelles";
import type { Devis, LigneDevis, SectionDevis, Totaux } from "./types";

export const SOCIETE = {
  nom: "Pro Space Sàrl",
  ville: "Payerne",
  adresse: "1530 Payerne",
  telephone: "+41 78 351 56 50",
  email: "contact@pro-space.ch",
  ide: "IDE CHE-xxx.xxx.xxx TVA",
} as const;

export const VALIDITE_JOURS = 30;

export const CONDITIONS =
  "Devis établi sur la base des photos transmises et de notre grille tarifaire. Les objets non visibles sur les photos ou les volumes supplémentaires constatés sur place sont facturés selon la même grille. Paiement à 10 jours net. Devis valable 30 jours.";

export const ORDRE_SECTIONS: SectionDevis[] = ["debarras", "tri", "acces", "nettoyage", "remise"];

export function dateDuDocument(devis: Devis, maintenant: Date = new Date()): string {
  return devis.snapshot?.sentAt ?? maintenant.toISOString();
}

export function enTeteDocument(devis: Devis, maintenant: Date = new Date()) {
  const date = dateDuDocument(devis, maintenant);
  return {
    numero: devis.numero || "brouillon",
    lieuDate: `${SOCIETE.ville}, le ${dateCH(date)}`,
    validite: `Valable jusqu'au ${dateCH(ajouterJours(date, VALIDITE_JOURS))}`,
  };
}

export function lignesSociete(): string[] {
  return [SOCIETE.adresse, SOCIETE.telephone, SOCIETE.email];
}

export function nomClient(devis: Pick<Devis, "client">): string {
  const { civilite, prenom, nom } = devis.client;
  if (civilite === "societe") return nom.trim();
  const titre = civilite === "madame" ? "Madame" : "Monsieur";
  return [titre, prenom.trim(), nom.trim()].filter(Boolean).join(" ");
}

/** Bloc destinataire : première ligne en gras, puis adresse et contact. */
export function destinataire(devis: Devis): { titre: string; lignes: string[] } {
  const { client, lieu } = devis;
  const lignes: string[] = [];
  if (client.civilite === "societe" && client.prenom.trim()) lignes.push(`À l'attention de ${client.prenom.trim()}`);
  if (lieu.rue.trim()) lignes.push(lieu.rue.trim());
  const ville = `${lieu.npa} ${lieu.localite}`.trim();
  if (ville) lignes.push(ville);
  if (client.telephone.trim()) lignes.push(client.telephone.trim());
  if (client.email.trim()) lignes.push(client.email.trim());
  return { titre: nomClient(devis), lignes };
}

function logementEtEtage(devis: Devis): string {
  const { lieu } = devis;
  const pieces = lieu.pieces?.trim() ? ` de ${lieu.pieces.trim()} pièces` : "";
  const logement = {
    appartement: `d'un appartement${pieces}`,
    maison: `d'une maison${pieces}`,
    local: "d'un local commercial",
    cave_garage: "d'une cave ou d'un garage",
  }[lieu.type];
  const etage =
    lieu.etage === 0 ? "au rez-de-chaussée" : `au ${ordinal(lieu.etage)} étage ${lieu.ascenseur ? "avec ascenseur" : "sans ascenseur"}`;
  return `${logement} ${etage}`;
}

function ponctuer(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Paragraphe « Objet » : prestation, logement, étage, date souhaitée, remarques. */
export function objetDevis(devis: Devis): string {
  const { prestation, lieu } = devis;
  const nettoyage = LIBELLE_NETTOYAGE_LIGNE[prestation.typeNettoyage ?? "fin_de_bail"];
  const avecDebarras = prestation.type !== "nettoyage" || devis.inventaire.length > 0;
  const avecNettoyage = devis.nettoyageInclus;
  let phrase: string;
  if (avecDebarras && avecNettoyage) phrase = `Débarras ${logementEtEtage(devis)} et ${minusculeInitiale(nettoyage)}`;
  else if (avecNettoyage) phrase = `${nettoyage} ${logementEtEtage(devis)}`;
  else phrase = `Débarras ${logementEtEtage(devis)}`;
  if (lieu.localite.trim()) phrase += ` à ${lieu.localite.trim()}`;
  const parties = [`${phrase}.`];
  if (prestation.dateSouhaitee?.trim()) parties.push(`Intervention souhaitée : ${minusculeInitiale(prestation.dateSouhaitee.trim())}.`);
  if (prestation.remarques?.trim()) parties.push(`Remarques : ${ponctuer(prestation.remarques)}`);
  return parties.join(" ");
}

export function sectionsDevis(lignes: LigneDevis[]): { section: SectionDevis; titre: string; lignes: LigneDevis[] }[] {
  return ORDRE_SECTIONS.map((section) => ({ section, titre: LIBELLE_SECTION[section], lignes: lignes.filter((l) => l.section === section) })).filter(
    (s) => s.lignes.length > 0,
  );
}

export function colonneVolume(l: LigneDevis): string {
  if (l.volumeM3 !== undefined) return `${nombre(l.volumeM3, 1)} m³`;
  if (l.surfaceM2 !== undefined) return `${nombre(l.surfaceM2, 0)} m²`;
  return "";
}

export function libelleTva(tvaPct: number): string {
  return `TVA ${String(tvaPct).replace(".", ",")} %`;
}

export function texteDuree(totaux: Totaux): string {
  return `Durée estimée : environ ${dureeHumaine(totaux.dureeMin)} à 2 personnes. Volume estimé ${nombre(totaux.volumeM3, 1)} m³.`;
}

/** « Devis-2026-0413-Rochat.pdf ». */
export function nomFichierPdf(devis: Pick<Devis, "numero" | "client">): string {
  const nom = devis.client.nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `Devis-${devis.numero || "brouillon"}${nom ? `-${nom}` : ""}.pdf`;
}
