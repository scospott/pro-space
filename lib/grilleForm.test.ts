import { describe, expect, it } from "vitest";
import { defaultGrille } from "./grille.default";
import { cleErreurCategorie, cleErreurParam, depuisFormulaire, genererIdCategorie, nouvelleLigne, versFormulaire } from "./grilleForm";

describe("formulaire de grille", () => {
  it("fait l'aller-retour sans perte", () => {
    const grille = defaultGrille();
    const { grille: relue, erreurs } = depuisFormulaire(versFormulaire(grille), grille);
    expect(erreurs).toEqual({});
    expect(relue).toEqual(grille);
  });

  it("accepte la virgule décimale", () => {
    const grille = defaultGrille();
    const form = versFormulaire(grille);
    form.params.tvaPct = "7,7";
    form.catalogue[0].prixCHF = "120,50";
    const { grille: relue } = depuisFormulaire(form, grille);
    expect(relue?.params.tvaPct).toBe(7.7);
    expect(relue?.catalogue[0].prixCHF).toBe(120.5);
  });

  it("refuse les nombres négatifs, vides ou invalides", () => {
    const grille = defaultGrille();
    const form = versFormulaire(grille);
    form.params.tarifKm = "-1";
    form.params.tauxHoraireEquipe = "";
    form.catalogue[0].volumeM3 = "abc";
    form.catalogue[1].label = " ";
    const { grille: relue, erreurs } = depuisFormulaire(form, grille);
    expect(relue).toBeNull();
    expect(erreurs[cleErreurParam("tarifKm")]).toBe("Doit être positif ou nul.");
    expect(erreurs[cleErreurParam("tauxHoraireEquipe")]).toBe("Valeur requise.");
    expect(erreurs[cleErreurCategorie(form.catalogue[0].id, "volumeM3")]).toContain("invalide");
    expect(erreurs[cleErreurCategorie(form.catalogue[1].id, "label")]).toBe("Libellé requis.");
  });

  it("exige une TVA en pourcentage et un plafond au moins égal à la majoration", () => {
    const grille = defaultGrille();
    const form = versFormulaire(grille);
    form.params.tvaPct = "108";
    form.params.majorationEtagePct = "20";
    form.params.majorationEtageMaxPct = "15";
    const { erreurs } = depuisFormulaire(form, grille);
    expect(erreurs[cleErreurParam("tvaPct")]).toBe("Au plus 100.");
    expect(erreurs[cleErreurParam("majorationEtageMaxPct")]).toContain("plafond");
  });

  it("ne garde la taxe unitaire que pour la filière spéciale", () => {
    const grille = defaultGrille();
    const form = versFormulaire(grille);
    const pneu = form.catalogue.find((c) => c.id === "pneu");
    const chaise = form.catalogue.find((c) => c.id === "chaise");
    if (!pneu || !chaise) throw new Error("catégories absentes");
    chaise.taxeUnitaireCHF = "3";
    pneu.filiereDefaut = "dechetterie";
    const { grille: relue } = depuisFormulaire(form, grille);
    expect(relue?.catalogue.find((c) => c.id === "chaise")?.taxeUnitaireCHF).toBeUndefined();
    expect(relue?.catalogue.find((c) => c.id === "pneu")?.taxeUnitaireCHF).toBeUndefined();
  });

  it("génère des identifiants snake_case uniques", () => {
    expect(genererIdCategorie("Machine à café", [])).toBe("machine_a_cafe");
    expect(genererIdCategorie("Chaise", ["chaise"])).toBe("chaise_2");
    expect(genererIdCategorie("Chaise", ["chaise", "chaise_2"])).toBe("chaise_3");
    expect(genererIdCategorie("!!!", [])).toBe("categorie");
    const ligne = nouvelleLigne("Jacuzzi gonflable", "Cave et extérieur", "spa, piscine", ["x"]);
    expect(ligne.id).toBe("jacuzzi_gonflable");
    expect(/^[a-z0-9_]+$/.test(ligne.id)).toBe(true);
  });
});
