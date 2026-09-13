// Formulaire de la grille tarifaire (docs/SPEC.md §3 écran 6, §5) : conversion, validation, identifiants. Pur.
import { lireNombre } from "./nombre";
import type { Categorie, Filiere, Grille, GrilleParams } from "./types";

export type CleParam =
  | "tauxHoraireEquipe"
  | "tarifKm"
  | "tarifTonneDechetterie"
  | "majorationEtagePct"
  | "majorationEtageMaxPct"
  | "portageInclusM"
  | "portageSuppCHF"
  | "stationnement.prive"
  | "stationnement.rue_libre"
  | "stationnement.zone_bleue"
  | "stationnement.centre_difficile"
  | "nettoyageM2.fin_de_bail"
  | "nettoyageM2.apres_travaux"
  | "nettoyageM2.insalubre"
  | "nettoyageMinimumCHF"
  | "minimumFacturationHT"
  | "tvaPct"
  | "arrondiTTC";

export type DefinitionParam = { cle: CleParam; libelle: string; unite: string; aide: string; max?: number };

export const SECTIONS_PARAMS: { titre: string; params: DefinitionParam[] }[] = [
  {
    titre: "Équipe et déplacement",
    params: [
      { cle: "tauxHoraireEquipe", libelle: "Taux horaire équipe", unite: "CHF / h", aide: "Équipe de 2 personnes, sert au temps de trajet et à la durée." },
      { cle: "tarifKm", libelle: "Tarif kilométrique", unite: "CHF / km", aide: "Camion, compté à l'aller et au retour." },
    ],
  },
  {
    titre: "Élimination",
    params: [{ cle: "tarifTonneDechetterie", libelle: "Déchetterie", unite: "CHF / t", aide: "Encombrants facturés au poids estimé." }],
  },
  {
    titre: "Accès",
    params: [
      { cle: "majorationEtagePct", libelle: "Majoration par étage", unite: "%", aide: "De la manutention, par étage sans ascenseur (rez = 0).", max: 100 },
      { cle: "majorationEtageMaxPct", libelle: "Plafond de majoration", unite: "%", aide: "Majoration d'étage maximale, tous étages confondus.", max: 100 },
      { cle: "portageInclusM", libelle: "Portage inclus", unite: "m", aide: "Distance du camion à l'entrée comprise dans le prix." },
      { cle: "portageSuppCHF", libelle: "Portage supplémentaire", unite: "CHF / 20 m", aide: "Par tranche de 20 m entamée au-delà du portage inclus." },
      { cle: "stationnement.prive", libelle: "Place privée ou accès direct", unite: "CHF", aide: "Forfait de stationnement." },
      { cle: "stationnement.rue_libre", libelle: "Rue sans restriction", unite: "CHF", aide: "Forfait de stationnement." },
      { cle: "stationnement.zone_bleue", libelle: "Zone bleue", unite: "CHF", aide: "Forfait, autorisation communale comprise." },
      { cle: "stationnement.centre_difficile", libelle: "Centre-ville, accès difficile", unite: "CHF", aide: "Forfait de stationnement." },
    ],
  },
  {
    titre: "Nettoyage",
    params: [
      { cle: "nettoyageM2.fin_de_bail", libelle: "Fin de bail", unite: "CHF / m²", aide: "Sols, sanitaires, cuisine, vitres intérieures." },
      { cle: "nettoyageM2.apres_travaux", libelle: "Après travaux", unite: "CHF / m²", aide: "Poussières de chantier, traces de peinture." },
      { cle: "nettoyageM2.insalubre", libelle: "Insalubre", unite: "CHF / m²", aide: "Logement très encrassé, équipement de protection." },
      { cle: "nettoyageMinimumCHF", libelle: "Minimum de nettoyage", unite: "CHF", aide: "Montant plancher d'un nettoyage, quelle que soit la surface." },
    ],
  },
  {
    titre: "Facturation",
    params: [
      { cle: "minimumFacturationHT", libelle: "Minimum de facturation", unite: "CHF HT", aide: "Appliqué quand le sous-total est inférieur." },
      { cle: "tvaPct", libelle: "TVA", unite: "%", aide: "Taux appliqué au total HT.", max: 100 },
      { cle: "arrondiTTC", libelle: "Arrondi du total TTC", unite: "CHF", aide: "0.05 = arrondi commercial suisse, 0.01 = au centime.", max: 1 },
    ],
  },
];

