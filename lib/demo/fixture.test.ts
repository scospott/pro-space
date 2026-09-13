import { describe, expect, it } from "vitest";
import { defaultGrille } from "../grille.default";
import { empreintePhotos } from "../hash";
import { nomsPiecesParDefaut } from "../pieces";
import { calculerDevis } from "../pricing";
import type { Devis } from "../types";
import { DEMO_INVENTAIRE } from "./fixture-fribourg";
import { PIECES_MAISON_DEMO } from "./mode";
import {
  PHRASE_MIROIR,
  delaiSimule,
  inventaireFixture,
  itemsDepuisFixture,
  normaliserNomPiece,
  trajetFixture,
} from "./fixture";

const REMARQUES_MIROIR = "Succession, tout est à évacuer. Conserver le miroir soleil doré du salon, repris par la famille.";
const PIECES_BERSIER: [nom: string, photos: number][] = [
  ["Salon", 2],
  ["Cuisine", 3],
  ["Chambre 1", 1],
  ["Chambre 2", 1],
  ["Bureau", 2],
  ["Cave", 3],
  ["Garage", 2],
];

/** Dossier de référence Bersier (test uniquement, jamais pré-rempli dans l'application). */
function dossierBersier(remarques: string): Devis {
  const grille = defaultGrille();
  const pieces = PIECES_BERSIER.map(([nom], i) => ({ id: `piece_${i + 1}`, nom, hashPhotos: empreintePhotos([]) }));
  const inventaire = pieces.flatMap((piece) => {
    const fixture = inventaireFixture(piece.nom, remarques);
    if (!fixture) throw new Error(`Pièce absente de la fixture : ${piece.nom}`);
    return itemsDepuisFixture(fixture, piece.id, "tri", grille);
  });
  return {
    id: "dv_bersier",
    numero: "",
    createdAt: "2026-09-20T08:00:00.000Z",
    statut: "brouillon",
    client: { civilite: "madame", prenom: "Christine", nom: "Bersier", email: "christine.bersier@bluewin.ch", telephone: "079 512 44 18" },
    lieu: {
      rue: "Route de Morat 30",
      npa: "1700",
      localite: "Fribourg",
      type: "maison",
      pieces: "5,5",
      surfaceM2: 140,
      etage: 0,
      ascenseur: false,
      portageM: 35,
      stationnement: "rue_libre",
    },
    prestation: { type: "debarras_nettoyage", destination: "tri", typeNettoyage: "fin_de_bail", dateSouhaitee: "Semaine du 28.09.2026", remarques },
    trajet: { kmAller: 27, minAller: 30, source: "calcule", libelle: "Payerne – Fribourg" },
    pieces,
    photos: [],
    inventaire,
    nettoyageInclus: true,
  };
}

describe("dossier de référence Fribourg (Bersier)", () => {
  const grille = defaultGrille();

  it("avec la remarque « miroir » : tous les postes", () => {
    const { totaux } = calculerDevis(dossierBersier(REMARQUES_MIROIR), grille);
    expect(totaux.manutention).toBe(2965.0);
    expect(totaux.poidsDechetterieKg).toBe(1487);
    expect(totaux.elimination).toBe(356.88);
    expect(totaux.taxesSpeciales).toBe(60.0);
    expect(totaux.majorationEtage).toBe(0);
    expect(totaux.portage).toBe(30.0);
    expect(totaux.stationnement).toBe(0);
    expect(totaux.deplacement).toBe(159.8);
    expect(totaux.nettoyage).toBe(1400.0);
    expect(totaux.sousTotalHT).toBe(4971.68);
    expect(totaux.tva).toBe(402.71);
    expect(totaux.totalTTC).toBe(5374.4);
    expect(Math.abs(totaux.volumeM3 - 38.5)).toBeLessThanOrEqual(0.1);
    expect(totaux.dureeMin).toBe(687);
  });

  it("sans la remarque : miroir compté 5 fois", () => {
    const { totaux } = calculerDevis(dossierBersier("Succession, tout est à évacuer."), grille);
    expect(totaux.manutention).toBe(2973.0);
    expect(totaux.sousTotalHT).toBe(4979.68);
    expect(totaux.tva).toBe(403.35);
    expect(totaux.totalTTC).toBe(5383.05);
  });

  it("garde les lignes telles quelles, sans fusion, origine ia", () => {
    const devis = dossierBersier(REMARQUES_MIROIR);
    const attendu = Object.values(DEMO_INVENTAIRE).reduce((n, p) => n + p.items.length, 0);
    expect(devis.inventaire).toHaveLength(attendu);
    expect(devis.inventaire.filter((i) => i.pieceId === "piece_3" && i.categoryId === "petit_objet")).toHaveLength(3);
    expect(devis.inventaire.every((i) => i.origine === "ia" && i.confiance !== null && !i.filiereManuelle)).toBe(true);
  });

  it("calcule la filière initiale selon la destination saisie", () => {
    const g = defaultGrille();
    const salon = inventaireFixture("Salon", "");
    if (!salon) throw new Error("salon absent");
    const tri = itemsDepuisFixture(salon, "p", "tri", g);
    const dechetterie = itemsDepuisFixture(salon, "p", "dechetterie", g);
    const par = (items: typeof tri, id: string) => items.find((i) => i.categoryId === id)?.filiere;
    expect(par(tri, "canape_3p")).toBe("ressourcerie");
    expect(par(tri, "carton")).toBe("dechetterie");
    expect(par(tri, "petit_electro")).toBe("sens");
    expect(par(dechetterie, "canape_3p")).toBe("dechetterie");
    const cave = inventaireFixture("Cave", "");
    expect(cave && par(itemsDepuisFixture(cave, "p", "ressourcerie", g), "peinture_chimique")).toBe("special");
  });
});

