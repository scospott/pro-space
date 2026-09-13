import { describe, expect, it } from "vitest";
import { devisRochat } from "./fixtures/rochat";
import { chf, dateCH, dureeHumaine, heureCH } from "./format";
import { defaultGrille } from "./grille.default";
import { empreintePhotos } from "./hash";
import { numeroSuivant } from "./numbering";
import { arrondi, arrondiPas, calculerDevis, filiereEffective, filiereParRegle } from "./pricing";
import type { Devis } from "./types";

const grille = defaultGrille();

describe("cas golden Rochat (§6.3)", () => {
  const devis = devisRochat(grille);
  const { lignes, totaux } = calculerDevis(devis, grille);

  it("compte les 17 lignes d'inventaire dans la section débarras", () => {
    expect(devis.inventaire).toHaveLength(17);
    expect(lignes.filter((l) => l.section === "debarras")).toHaveLength(17);
  });

  it("calcule chaque poste à l'identique", () => {
    expect(totaux.manutention).toBe(945.0);
    expect(totaux.majorationEtagePct).toBe(30);
    expect(totaux.majorationEtage).toBe(283.5);
    expect(totaux.portage).toBe(30.0);
    expect(totaux.stationnement).toBe(60.0);
    expect(totaux.deplacement).toBe(260.1);
    expect(totaux.poidsDechetterieKg).toBe(425);
    expect(totaux.elimination).toBe(102.0);
    expect(totaux.poidsRessourcerieKg).toBe(245);
    expect(totaux.poidsSensKg).toBe(70);
    expect(totaux.taxesSpeciales).toBe(24.0);
    expect(totaux.nettoyage).toBe(750.0);
    expect(totaux.remise).toBe(0);
    expect(totaux.sousTotalHT).toBe(2454.6);
    expect(totaux.minimumApplique).toBe(false);
    expect(totaux.totalHT).toBe(2454.6);
    expect(totaux.tva).toBe(198.82);
    expect(totaux.totalTTC).toBe(2653.4);
    expect(totaux.volumeM3).toBe(13.7);
    expect(totaux.dureeMin).toBe(300);
  });

  it("formate les montants et la durée comme le document", () => {
    expect(chf(totaux.sousTotalHT)).toBe("CHF 2'454.60");
    expect(chf(totaux.totalTTC)).toBe("CHF 2'653.40");
    expect(dureeHumaine(totaux.dureeMin)).toBe("5 h 00");
  });

  it("produit les libellés attendus", () => {
    const designations = lignes.map((l) => l.designation);
    expect(designations).toContain("Majoration 3e étage sans ascenseur");
    expect(designations).toContain("Portage 25 m");
    expect(designations).toContain("Autorisation de stationnement, zone bleue");
    expect(designations).toContain("Déplacement Payerne – Lausanne, aller-retour");
    expect(designations).toContain("Déchetterie, déchets encombrants");
    expect(designations).toContain("Taxe d'élimination, pneu");
    expect(designations).toContain("Nettoyage de fin de bail");
    const deplacement = lignes.find((l) => l.designation.startsWith("Déplacement"));
    expect(deplacement?.detail).toBe("98 km, 1 h 30");
    const dechetterie = lignes.find((l) => l.designation.startsWith("Déchetterie"));
    expect(dechetterie?.detail).toBe("Estimation 0.425 t, CHF 240.00 / t");
    const ressourcerie = lignes.find((l) => l.designation.startsWith("Ressourcerie"));
    expect(ressourcerie?.montantCHF).toBe(0);
    const sens = lignes.find((l) => l.designation.includes("SENS"));
    expect(sens?.montantCHF).toBe(0);
  });

  it("respecte l'ordre des sections", () => {
    const ordre = ["debarras", "tri", "acces", "nettoyage", "remise"];
    const rangs = lignes.map((l) => ordre.indexOf(l.section));
    expect([...rangs].sort((a, b) => a - b)).toEqual(rangs);
  });

  it("n'utilise que la grille passée en argument", () => {
    const autre = defaultGrille();
    const canape = autre.catalogue.find((c) => c.id === "canape_3p");
    if (!canape) throw new Error("canape_3p absent");
    canape.prixCHF = 120;
    const r = calculerDevis(devisRochat(autre), autre);
    expect(r.totaux.manutention).toBe(970);
    expect(r.totaux.totalTTC).toBe(2688.55);
    expect(calculerDevis(devis, grille).totaux.totalTTC).toBe(2653.4);
  });
});

