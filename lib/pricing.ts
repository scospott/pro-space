// Moteur de prix (docs/SPEC.md §6). Fonctions pures : aucun réseau, aucun aléa.
// Le modèle classe, le code chiffre : tous les montants du devis sortent d'ici.

import { dureeHumaine, minusculeInitiale, nombre, ordinal, chf } from "./format";
import { LIBELLE_NETTOYAGE_LIGNE, LIBELLE_STATIONNEMENT_LIGNE } from "./libelles";
import type {
  Categorie,
  Destination,
  Devis,
  Etat,
  Filiere,
  Grille,
  InventaireItem,
  LigneDevis,
  ResultatDevis,
  Totaux,
} from "./types";

/** Longueur d'une tranche de portage facturée au-delà des mètres inclus. */
export const PORTAGE_TRANCHE_M = 20;

/** Arrondi commercial à 0.01 (demi vers le haut en valeur absolue). */
export function arrondi(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(Math.abs(n) * 100 + 1e-7) / 100;
  return n < 0 && r !== 0 ? -r : r;
}

/** Arrondi au pas donné (ex. 0.05 pour le TTC suisse), calculé en centimes entiers. */
export function arrondiPas(n: number, pas: number): number {
  const cents = Math.round(arrondi(n) * 100);
  const pasCents = Math.round(pas * 100);
  if (!Number.isFinite(pasCents) || pasCents <= 1) return arrondi(n);
  const r = (Math.round(Math.abs(cents) / pasCents) * pasCents) / 100;
  return cents < 0 && r !== 0 ? -r : r;
}

/** Filière selon la règle §6.1 (points 1 et 2), sans tenir compte d'un choix manuel. */
export function filiereParRegle(categorie: Categorie | undefined, etat: Etat, destination: Destination): Filiere {
  if (categorie && (categorie.filiereDefaut === "sens" || categorie.filiereDefaut === "special")) {
    return categorie.filiereDefaut;
  }
  if (destination === "dechetterie") return "dechetterie";
  if (destination === "ressourcerie") return etat === "bon" || etat === "use" ? "ressourcerie" : "dechetterie";
  return etat === "bon" ? "ressourcerie" : "dechetterie";
}

/** Filière effective d'une ligne (§6.1) : le choix manuel d'Ethan écrase la règle. */
export function filiereEffective(
  item: Pick<InventaireItem, "etat" | "filiere" | "filiereManuelle">,
  categorie: Categorie | undefined,
  destination: Destination,
): Filiere {
  if (item.filiereManuelle) return item.filiere;
  return filiereParRegle(categorie, item.etat, destination);
}

/** Pourcentage de majoration d'étage applicable (0 avec ascenseur ou au rez). */
export function pctMajorationEtage(devis: Pick<Devis, "lieu">, grille: Grille): number {
  const { etage, ascenseur } = devis.lieu;
  if (ascenseur || etage < 1) return 0;
  return Math.min(grille.params.majorationEtagePct * etage, grille.params.majorationEtageMaxPct);
}

/** Nombre de tranches de portage facturées. */
export function tranchesPortage(portageM: number, grille: Grille): number {
  return Math.ceil(Math.max(0, portageM - grille.params.portageInclusM) / PORTAGE_TRANCHE_M);
}

/** Montant de nettoyage (0 sans surface). */
export function montantNettoyage(devis: Pick<Devis, "lieu" | "prestation">, grille: Grille): number {
  const surface = devis.lieu.surfaceM2 ?? 0;
  if (surface <= 0) return 0;
  const type = devis.prestation.typeNettoyage ?? "fin_de_bail";
  return arrondi(Math.max(surface * grille.params.nettoyageM2[type], grille.params.nettoyageMinimumCHF));
}

/** Montant du déplacement aller-retour. */
export function montantDeplacement(devis: Pick<Devis, "trajet">, grille: Grille): number {
  const { kmAller, minAller } = devis.trajet;
  return arrondi(2 * kmAller * grille.params.tarifKm + ((2 * minAller) / 60) * grille.params.tauxHoraireEquipe);
}

function ordonnerInventaire(devis: Devis): InventaireItem[] {
  const rang = new Map(devis.pieces.map((p, i) => [p.id, i]));
  return devis.inventaire
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ra = rang.get(a.item.pieceId) ?? Number.MAX_SAFE_INTEGER;
      const rb = rang.get(b.item.pieceId) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb || a.i - b.i;
    })
    .map((x) => x.item);
}

