// Contrôle de forme d'un devis reçu par /api/pdf : uniquement ce que le PDF lit.
import type { Devis } from "../types";

function objet(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const chaine = (x: unknown) => typeof x === "string";
const nombre = (x: unknown) => typeof x === "number" && Number.isFinite(x);
const SECTIONS = ["debarras", "tri", "acces", "nettoyage", "remise"];
const TOTAUX = ["sousTotalHT", "minimumHT", "totalHT", "tvaPct", "tva", "totalTTC", "volumeM3", "dureeMin"];

export function lireDevisImprimable(x: unknown): Devis | null {
  if (!objet(x) || !chaine(x.numero)) return null;
  const { client, lieu, prestation, snapshot } = x;
  if (!objet(client) || !chaine(client.nom) || !chaine(client.prenom) || !chaine(client.email) || !chaine(client.telephone) || !chaine(client.civilite)) return null;
  if (!objet(lieu) || !chaine(lieu.rue) || !chaine(lieu.npa) || !chaine(lieu.localite) || !chaine(lieu.type) || !nombre(lieu.etage) || typeof lieu.ascenseur !== "boolean") return null;
  if (!objet(prestation) || !chaine(prestation.type)) return null;
  if (!Array.isArray(x.inventaire) || typeof x.nettoyageInclus !== "boolean") return null;
  if (!objet(snapshot) || !Array.isArray(snapshot.lignes) || !objet(snapshot.totaux)) return null;
  if (snapshot.lignes.length > 500) return null;
  for (const l of snapshot.lignes) {
    if (!objet(l) || !chaine(l.designation) || !nombre(l.montantCHF) || !SECTIONS.includes(String(l.section))) return null;
  }
  const totaux = snapshot.totaux;
  if (!TOTAUX.every((k) => nombre(totaux[k])) || typeof totaux.minimumApplique !== "boolean") return null;
  // Forme vérifiée champ par champ ci-dessus.
  return x as unknown as Devis;
}