export const CLES_PARAMS: CleParam[] = SECTIONS_PARAMS.flatMap((s) => s.params.map((p) => p.cle));

export type ChampCategorie = "label" | "volumeM3" | "poidsKg" | "manutentionMin" | "prixCHF" | "taxeUnitaireCHF";

export type LigneCategorie = {
  id: string;
  label: string;
  groupe: string;
  exemples: string;
  volumeM3: string;
  poidsKg: string;
  manutentionMin: string;
  prixCHF: string;
  filiereDefaut: Filiere;
  taxeUnitaireCHF: string;
};

export type FormulaireGrille = { params: Record<CleParam, string>; catalogue: LigneCategorie[] };

export type Erreurs = Record<string, string>;

export const cleErreurParam = (cle: CleParam) => `param.${cle}`;
export const cleErreurCategorie = (id: string, champ: ChampCategorie) => `cat.${id}.${champ}`;

function lireParam(p: GrilleParams, cle: CleParam): number {
  if (cle.startsWith("stationnement.")) return p.stationnement[cle.slice(14) as keyof GrilleParams["stationnement"]];
  if (cle.startsWith("nettoyageM2.")) return p.nettoyageM2[cle.slice(12) as keyof GrilleParams["nettoyageM2"]];
  switch (cle) {
    case "tauxHoraireEquipe":
      return p.tauxHoraireEquipe;
    case "tarifKm":
      return p.tarifKm;
    case "tarifTonneDechetterie":
      return p.tarifTonneDechetterie;
    case "majorationEtagePct":
      return p.majorationEtagePct;
    case "majorationEtageMaxPct":
      return p.majorationEtageMaxPct;
    case "portageInclusM":
      return p.portageInclusM;
    case "portageSuppCHF":
      return p.portageSuppCHF;
    case "nettoyageMinimumCHF":
      return p.nettoyageMinimumCHF;
    case "minimumFacturationHT":
      return p.minimumFacturationHT;
    case "tvaPct":
      return p.tvaPct;
    default:
      return p.arrondiTTC;
  }
}

export function versFormulaire(grille: Grille): FormulaireGrille {
  const params = Object.fromEntries(CLES_PARAMS.map((cle) => [cle, String(lireParam(grille.params, cle))])) as Record<CleParam, string>;
  return {
    params,
    catalogue: grille.catalogue.map((c) => ({
      id: c.id,
      label: c.label,
      groupe: c.groupe,
      exemples: c.exemples ?? "",
      volumeM3: String(c.volumeM3),
      poidsKg: String(c.poidsKg),
      manutentionMin: String(c.manutentionMin),
      prixCHF: String(c.prixCHF),
      filiereDefaut: c.filiereDefaut,
      taxeUnitaireCHF: c.taxeUnitaireCHF !== undefined ? String(c.taxeUnitaireCHF) : "",
    })),
  };
}

function nombrePositif(texte: string, max: number | undefined, erreurs: Erreurs, cle: string, videPermis = false): number {
  const n = lireNombre(texte);
  if (n === undefined) {
    if (!videPermis) erreurs[cle] = "Valeur requise.";
    return 0;
  }
  if (n === null) {
    erreurs[cle] = "Nombre invalide, par exemple 12.50.";
    return 0;
  }
  if (n < 0) {
    erreurs[cle] = "Doit être positif ou nul.";
    return 0;
  }
  if (max !== undefined && n > max) {
    erreurs[cle] = `Au plus ${max}.`;
    return n;
  }
  return n;
}

