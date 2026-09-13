// Extraction vision (docs/SPEC.md §7) : prompt, outil et post-traitement. Pur, sans appel réseau.
// Le modèle classe et compte ; aucun prix ne transite par ici.

import type Anthropic from "@anthropic-ai/sdk";
import { nouvelId } from "./id";
import { filiereParRegle } from "./pricing";
import type { Categorie, Destination, Etat, Grille, InventaireItem } from "./types";

export const OUTIL_INVENTAIRE = "report_inventory";
export const ID_REPLI = "petit_objet";

export type EntreeCatalogue = Pick<Categorie, "id" | "label" | "exemples">;

export interface ObjetBrut {
  categoryId: string;
  label: string;
  quantity: number;
  confidence: number;
  etat: Etat;
  photos: number[];
  note?: string;
}

export interface ReponseBrute {
  items: ObjetBrut[];
  remarques: string;
}

export function buildSystemPrompt(catalogue: readonly EntreeCatalogue[], nomPiece: string, remarques: string): string {
  const lignes = catalogue.map((c) => `- ${c.id} : ${c.label}${c.exemples ? ` (${c.exemples})` : ""}`).join("\n");
  const consignes = remarques.trim() ? remarques.trim() : "aucune";
  return `Tu es l'inventoriste de Pro Space, entreprise suisse de débarras et de nettoyage à Payerne. À partir de photos, tu reconnais et tu comptes les objets à évacuer. Tu ne donnes jamais de prix : le chiffrage est fait ensuite par la grille tarifaire de l'entreprise.

Les photos jointes montrent une seule pièce, « ${nomPiece} », sous plusieurs angles. Elles sont numérotées de 1 à n dans l'ordre d'envoi.

Règles :
1. Compte chaque objet physique une seule fois, même s'il apparaît sur plusieurs photos. Sers-toi de la position, de la couleur et du décor pour reconnaître un même objet vu sous deux angles.
2. Ne compte pas ce qui est fixé au bâtiment : cuisine agencée (meubles hauts et bas, plan de travail, évier, hotte), radiateurs, sanitaires (lavabo, WC, baignoire, douche), luminaires au plafond, stores, volets, portes, placards encastrés.
3. Exclus les objets que le dossier demande de conserver. Remarques du dossier : « ${consignes} ». Si un objet exclu est visible, mentionne-le dans remarques.
4. Regroupe les petits objets en cartons ou en sacs (carton, sac_dechets, vaisselle_carton, vetements_sac) : estime le nombre de cartons de déménagement nécessaires et arrondis au nombre supérieur.
5. Rattache chaque objet à la catégorie la plus proche en volume. Si aucune ne convient : gros_volume pour un objet encombrant (quantité = nombre de m³ estimés, arrondi au supérieur), petit_objet pour un petit objet isolé.
6. confidence entre 0 et 1 : sous 0.85 quand la photo est sombre, floue ou partielle, quand l'objet est en partie caché ou quand la catégorie est ambiguë.
7. etat selon l'aspect visible : bon (réutilisable tel quel), use (usé mais entier), hs (cassé, taché, hors d'usage).
8. photos : numéros des photos où l'objet est visible.
9. label : ce que tu vois, en français, 2 à 6 mots (par exemple « Canapé d'angle gris »).
10. Si la pièce est vide ou si les photos ne montrent pas une pièce, renvoie une liste vide et explique pourquoi dans remarques.
11. Signale dans remarques ce qui compte pour l'intervention : accès difficile, objets très lourds, doutes, objets hors catalogue.

Réponds uniquement en appelant l'outil ${OUTIL_INVENTAIRE}.

Catalogue (id : libellé, exemples) :
${lignes}`;
}

export function buildTool(catalogue: readonly EntreeCatalogue[]): Anthropic.Tool {
  return {
    name: OUTIL_INVENTAIRE,
    description: "Transmet l'inventaire des objets à évacuer visibles dans la pièce photographiée.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              categoryId: { type: "string", enum: catalogue.map((c) => c.id) },
              label: { type: "string", description: "Ce qui est vu, en français, 2 à 6 mots" },
              quantity: { type: "integer", minimum: 1 },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              etat: { type: "string", enum: ["bon", "use", "hs"] },
              photos: { type: "array", items: { type: "integer" }, description: "Index des photos (1..n) où l'objet est visible" },
              note: { type: "string" },
            },
            required: ["categoryId", "label", "quantity", "confidence", "etat", "photos"],
          },
        },
        remarques: { type: "string", description: "Accès, objets lourds, doutes, objets hors catalogue" },
      },
      required: ["items"],
    },
  };
}

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const ETATS: readonly Etat[] = ["bon", "use", "hs"];
const GRAVITE: Record<Etat, number> = { bon: 0, use: 1, hs: 2 };

