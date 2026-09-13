// Store de la démo (docs/SPEC.md §10) : zustand + persist (localStorage, clé pro-space-devis).
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MODE_FIXTURE } from "./demo/mode";
import { defaultGrille } from "./grille.default";
import { empreintePhotos } from "./hash";
import { nouvelId } from "./id";
import { numeroSuivant } from "./numbering";
import { MAX_PHOTOS_LOGEMENT, MAX_PHOTOS_PIECE, piecesApresChangementType, piecesParDefaut } from "./pieces";
import { calculerDevis, filiereParRegle } from "./pricing";
import type {
  Client,
  Devis,
  Etat,
  Filiere,
  Grille,
  InventaireItem,
  Lieu,
  Photo,
  Piece,
  Prestation,
  Remise,
  Trajet,
  TypeLogement,
} from "./types";

export const COMPTEUR_INITIAL = 413;
export const CLE_STOCKAGE = "pro-space-devis";

export interface UiState {
  pieceActiveId?: string;
  brouillonEnregistreAt?: string;
  /** Champs de l'étape 1 signalés en erreur après un clic sur « Générer le devis » refusé. */
  erreursClientVisibles?: boolean;
  exemplesCharges: boolean;
}

export type NouvelObjet = {
  pieceId: string;
  categoryId: string;
  label: string;
  quantite: number;
  etat?: Etat;
};

export type ItemPatch = Partial<Pick<InventaireItem, "quantite" | "filiere" | "filiereManuelle" | "etat">>;

export type ResultatAjoutPhoto = { ok: true } | { ok: false; raison: "piece" | "logement" };

export interface DonneesStore {
  draft: Devis;
  devis: Devis[];
  grille: Grille;
  compteur: number;
  ui: UiState;
}

export interface ActionsStore {
  setClient: (patch: Partial<Client>) => void;
  setLieu: (patch: Partial<Lieu>) => void;
  setPrestation: (patch: Partial<Prestation>) => void;
  setTrajet: (trajet: Trajet) => void;
  addPiece: (nom: string) => string;
  renamePiece: (pieceId: string, nom: string) => void;
  /** Retire la pièce, ses photos et son inventaire ; renvoie les clés IndexedDB à supprimer. */
  removePiece: (pieceId: string) => string[];
  setPieceActive: (pieceId: string) => void;
  setErreursClientVisibles: (visibles: boolean) => void;
  addPhoto: (photo: Photo) => ResultatAjoutPhoto;
  removePhoto: (photoId: string) => Photo | undefined;
  /** Remplace l'inventaire d'une pièce après analyse réussie. */
  setInventaire: (pieceId: string, items: InventaireItem[], remarques?: string) => void;
  setAnalyseErreur: (pieceId: string, message: string) => void;
  /** Oublie l'analyse d'une pièce sans photo (objets détectés retirés, ajouts manuels conservés). */
  oublierAnalyse: (pieceId: string) => void;
  updateItem: (itemId: string, patch: ItemPatch) => void;
  removeItem: (itemId: string) => void;
  addItem: (objet: NouvelObjet) => void;
  setRemise: (remise: Remise | undefined) => void;
  setNettoyageInclus: (inclus: boolean) => void;
  /** Attribue le numéro, fige le snapshot et range le devis dans Mes devis. */
  saveDevisSnapshot: (sentTo: string) => { devis: Devis; blobKeys: string[] };
  resetDraft: () => void;
  dupliquerDevis: (devisId: string) => void;
  saveGrille: (grille: Grille) => number;
  resetGrille: () => number;
  chargerExemples: (exemples: Devis[]) => void;
}

export type StoreState = DonneesStore & ActionsStore;

