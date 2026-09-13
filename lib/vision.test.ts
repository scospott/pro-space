import { describe, expect, it } from "vitest";
import { inventaireAJour, piecesAAnalyser, piecesAOublier, piecesModifiees } from "./analyse";
import { defaultGrille } from "./grille.default";
import { empreintePhotos } from "./hash";
import type { Photo, Piece } from "./types";
import { buildSystemPrompt, buildTool, lireReponseOutil, postTraiter } from "./vision";

const grille = defaultGrille();

describe("postTraiter", () => {
  it("fusionne les doublons de même catégorie : quantités additionnées, confiance minimale", () => {
    const raw = {
      items: [
        { categoryId: "carton", label: "Cartons empilés", quantity: 4, confidence: 0.9, etat: "use", photos: [1] },
        { categoryId: "canape_3p", label: "Canapé gris", quantity: 1, confidence: 0.96, etat: "use", photos: [1, 2] },
        { categoryId: "carton", label: "Cartons sous la table", quantity: 2, confidence: 0.7, etat: "use", photos: [3, 1] },
      ],
      remarques: "Piano à conserver, non compté",
    };
    const items = postTraiter(raw, "salon", "tri", grille);
    expect(items).toHaveLength(2);
    const cartons = items.find((i) => i.categoryId === "carton");
    expect(cartons?.quantite).toBe(6);
    expect(cartons?.confiance).toBe(0.7);
    expect(cartons?.photos).toEqual([1, 3]);
    expect(items.every((i) => i.origine === "ia" && i.pieceId === "salon")).toBe(true);
    expect(lireReponseOutil(raw).remarques).toBe("Piano à conserver, non compté");
  });

  it("classe une catégorie inconnue en petit objet, avec une note", () => {
    const items = postTraiter(
      { items: [{ categoryId: "aquarium", label: "Aquarium", quantity: 1, confidence: 0.8, etat: "bon", photos: [2] }] },
      "salon",
      "dechetterie",
      grille,
    );
    expect(items).toHaveLength(1);
    expect(items[0].categoryId).toBe("petit_objet");
    expect(items[0].label).toBe("Aquarium");
    expect(items[0].note).toContain("aquarium");
  });

  it("attribue la filière initiale selon la règle §6.1", () => {
    const raw = {
      items: [
        { categoryId: "refrigerateur", label: "Frigo", quantity: 1, confidence: 0.95, etat: "bon", photos: [1] },
        { categoryId: "pneu", label: "Pneus", quantity: 4, confidence: 0.9, etat: "hs", photos: [1] },
        { categoryId: "commode", label: "Commode", quantity: 1, confidence: 0.9, etat: "bon", photos: [1] },
        { categoryId: "lit_double", label: "Lit", quantity: 1, confidence: 0.9, etat: "use", photos: [1] },
      ],
    };
    const tri = postTraiter(raw, "p", "tri", grille);
    const filiere = (items: typeof tri, id: string) => items.find((i) => i.categoryId === id)?.filiere;
    expect(filiere(tri, "refrigerateur")).toBe("sens");
    expect(filiere(tri, "pneu")).toBe("special");
    expect(filiere(tri, "commode")).toBe("ressourcerie");
    expect(filiere(tri, "lit_double")).toBe("dechetterie");
    const dechetterie = postTraiter(raw, "p", "dechetterie", grille);
    expect(filiere(dechetterie, "commode")).toBe("dechetterie");
    expect(filiere(dechetterie, "refrigerateur")).toBe("sens");
    const ressourcerie = postTraiter(raw, "p", "ressourcerie", grille);
    expect(filiere(ressourcerie, "lit_double")).toBe("ressourcerie");
  });

  it("garde l'état le plus dégradé lors d'une fusion", () => {
    const items = postTraiter(
      {
        items: [
          { categoryId: "chaise", label: "Chaise", quantity: 2, confidence: 0.9, etat: "bon", photos: [1] },
          { categoryId: "chaise", label: "Chaise cassée", quantity: 1, confidence: 0.9, etat: "hs", photos: [2] },
        ],
      },
      "cuisine",
      "tri",
      grille,
    );
    expect(items[0].quantite).toBe(3);
    expect(items[0].etat).toBe("hs");
    expect(items[0].filiere).toBe("dechetterie");
  });

  it("tolère une réponse mal formée sans planter", () => {
    expect(postTraiter(null, "p", "tri", grille)).toEqual([]);
    expect(postTraiter({ items: "rien" }, "p", "tri", grille)).toEqual([]);
    const items = postTraiter(
      { items: [{ categoryId: "chaise", quantity: 2.6, confidence: 7, etat: "neuf", photos: ["1", -3, 2] }, 42, { label: "sans id" }] },
      "p",
      "tri",
      grille,
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantite).toBe(3);
    expect(items[0].confiance).toBe(1);
    expect(items[0].etat).toBe("use");
    expect(items[0].photos).toEqual([1, 2]);
  });

  it("utilise la grille passée en argument, pas la grille par défaut", () => {
    const reduite = { ...defaultGrille(), catalogue: defaultGrille().catalogue.filter((c) => c.id !== "petit_objet") };
    const items = postTraiter({ items: [{ categoryId: "inconnu", label: "X", quantity: 1, confidence: 1, etat: "bon", photos: [] }] }, "p", "tri", reduite);
    expect(items[0].categoryId).toBe(reduite.catalogue[0].id);
  });
});