function devisMinimal(): Devis {
  return {
    id: "dv_min",
    numero: "",
    createdAt: "2026-09-13T12:00:00.000Z",
    statut: "brouillon",
    client: { civilite: "monsieur", prenom: "Marc", nom: "Test", email: "marc@example.ch", telephone: "" },
    lieu: { rue: "Rue du Test 1", npa: "1530", localite: "Payerne", type: "appartement", etage: 0, ascenseur: true, portageM: 0, stationnement: "prive" },
    prestation: { type: "debarras", destination: "dechetterie" },
    trajet: { kmAller: 5, minAller: 8, source: "manuel", libelle: "Payerne – Payerne" },
    pieces: [{ id: "p1", nom: "Salon", hashPhotos: empreintePhotos([]) }],
    photos: [],
    inventaire: [
      { id: "i1", pieceId: "p1", categoryId: "chaise", label: "Chaise", quantite: 1, confiance: 0.95, etat: "bon", filiere: "dechetterie", photos: [1], origine: "ia" },
    ],
    nettoyageInclus: false,
  };
}

describe("autres tests obligatoires (§6.3)", () => {
  it("applique le minimum de facturation", () => {
    const { totaux } = calculerDevis(devisMinimal(), grille);
    expect(totaux.sousTotalHT).toBeLessThan(350);
    expect(totaux.minimumApplique).toBe(true);
    expect(totaux.totalHT).toBe(350.0);
    expect(totaux.tva).toBe(28.35);
    expect(totaux.totalTTC).toBe(378.35);
  });

  it("ne majore pas quand il y a un ascenseur", () => {
    const devis = devisRochat(grille);
    devis.lieu.ascenseur = true;
    const { totaux, lignes } = calculerDevis(devis, grille);
    expect(totaux.majorationEtage).toBe(0);
    expect(totaux.majorationEtagePct).toBe(0);
    expect(totaux.sousTotalHT).toBe(2171.1);
    expect(totaux.dureeMin).toBe(231);
    expect(lignes.some((l) => l.designation.startsWith("Majoration"))).toBe(false);
  });

  it("ne majore pas au rez-de-chaussée", () => {
    const devis = devisRochat(grille);
    devis.lieu.etage = 0;
    expect(calculerDevis(devis, grille).totaux.majorationEtage).toBe(0);
  });

  it("plafonne la majoration à 50 % au 8e étage sans ascenseur", () => {
    const devis = devisRochat(grille);
    devis.lieu.etage = 8;
    const { totaux, lignes } = calculerDevis(devis, grille);
    expect(totaux.majorationEtagePct).toBe(50);
    expect(totaux.majorationEtage).toBe(472.5);
    expect(totaux.sousTotalHT).toBe(2643.6);
    expect(lignes.find((l) => l.designation.startsWith("Majoration"))?.detail).toBe("50 % de la manutention, plafond atteint");
  });

  it("applique une remise de 10 % sur la somme des postes", () => {
    const devis = devisRochat(grille);
    devis.remise = { type: "pct", valeur: 10 };
    const { totaux, lignes } = calculerDevis(devis, grille);
    expect(totaux.remise).toBe(-245.46);
    expect(totaux.sousTotalHT).toBe(2209.14);
    expect(totaux.tva).toBe(178.94);
    expect(totaux.totalTTC).toBe(2388.1);
    const ligne = lignes.find((l) => l.section === "remise");
    expect(ligne?.designation).toBe("Remise 10 %");
    expect(ligne?.montantCHF).toBe(-245.46);
  });

  it("applique une remise en CHF, jamais au-delà des postes", () => {
    const devis = devisRochat(grille);
    devis.remise = { type: "chf", valeur: 54.6 };
    expect(calculerDevis(devis, grille).totaux.sousTotalHT).toBe(2400);
    devis.remise = { type: "chf", valeur: 99999 };
    const { totaux } = calculerDevis(devis, grille);
    expect(totaux.sousTotalHT).toBe(0);
    expect(totaux.totalHT).toBe(350);
  });

  it("arrondit le TTC à 0.05", () => {
    expect(arrondiPas(2653.42, 0.05)).toBe(2653.4);
    expect(arrondiPas(2653.43, 0.05)).toBe(2653.45);
    expect(arrondiPas(2688.56, 0.05)).toBe(2688.55);
    expect(arrondiPas(2688.58, 0.05)).toBe(2688.6);
    expect(arrondiPas(378.35, 0.05)).toBe(378.35);
    expect(arrondiPas(10.025, 0.05)).toBe(10.05);
    expect(arrondi(1.005)).toBe(1.01);
    expect(arrondi(-0.001)).toBe(0);
    for (const etage of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const km of [3, 17, 49, 81]) {
        const devis = devisRochat(grille);
        devis.lieu.etage = etage;
        devis.trajet.kmAller = km;
        devis.trajet.minAller = km + 7;
        const ttc = calculerDevis(devis, grille).totaux.totalTTC;
        expect(Math.round(ttc * 100) % 5).toBe(0);
      }
    }
  });

  it("applique le minimum de nettoyage sous 250.00", () => {
    const devis = devisRochat(grille);
    devis.lieu.surfaceM2 = 20;
    const { totaux, lignes } = calculerDevis(devis, grille);
    expect(totaux.nettoyage).toBe(250.0);
    expect(lignes.find((l) => l.section === "nettoyage")?.detail).toBe("Minimum de CHF 250.00 appliqué");
  });

  it("signale un nettoyage sans surface, à 0", () => {
    const devis = devisRochat(grille);
    devis.lieu.surfaceM2 = undefined;
    const { totaux, lignes } = calculerDevis(devis, grille);
    expect(totaux.nettoyage).toBe(0);
    expect(totaux.nettoyageAPreciser).toBe(true);
    expect(lignes.find((l) => l.section === "nettoyage")?.avertissement).toBe(true);
  });

  it("ne bascule jamais sens ou special selon la destination", () => {
    const cat = (id: string) => grille.catalogue.find((c) => c.id === id);
    for (const destination of ["dechetterie", "ressourcerie", "tri"] as const) {
      for (const etat of ["bon", "use", "hs"] as const) {
        expect(filiereParRegle(cat("refrigerateur"), etat, destination)).toBe("sens");
        expect(filiereParRegle(cat("tv"), etat, destination)).toBe("sens");
        expect(filiereParRegle(cat("pneu"), etat, destination)).toBe("special");
        expect(filiereParRegle(cat("peinture_chimique"), etat, destination)).toBe("special");
      }
    }
    const devis = devisRochat(grille);
    devis.prestation.destination = "dechetterie";
    const { totaux } = calculerDevis(devis, grille);
    expect(totaux.poidsSensKg).toBe(70);
    expect(totaux.taxesSpeciales).toBe(24);
    expect(totaux.poidsRessourcerieKg).toBe(0);
  });

  it("applique la règle de destination aux autres catégories", () => {
    const commode = grille.catalogue.find((c) => c.id === "commode");
    expect(filiereParRegle(commode, "bon", "dechetterie")).toBe("dechetterie");
    expect(filiereParRegle(commode, "use", "ressourcerie")).toBe("ressourcerie");
    expect(filiereParRegle(commode, "hs", "ressourcerie")).toBe("dechetterie");
    expect(filiereParRegle(commode, "bon", "tri")).toBe("ressourcerie");
    expect(filiereParRegle(commode, "use", "tri")).toBe("dechetterie");
  });

  it("laisse le choix manuel d'Ethan écraser la règle", () => {
    const frigo = grille.catalogue.find((c) => c.id === "refrigerateur");
    expect(filiereEffective({ etat: "bon", filiere: "dechetterie", filiereManuelle: true }, frigo, "tri")).toBe("dechetterie");
    expect(filiereEffective({ etat: "bon", filiere: "dechetterie" }, frigo, "tri")).toBe("sens");
  });
});