/** Valide le formulaire ; la grille n'est renvoyée que s'il n'y a aucune erreur (version et date conservées). */
export function depuisFormulaire(form: FormulaireGrille, base: Grille): { grille: Grille | null; erreurs: Erreurs } {
  const erreurs: Erreurs = {};
  const v = {} as Record<CleParam, number>;
  for (const section of SECTIONS_PARAMS) {
    for (const def of section.params) {
      v[def.cle] = nombrePositif(form.params[def.cle], def.max, erreurs, cleErreurParam(def.cle));
    }
  }
  if (!erreurs[cleErreurParam("majorationEtageMaxPct")] && !erreurs[cleErreurParam("majorationEtagePct")] && v.majorationEtageMaxPct < v.majorationEtagePct) {
    erreurs[cleErreurParam("majorationEtageMaxPct")] = "Le plafond doit être au moins égal à la majoration par étage.";
  }

  const catalogue: Categorie[] = form.catalogue.map((l) => {
    const e = (champ: ChampCategorie) => cleErreurCategorie(l.id, champ);
    if (!l.label.trim()) erreurs[e("label")] = "Libellé requis.";
    const special = l.filiereDefaut === "special";
    return {
      id: l.id,
      label: l.label.trim(),
      volumeM3: nombrePositif(l.volumeM3, 100, erreurs, e("volumeM3")),
      poidsKg: nombrePositif(l.poidsKg, 10000, erreurs, e("poidsKg")),
      manutentionMin: nombrePositif(l.manutentionMin, 1000, erreurs, e("manutentionMin")),
      prixCHF: nombrePositif(l.prixCHF, 100000, erreurs, e("prixCHF")),
      filiereDefaut: l.filiereDefaut,
      taxeUnitaireCHF: special ? nombrePositif(l.taxeUnitaireCHF, 10000, erreurs, e("taxeUnitaireCHF"), true) : undefined,
      groupe: l.groupe,
      exemples: l.exemples.trim() || undefined,
    };
  });

  if (Object.keys(erreurs).length > 0) return { grille: null, erreurs };
  const params: GrilleParams = {
    tauxHoraireEquipe: v.tauxHoraireEquipe,
    tarifKm: v.tarifKm,
    tarifTonneDechetterie: v.tarifTonneDechetterie,
    majorationEtagePct: v.majorationEtagePct,
    majorationEtageMaxPct: v.majorationEtageMaxPct,
    portageInclusM: v.portageInclusM,
    portageSuppCHF: v.portageSuppCHF,
    stationnement: {
      prive: v["stationnement.prive"],
      rue_libre: v["stationnement.rue_libre"],
      zone_bleue: v["stationnement.zone_bleue"],
      centre_difficile: v["stationnement.centre_difficile"],
    },
    nettoyageM2: {
      fin_de_bail: v["nettoyageM2.fin_de_bail"],
      apres_travaux: v["nettoyageM2.apres_travaux"],
      insalubre: v["nettoyageM2.insalubre"],
    },
    nettoyageMinimumCHF: v.nettoyageMinimumCHF,
    minimumFacturationHT: v.minimumFacturationHT,
    tvaPct: v.tvaPct,
    arrondiTTC: v.arrondiTTC,
  };
  return { grille: { version: base.version, updatedAt: base.updatedAt, params, catalogue }, erreurs };
}

/** Identifiant snake_case unique à partir d'un libellé : « Machine à café » → machine_a_cafe. */
export function genererIdCategorie(label: string, existants: readonly string[]): string {
  const racine =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 36) || "categorie";
  if (!existants.includes(racine)) return racine;
  let i = 2;
  while (existants.includes(`${racine}_${i}`)) i++;
  return `${racine}_${i}`;
}

export function nouvelleLigne(label: string, groupe: string, exemples: string, existants: readonly string[]): LigneCategorie {
  return {
    id: genererIdCategorie(label, existants),
    label: label.trim(),
    groupe,
    exemples: exemples.trim(),
    volumeM3: "0.1",
    poidsKg: "5",
    manutentionMin: "2",
    prixCHF: "5",
    filiereDefaut: "dechetterie",
    taxeUnitaireCHF: "",
  };
}