/** Calcule les lignes et les totaux d'un devis selon la grille, dans l'ordre exact du §6.2. */
export function calculerDevis(devis: Devis, grille: Grille): ResultatDevis {
  const p = grille.params;
  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));
  const nomsPieces = new Map(devis.pieces.map((piece) => [piece.id, piece.nom]));
  const destination = devis.prestation.destination;

  const lignesDebarras: LigneDevis[] = [];
  let manutention = 0;
  let volume = 0;
  let minutes = 0;
  const kg: Record<Filiere, number> = { dechetterie: 0, ressourcerie: 0, sens: 0, special: 0 };
  const m3: Record<Filiere, number> = { dechetterie: 0, ressourcerie: 0, sens: 0, special: 0 };
  const speciales = new Map<string, { categorie: Categorie; quantite: number }>();

  // 1. Manutention, ligne par catégorie et par pièce.
  for (const item of ordonnerInventaire(devis)) {
    const quantite = Math.max(0, item.quantite);
    const categorie = categories.get(item.categoryId);
    const piece = nomsPieces.get(item.pieceId);
    if (!categorie) {
      lignesDebarras.push({
        section: "debarras",
        designation: item.label,
        detail: "Catégorie absente de la grille, à remplacer",
        piece,
        quantite,
        montantCHF: 0,
        avertissement: true,
      });
      continue;
    }
    const montant = arrondi(quantite * categorie.prixCHF);
    const vol = arrondi(quantite * categorie.volumeM3);
    manutention += montant;
    volume += quantite * categorie.volumeM3;
    minutes += quantite * categorie.manutentionMin;

    const filiere = filiereEffective(item, categorie, destination);
    kg[filiere] += quantite * categorie.poidsKg;
    m3[filiere] += quantite * categorie.volumeM3;
    if (filiere === "special") {
      const prev = speciales.get(categorie.id);
      speciales.set(categorie.id, { categorie, quantite: (prev?.quantite ?? 0) + quantite });
    }

    lignesDebarras.push({
      section: "debarras",
      designation: categorie.label,
      piece,
      quantite,
      volumeM3: vol,
      montantCHF: montant,
    });
  }
  manutention = arrondi(manutention);

  // 2. Majoration d'étage.
  const pctEtage = pctMajorationEtage(devis, grille);
  const majorationEtage = arrondi((manutention * pctEtage) / 100);

  // 3. Portage.
  const tranches = tranchesPortage(devis.lieu.portageM, grille);
  const portage = arrondi(tranches * p.portageSuppCHF);

  // 4. Stationnement.
  const stationnement = arrondi(p.stationnement[devis.lieu.stationnement] ?? 0);

  // 5. Déplacement.
  const deplacement = montantDeplacement(devis, grille);

  // 6. Élimination déchetterie (au poids).
  const tonnes = kg.dechetterie / 1000;
  const elimination = arrondi(tonnes * p.tarifTonneDechetterie);

  // 8. Taxes spéciales.
  let taxesSpeciales = 0;
  const lignesSpeciales: LigneDevis[] = [];
  for (const { categorie, quantite } of speciales.values()) {
    const unitaire = categorie.taxeUnitaireCHF ?? 0;
    const montant = arrondi(unitaire * quantite);
    taxesSpeciales += montant;
    lignesSpeciales.push({
      section: "tri",
      designation: `Taxe d'élimination, ${minusculeInitiale(categorie.label)}`,
      detail: `${quantite} × ${chf(unitaire)}`,
      quantite,
      montantCHF: montant,
    });
  }
  taxesSpeciales = arrondi(taxesSpeciales);

  const lignesTri: LigneDevis[] = [];
  if (kg.dechetterie > 0) {
    lignesTri.push({
      section: "tri",
      designation: "Déchetterie, déchets encombrants",
      detail: `Estimation ${nombre(tonnes, 3)} t, ${chf(p.tarifTonneDechetterie)} / t`,
      volumeM3: arrondi(m3.dechetterie),
      montantCHF: elimination,
    });
  }
  // 7. Ressourcerie et reprise SENS : lignes à 0.00, affichées avec leur volume.
  if (kg.ressourcerie > 0 || m3.ressourcerie > 0) {
    lignesTri.push({
      section: "tri",
      designation: "Ressourcerie, objets réutilisables",
      detail: `Reprise gratuite, ${nombre(kg.ressourcerie, 0)} kg`,
      volumeM3: arrondi(m3.ressourcerie),
      montantCHF: 0,
    });
  }
  if (kg.sens > 0 || m3.sens > 0) {
    lignesTri.push({
      section: "tri",
      designation: "Électroménager, reprise filière SENS",
      detail: `Reprise gratuite, ${nombre(kg.sens, 0)} kg`,
      volumeM3: arrondi(m3.sens),
      montantCHF: 0,
    });
  }
  lignesTri.push(...lignesSpeciales);

  const lignesAcces: LigneDevis[] = [];
  if (majorationEtage > 0) {
    const plafond = pctEtage >= p.majorationEtageMaxPct && p.majorationEtagePct * devis.lieu.etage > p.majorationEtageMaxPct;
    lignesAcces.push({
      section: "acces",
      designation: `Majoration ${ordinal(devis.lieu.etage)} étage sans ascenseur`,
      detail: `${nombre(pctEtage, 0)} % de la manutention${plafond ? ", plafond atteint" : ""}`,
      montantCHF: majorationEtage,
    });
  }
  if (portage > 0) {
    lignesAcces.push({
      section: "acces",
      designation: `Portage ${nombre(devis.lieu.portageM, 0)} m`,
      detail: `Au-delà des ${nombre(p.portageInclusM, 0)} m inclus, ${tranches} ${tranches > 1 ? "tranches" : "tranche"} de ${PORTAGE_TRANCHE_M} m`,
      montantCHF: portage,
    });
  }
  if (stationnement > 0) {
    lignesAcces.push({
      section: "acces",
      designation: LIBELLE_STATIONNEMENT_LIGNE[devis.lieu.stationnement],
      montantCHF: stationnement,
    });
  }
  if (devis.trajet.kmAller > 0 || devis.trajet.minAller > 0) {
    const libelle = devis.trajet.libelle.trim();
    lignesAcces.push({
      section: "acces",
      designation: libelle ? `Déplacement ${libelle}, aller-retour` : "Déplacement, aller-retour",
      detail: `${nombre(2 * devis.trajet.kmAller, 0)} km, ${dureeHumaine(2 * devis.trajet.minAller)}`,
      montantCHF: deplacement,
    });
  }

  // 9. Nettoyage.
  const lignesNettoyage: LigneDevis[] = [];
  let nettoyage = 0;
  let nettoyageAPreciser = false;
  if (devis.nettoyageInclus) {
    const type = devis.prestation.typeNettoyage ?? "fin_de_bail";
    const surface = devis.lieu.surfaceM2 ?? 0;
    if (surface > 0) {
      nettoyage = montantNettoyage(devis, grille);
      const brut = surface * p.nettoyageM2[type];
      lignesNettoyage.push({
        section: "nettoyage",
        designation: LIBELLE_NETTOYAGE_LIGNE[type],
        detail:
          brut < p.nettoyageMinimumCHF
            ? `Minimum de ${chf(p.nettoyageMinimumCHF)} appliqué`
            : `${nombre(surface, 0)} m² × ${chf(p.nettoyageM2[type])}`,
        surfaceM2: surface,
        montantCHF: nettoyage,
      });
    } else {
      nettoyageAPreciser = true;
      lignesNettoyage.push({
        section: "nettoyage",
        designation: `${LIBELLE_NETTOYAGE_LIGNE[type]}, surface à préciser`,
        detail: "Surface non renseignée, montant à compléter",
        montantCHF: 0,
        avertissement: true,
      });
    }
  }

  // 10. Remise, calculée sur la somme des postes 1 à 9.
  const avantRemise = arrondi(
    manutention + majorationEtage + portage + stationnement + deplacement + elimination + taxesSpeciales + nettoyage,
  );
  const lignesRemise: LigneDevis[] = [];
  let remise = 0;
  if (devis.remise && devis.remise.valeur > 0) {
    const brute = devis.remise.type === "pct" ? (avantRemise * devis.remise.valeur) / 100 : devis.remise.valeur;
    remise = -arrondi(Math.min(Math.max(0, brute), avantRemise));
    if (remise !== 0) {
      lignesRemise.push({
        section: "remise",
        designation: devis.remise.type === "pct" ? `Remise ${nombre(devis.remise.valeur, devis.remise.valeur % 1 === 0 ? 0 : 1)} %` : "Remise",
        montantCHF: remise,
      });
    }
  }

  // 11 à 14. Sous-total, minimum, TVA, total TTC.
  const sousTotalHT = arrondi(avantRemise + remise);
  const minimumApplique = sousTotalHT < p.minimumFacturationHT;
  const totalHT = minimumApplique ? arrondi(p.minimumFacturationHT) : sousTotalHT;
  const tva = arrondi((totalHT * p.tvaPct) / 100);
  const totalTTC = arrondiPas(totalHT + tva, p.arrondiTTC);

  // 15. Durée estimée.
  const dureeMin = Math.round(minutes * (1 + pctEtage / 100));

  const totaux: Totaux = {
    manutention,
    majorationEtage,
    majorationEtagePct: pctEtage,
    portage,
    stationnement,
    deplacement,
    elimination,
    taxesSpeciales,
    nettoyage,
    nettoyageAPreciser,
    remise,
    sousTotalHT,
    minimumApplique,
    minimumHT: arrondi(p.minimumFacturationHT),
    totalHT,
    tvaPct: p.tvaPct,
    tva,
    totalTTC,
    volumeM3: arrondi(volume),
    poidsDechetterieKg: arrondi(kg.dechetterie),
    poidsRessourcerieKg: arrondi(kg.ressourcerie),
    poidsSensKg: arrondi(kg.sens),
    dureeMin,
  };

  return {
    lignes: [...lignesDebarras, ...lignesTri, ...lignesAcces, ...lignesNettoyage, ...lignesRemise],
    totaux,
  };
}