describe("formats et numérotation", () => {
  it("formate les montants suisses", () => {
    expect(chf(0)).toBe("CHF 0.00");
    expect(chf(350)).toBe("CHF 350.00");
    expect(chf(1234567.891)).toBe("CHF 1'234'567.89");
    expect(chf(-245.46)).toBe("CHF -245.46");
  });

  it("formate les dates et heures à Zurich", () => {
    expect(dateCH("2026-09-13T12:41:00.000Z")).toBe("13.09.2026");
    expect(heureCH("2026-09-13T12:41:00.000Z")).toBe("14:41");
  });

  it("arrondit les durées au quart d'heure", () => {
    expect(dureeHumaine(300)).toBe("5 h 00");
    expect(dureeHumaine(90)).toBe("1 h 30");
    expect(dureeHumaine(346)).toBe("5 h 45");
    expect(dureeHumaine(7)).toBe("0 h 00");
  });

  it("numérote les devis", () => {
    expect(numeroSuivant(413, new Date("2026-09-13T12:00:00Z"))).toBe("2026-0413");
    expect(numeroSuivant(7, "2027-01-02T12:00:00Z")).toBe("2027-0007");
  });

  it("calcule une empreinte stable des photos", () => {
    expect(empreintePhotos(["a", "b"])).toBe(empreintePhotos(["b", "a"]));
    expect(empreintePhotos(["a", "b"])).not.toBe(empreintePhotos(["a", "c"]));
    expect(empreintePhotos([])).toBe(empreintePhotos([]));
  });
});