export function nouveauBrouillon(): Devis {
  // Mode démo scripté : une maison, pour que les sept pièces de la fixture existent dès l'étape 2.
  const type: TypeLogement = MODE_FIXTURE ? "maison" : "appartement";
  return {
    id: nouvelId("dv"),
    numero: "",
    createdAt: new Date().toISOString(),
    statut: "brouillon",
    client: { civilite: "madame", prenom: "", nom: "", email: "", telephone: "" },
    lieu: {
      rue: "",
      npa: "",
      localite: "",
      type,
      pieces: "",
      surfaceM2: undefined,
      etage: 0,
      ascenseur: false,
      portageM: 0,
      stationnement: "prive",
    },
    prestation: { type: "debarras", destination: "tri", dateSouhaitee: "", remarques: "" },
    trajet: { kmAller: 0, minAller: 0, source: "manuel", libelle: "" },
    pieces: piecesParDefaut(type),
    photos: [],
    inventaire: [],
    nettoyageInclus: false,
  };
}

/** Vrai si le brouillon contient une saisie qui mérite d'être reprise. */
export function brouillonNonVide(draft: Devis): boolean {
  const c = draft.client;
  const l = draft.lieu;
  return (
    draft.statut === "brouillon" &&
    Boolean(c.prenom || c.nom || c.email || c.telephone || l.rue || l.npa || l.localite || draft.photos.length || draft.inventaire.length)
  );
}

function recalculerHash(pieces: Piece[], photos: Photo[], pieceId: string): Piece[] {
  const ids = photos.filter((p) => p.pieceId === pieceId).map((p) => p.id);
  const hash = empreintePhotos(ids);
  return pieces.map((p) => (p.id === pieceId ? { ...p, hashPhotos: hash } : p));
}