/** Lit l'entrée de l'outil (ou la réponse de /api/analyse) en tolérant les écarts de forme. */
export function lireReponseOutil(raw: unknown): ReponseBrute {
  if (!estObjet(raw)) return { items: [], remarques: "" };
  const remarques = typeof raw.remarques === "string" ? raw.remarques.trim() : "";
  const entrees = Array.isArray(raw.items) ? raw.items : [];
  const items: ObjetBrut[] = [];
  for (const e of entrees) {
    if (!estObjet(e) || typeof e.categoryId !== "string") continue;
    const quantite = Number(e.quantity);
    const confiance = Number(e.confidence);
    const etat = ETATS.find((x) => x === e.etat) ?? "use";
    const photos = Array.isArray(e.photos) ? e.photos.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 50) : [];
    items.push({
      categoryId: e.categoryId.trim(),
      label: typeof e.label === "string" && e.label.trim() ? e.label.trim().slice(0, 80) : e.categoryId,
      quantity: Number.isFinite(quantite) ? Math.min(999, Math.max(1, Math.round(quantite))) : 1,
      confidence: Number.isFinite(confiance) ? Math.min(1, Math.max(0, confiance)) : 0.5,
      etat,
      photos,
      note: typeof e.note === "string" && e.note.trim() ? e.note.trim().slice(0, 200) : undefined,
    });
  }
  return { items, remarques };
}

export function lireRemarques(raw: unknown): string {
  return lireReponseOutil(raw).remarques;
}

/**
 * Transforme la réponse du modèle en lignes d'inventaire d'une pièce :
 * fusion des doublons de même catégorie (quantités additionnées, confiance minimale),
 * catégorie inconnue → petit_objet avec note, filière initiale selon §6.1, origine 'ia'.
 */
export function postTraiter(raw: unknown, pieceId: string, destination: Destination, grille: Grille): InventaireItem[] {
  const { items } = lireReponseOutil(raw);
  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));
  const repli = categories.has(ID_REPLI) ? ID_REPLI : grille.catalogue[0]?.id;
  if (!repli) return [];

  const fusion = new Map<string, InventaireItem>();
  for (const brut of items) {
    let categoryId = brut.categoryId;
    const notes: string[] = brut.note ? [brut.note] : [];
    if (!categories.has(categoryId)) {
      notes.push(`Catégorie « ${brut.categoryId} » absente du catalogue, classée en petit objet`);
      categoryId = repli;
    }
    const existant = fusion.get(categoryId);
    if (!existant) {
      fusion.set(categoryId, {
        id: nouvelId("it"),
        pieceId,
        categoryId,
        label: brut.label,
        quantite: brut.quantity,
        confiance: brut.confidence,
        etat: brut.etat,
        filiere: "dechetterie",
        photos: [...new Set(brut.photos)].sort((a, b) => a - b),
        origine: "ia",
        note: notes.length ? notes.join(" ; ") : undefined,
      });
      continue;
    }
    existant.quantite = Math.min(999, existant.quantite + brut.quantity);
    existant.confiance = Math.min(existant.confiance ?? 1, brut.confidence);
    if (GRAVITE[brut.etat] > GRAVITE[existant.etat]) existant.etat = brut.etat;
    existant.photos = [...new Set([...existant.photos, ...brut.photos])].sort((a, b) => a - b);
    if (brut.label !== existant.label && !existant.label.includes(brut.label)) {
      existant.label = `${existant.label}, ${brut.label}`.slice(0, 80);
    }
    if (notes.length) existant.note = [existant.note, ...notes].filter(Boolean).join(" ; ");
  }

  return [...fusion.values()].map((item) => ({
    ...item,
    filiere: filiereParRegle(categories.get(item.categoryId), item.etat, destination),
  }));
}