describe("prompt et outil", () => {
  it("injecte la pièce, les remarques et le catalogue", () => {
    const prompt = buildSystemPrompt(grille.catalogue, "Salon", "Conserver le piano");
    expect(prompt).toContain("« Salon »");
    expect(prompt).toContain("Conserver le piano");
    expect(prompt).toContain("- canape_3p : Canapé 3 places (sofa, divan, canapé-lit)");
    expect(prompt).toContain("report_inventory");
    expect(prompt).not.toMatch(/CHF|prix de/i);
  });

  it("déclare l'enum des 40 ids du catalogue", () => {
    const outil = buildTool(grille.catalogue);
    expect(outil.name).toBe("report_inventory");
    const schema = JSON.stringify(outil.input_schema);
    for (const c of grille.catalogue) expect(schema).toContain(`"${c.id}"`);
    expect(grille.catalogue).toHaveLength(40);
  });
});

describe("ré-analyse partielle", () => {
  const photo = (id: string, pieceId: string): Photo => ({ id, pieceId, blobKey: `photo:${id}`, width: 10, height: 10, addedAt: "" });
  const salonPhotos = [photo("a", "salon"), photo("b", "salon")];
  const cavePhotos = [photo("c", "cave")];
  const photos = [...salonPhotos, ...cavePhotos];
  const hSalon = empreintePhotos(["a", "b"]);
  const hCave = empreintePhotos(["c"]);

  it("n'envoie que les pièces dont les photos ont changé", () => {
    const pieces: Piece[] = [
      { id: "salon", nom: "Salon", hashPhotos: hSalon, analyse: { at: "", status: "ok", hash: hSalon } },
      { id: "cave", nom: "Cave", hashPhotos: hCave, analyse: { at: "", status: "ok", hash: empreintePhotos([]) } },
      { id: "chambre", nom: "Chambre", hashPhotos: empreintePhotos([]) },
    ];
    const d = { photos, pieces, inventaire: [] };
    expect(piecesAAnalyser(d).map((p) => p.id)).toEqual(["cave"]);
    expect(piecesModifiees(d).map((p) => p.id)).toEqual(["cave"]);
    expect(inventaireAJour(d)).toBe(false);
  });

  it("relance les pièces en échec et oublie celles qui n'ont plus de photo", () => {
    const pieces: Piece[] = [
      { id: "salon", nom: "Salon", hashPhotos: hSalon, analyse: { at: "", status: "erreur", hash: "" } },
      { id: "sdb", nom: "Salle de bain", hashPhotos: empreintePhotos([]), analyse: { at: "", status: "ok", hash: empreintePhotos(["z"]) } },
    ];
    const d = { photos: salonPhotos, pieces, inventaire: [] };
    expect(piecesAAnalyser(d).map((p) => p.id)).toEqual(["salon"]);
    expect(piecesAOublier(d).map((p) => p.id)).toEqual(["sdb"]);
  });

  it("considère l'inventaire à jour quand tout correspond", () => {
    const pieces: Piece[] = [{ id: "salon", nom: "Salon", hashPhotos: hSalon, analyse: { at: "", status: "ok", hash: hSalon } }];
    expect(inventaireAJour({ photos: salonPhotos, pieces, inventaire: [] })).toBe(true);
  });
});