function marquerCorrige(pieces: Piece[], pieceId: string): Piece[] {
  return pieces.map((p) => (p.id === pieceId ? { ...p, corrige: true } : p));
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      /** Applique une modification au brouillon et horodate l'enregistrement. */
      const majDraft = (fn: (draft: Devis) => Devis) =>
        set((s) => ({
          draft: fn(s.draft),
          ui: { ...s.ui, brouillonEnregistreAt: new Date().toISOString() },
        }));

      return {
        draft: nouveauBrouillon(),
        devis: [],
        grille: defaultGrille(),
        compteur: COMPTEUR_INITIAL,
        ui: { exemplesCharges: false },

        setClient: (patch) => majDraft((d) => ({ ...d, client: { ...d.client, ...patch } })),

        setLieu: (patch) =>
          majDraft((d) => {
            const lieu = { ...d.lieu, ...patch };
            let pieces = d.pieces;
            // Changement de type de logement : une pièce qui a des photos ou un inventaire n'est jamais retirée.
            if (patch.type && patch.type !== d.lieu.type) {
              const occupees = new Set([...d.photos.map((p) => p.pieceId), ...d.inventaire.map((it) => it.pieceId)]);
              pieces = piecesApresChangementType(d.pieces, d.lieu.type, patch.type, occupees);
            }
            return { ...d, lieu, pieces };
          }),

        setPrestation: (patch) =>
          majDraft((d) => {
            const prestation = { ...d.prestation, ...patch };
            let nettoyageInclus = d.nettoyageInclus;
            if (patch.type && patch.type !== d.prestation.type) {
              nettoyageInclus = patch.type !== "debarras";
            }
            if (prestation.type !== "debarras" && !prestation.typeNettoyage) {
              prestation.typeNettoyage = "fin_de_bail";
            }
            let inventaire = d.inventaire;
            if (patch.destination && patch.destination !== d.prestation.destination) {
              const categories = new Map(get().grille.catalogue.map((c) => [c.id, c]));
              inventaire = d.inventaire.map((it) =>
                it.filiereManuelle
                  ? it
                  : { ...it, filiere: filiereParRegle(categories.get(it.categoryId), it.etat, prestation.destination) },
              );
            }
            return { ...d, prestation, nettoyageInclus, inventaire };
          }),

        setTrajet: (trajet) => majDraft((d) => ({ ...d, trajet })),

        addPiece: (nom) => {
          const id = nouvelId("pc");
          majDraft((d) => ({ ...d, pieces: [...d.pieces, { id, nom: nom.trim() || "Pièce", hashPhotos: empreintePhotos([]) }] }));
          set((s) => ({ ui: { ...s.ui, pieceActiveId: id } }));
          return id;
        },

        renamePiece: (pieceId, nom) =>
          majDraft((d) => ({
            ...d,
            pieces: d.pieces.map((p) => (p.id === pieceId ? { ...p, nom: nom.trim() || p.nom } : p)),
          })),

        removePiece: (pieceId) => {
          const d = get().draft;
          const blobKeys = d.photos.filter((p) => p.pieceId === pieceId).map((p) => p.blobKey);
          majDraft((draft) => ({
            ...draft,
            pieces: draft.pieces.filter((p) => p.id !== pieceId),
            photos: draft.photos.filter((p) => p.pieceId !== pieceId),
            inventaire: draft.inventaire.filter((it) => it.pieceId !== pieceId),
          }));
          set((s) => ({
            ui: {
              ...s.ui,
              pieceActiveId: s.ui.pieceActiveId === pieceId ? s.draft.pieces[0]?.id : s.ui.pieceActiveId,
            },
          }));
          return blobKeys;
        },

        setPieceActive: (pieceId) => set((s) => ({ ui: { ...s.ui, pieceActiveId: pieceId } })),

        setErreursClientVisibles: (visibles) => set((s) => ({ ui: { ...s.ui, erreursClientVisibles: visibles } })),

        addPhoto: (photo) => {
          const d = get().draft;
          if (d.photos.length >= MAX_PHOTOS_LOGEMENT) return { ok: false, raison: "logement" };
          if (d.photos.filter((p) => p.pieceId === photo.pieceId).length >= MAX_PHOTOS_PIECE) {
            return { ok: false, raison: "piece" };
          }
          majDraft((draft) => {
            const photos = [...draft.photos, photo];
            return { ...draft, photos, pieces: recalculerHash(draft.pieces, photos, photo.pieceId) };
          });
          return { ok: true };
        },

        removePhoto: (photoId) => {
          const photo = get().draft.photos.find((p) => p.id === photoId);
          if (!photo) return undefined;
          majDraft((draft) => {
            const photos = draft.photos.filter((p) => p.id !== photoId);
            return { ...draft, photos, pieces: recalculerHash(draft.pieces, photos, photo.pieceId) };
          });
          return photo;
        },

        setInventaire: (pieceId, items, remarques) =>
          majDraft((d) => ({
            ...d,
            inventaire: [...d.inventaire.filter((it) => it.pieceId !== pieceId), ...items],
            pieces: d.pieces.map((p) =>
              p.id === pieceId
                ? { ...p, corrige: false, analyse: { at: new Date().toISOString(), status: "ok", remarques, hash: p.hashPhotos } }
                : p,
            ),
          })),

        setAnalyseErreur: (pieceId, message) =>
          majDraft((d) => ({
            ...d,
            pieces: d.pieces.map((p) =>
              p.id === pieceId
                ? {
                    ...p,
                    analyse: { at: new Date().toISOString(), status: "erreur", hash: p.analyse?.hash ?? "", erreur: message },
                  }
                : p,
            ),
          })),

        oublierAnalyse: (pieceId) =>
          majDraft((d) => ({
            ...d,
            inventaire: d.inventaire.filter((it) => !(it.pieceId === pieceId && it.origine === "ia")),
            pieces: d.pieces.map((p) => (p.id === pieceId ? { ...p, analyse: undefined, corrige: false } : p)),
          })),

        updateItem: (itemId, patch) =>
          majDraft((d) => {
            const item = d.inventaire.find((it) => it.id === itemId);
            if (!item) return d;
            const suivant: InventaireItem = { ...item, ...patch };
            if (patch.quantite !== undefined) suivant.quantite = Math.max(1, Math.min(999, Math.round(patch.quantite)));
            return {
              ...d,
              inventaire: d.inventaire.map((it) => (it.id === itemId ? suivant : it)),
              pieces: marquerCorrige(d.pieces, item.pieceId),
            };
          }),

        removeItem: (itemId) =>
          majDraft((d) => {
            const item = d.inventaire.find((it) => it.id === itemId);
            if (!item) return d;
            return {
              ...d,
              inventaire: d.inventaire.filter((it) => it.id !== itemId),
              pieces: marquerCorrige(d.pieces, item.pieceId),
            };
          }),

        addItem: (objet) =>
          majDraft((d) => {
            const categorie = get().grille.catalogue.find((c) => c.id === objet.categoryId);
            const etat: Etat = objet.etat ?? "use";
            const filiere: Filiere = filiereParRegle(categorie, etat, d.prestation.destination);
            const item: InventaireItem = {
              id: nouvelId("it"),
              pieceId: objet.pieceId,
              categoryId: objet.categoryId,
              label: objet.label,
              quantite: Math.max(1, Math.round(objet.quantite)),
              confiance: null,
              etat,
              filiere,
              photos: [],
              origine: "manuel",
            };
            return { ...d, inventaire: [...d.inventaire, item], pieces: marquerCorrige(d.pieces, objet.pieceId) };
          }),

        setRemise: (remise) => majDraft((d) => ({ ...d, remise })),

        setNettoyageInclus: (inclus) =>
          majDraft((d) => ({
            ...d,
            nettoyageInclus: inclus,
            prestation: inclus && !d.prestation.typeNettoyage ? { ...d.prestation, typeNettoyage: "fin_de_bail" } : d.prestation,
          })),

        saveDevisSnapshot: (sentTo) => {
          const { draft, grille, compteur, devis } = get();
          if (draft.statut === "envoye") return { devis: draft, blobKeys: [] };
          const maintenant = new Date();
          const { lignes, totaux } = calculerDevis(draft, grille);
          const envoye: Devis = {
            ...draft,
            numero: numeroSuivant(compteur, maintenant),
            statut: "envoye",
            photos: [],
            snapshot: { grilleVersion: grille.version, lignes, totaux, sentAt: maintenant.toISOString(), sentTo },
          };
          set({ draft: envoye, devis: [envoye, ...devis], compteur: compteur + 1 });
          return { devis: envoye, blobKeys: draft.photos.map((p) => p.blobKey) };
        },

        resetDraft: () =>
          set((s) => ({
            draft: nouveauBrouillon(),
            ui: { ...s.ui, pieceActiveId: undefined, brouillonEnregistreAt: undefined, erreursClientVisibles: undefined },
          })),

        dupliquerDevis: (devisId) => {
          const { devis, draft } = get();
          const source = devis.find((d) => d.id === devisId) ?? (draft.id === devisId ? draft : undefined);
          if (!source) return;
          const vide = empreintePhotos([]);
          const copie: Devis = structuredClone(source);
          const nouveau: Devis = {
            ...copie,
            id: nouvelId("dv"),
            numero: "",
            createdAt: new Date().toISOString(),
            statut: "brouillon",
            snapshot: undefined,
            exemple: undefined,
            photos: [],
            pieces: copie.pieces.map((p) => ({
              ...p,
              hashPhotos: vide,
              analyse: p.analyse ? { ...p.analyse, hash: vide } : undefined,
            })),
          };
          set((s) => ({
            draft: nouveau,
            ui: { ...s.ui, pieceActiveId: nouveau.pieces[0]?.id, brouillonEnregistreAt: new Date().toISOString() },
          }));
        },

        saveGrille: (grille) => {
          const version = get().grille.version + 1;
          set({ grille: { ...structuredClone(grille), version, updatedAt: new Date().toISOString() } });
          return version;
        },

        resetGrille: () => {
          const version = get().grille.version + 1;
          set({ grille: { ...defaultGrille(), version, updatedAt: new Date().toISOString() } });
          return version;
        },

        chargerExemples: (exemples) =>
          set((s) => {
            if (s.devis.length > 0 || s.ui.exemplesCharges) return { ui: { ...s.ui, exemplesCharges: true } };
            return { devis: exemples, ui: { ...s.ui, exemplesCharges: true } };
          }),
      };
    },
    {
      name: CLE_STOCKAGE,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): DonneesStore => ({
        draft: s.draft,
        devis: s.devis,
        grille: s.grille,
        compteur: s.compteur,
        ui: s.ui,
      }),
    },
  ),
);