describe("règles de la fixture", () => {
  it("normalise le nom de la pièce", () => {
    expect(normaliserNomPiece("  Chambre   2 ")).toBe("chambre 2");
    expect(normaliserNomPiece("CHAMBRE")).toBe("chambre 1");
    expect(normaliserNomPiece("Cuisîne")).toBe("cuisine");
    expect(inventaireFixture("chambre", "")).not.toBeNull();
    expect(inventaireFixture("Salle de bain", "")).toBeNull();
    expect(inventaireFixture("constructor", "")).toBeNull();
  });

  it("adapte le salon aux remarques du dossier", () => {
    const avec = inventaireFixture("Salon", "Conserver le MIROIR du salon");
    const sans = inventaireFixture("Salon", "Tout évacuer");
    const miroir = (f: typeof avec) => f?.items.find((i) => i.categoryId === "miroir_cadre")?.quantite;
    expect(miroir(avec)).toBe(4);
    expect(avec?.remarques.startsWith(`${PHRASE_MIROIR} `)).toBe(true);
    expect(miroir(sans)).toBe(5);
    expect(sans?.remarques).toBe(DEMO_INVENTAIRE.salon.remarques);
    expect(inventaireFixture("Cuisine", "miroir")?.remarques).toBe(DEMO_INVENTAIRE.cuisine.remarques);
    expect(DEMO_INVENTAIRE.salon.items.find((i) => i.categoryId === "miroir_cadre")?.quantite).toBe(5);
  });

  it("simule un délai de 2 000 ms + 800 ms par photo, à ±20 %", () => {
    expect(delaiSimule(2, () => 0.5)).toBe(3600);
    expect(delaiSimule(2, () => 0)).toBe(2880);
    expect(delaiSimule(2, () => 1)).toBe(4320);
    expect(delaiSimule(0, () => 0.5)).toBe(2000);
  });

  it("scripte le trajet pour Fribourg seulement", () => {
    expect(trajetFixture("Fribourg")).toEqual({ kmAller: 27, minAller: 30, source: "calcule", libelle: "Payerne – Fribourg" });
    expect(trajetFixture("FRIBOURG")).not.toBeNull();
    expect(trajetFixture("Lausanne")).toBeNull();
  });

  it("change les pièces par défaut d'une maison en mode démo seulement", () => {
    expect(nomsPiecesParDefaut("maison", true)).toEqual(PIECES_MAISON_DEMO);
    expect(nomsPiecesParDefaut("maison", false)).toEqual(["Salon", "Cuisine", "Chambre", "Salle de bain", "Cave", "Garage", "Grenier", "Extérieur"]);
    expect(nomsPiecesParDefaut("appartement", true)).toEqual(["Salon", "Cuisine", "Chambre", "Salle de bain", "Cave"]);
  });
});
