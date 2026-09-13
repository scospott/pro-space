"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { inventaireAJour, piecesAAnalyser, photosParPiece } from "@/lib/analyse";
import { nouvelId } from "@/lib/id";
import { ImageIllisibleError, preparerImage } from "@/lib/image";
import { deletePhoto, deletePhotos, putPhoto, QuotaPhotosError, StockageIndisponibleError } from "@/lib/photos";
import { MAX_PHOTOS_LOGEMENT, MAX_PHOTOS_PIECE } from "@/lib/pieces";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { etape1Valide } from "@/lib/validation";
import { BottomBar } from "../BottomBar";
import { Button, ButtonLink } from "../Button";
import { Chargement } from "../Chargement";
import { ConfirmDialog } from "../ConfirmDialog";
import { DevisEnvoyeNotice } from "../DevisEnvoyeNotice";
import { inputClass } from "../Field";
import { PhotoTile } from "../PhotoTile";
import { RoomList } from "../RoomList";
import { useToast } from "../Toast";

const SUGGESTIONS = ["Chambre 2", "Bureau", "Buanderie", "Garage", "Grenier", "Extérieur"];

const iconeProps = {
  viewBox: "0 0 24 24",
  className: "h-[26px] w-[26px] fill-none stroke-current",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

type Dialogue =
  | { type: "ajout"; nom: string }
  | { type: "renommer"; pieceId: string; nom: string }
  | { type: "supprimer"; pieceId: string }
  | null;

type Alerte = { ton: "warn" | "danger"; texte: string } | null;

function pluralPhotos(n: number): string {
  return `${n} photo${n > 1 ? "s" : ""}`;
}

export type EcranPhotosProps = {
  /** Lancement de la génération (branché sur l'overlay d'analyse). */
  onGenerer?: () => void;
  overlay?: ReactNode;
};

export function EcranPhotos({ onGenerer, overlay }: EcranPhotosProps) {
  const hydrated = useHydrated();
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const pieceActiveId = useStore((s) => s.ui.pieceActiveId);
  const setPieceActive = useStore((s) => s.setPieceActive);
  const addPiece = useStore((s) => s.addPiece);
  const renamePiece = useStore((s) => s.renamePiece);
  const removePiece = useStore((s) => s.removePiece);
  const addPhoto = useStore((s) => s.addPhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const toast = useToast((s) => s.show);
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [alerte, setAlerte] = useState<Alerte>(null);
  const [traitement, setTraitement] = useState<{ fait: number; total: number } | null>(null);

  if (!hydrated) return <Chargement />;
  if (draft.statut === "envoye") return <DevisEnvoyeNotice />;

  const compteurs = photosParPiece(draft);
  const piece = draft.pieces.find((p) => p.id === pieceActiveId) ?? draft.pieces[0];
  const total = draft.photos.length;
  const nPiece = piece ? (compteurs.get(piece.id) ?? 0) : 0;
  const photosPiece = piece ? draft.photos.filter((p) => p.pieceId === piece.id) : [];
  const piecesAvecPhotos = draft.pieces.filter((p) => (compteurs.get(p.id) ?? 0) > 0).length;
  const pleinLogement = total >= MAX_PHOTOS_LOGEMENT;
  const pleinPiece = nPiece >= MAX_PHOTOS_PIECE;
  const bloque = traitement !== null;
  const aJour = inventaireAJour(draft);
  const aAnalyser = piecesAAnalyser(draft);
  const nettoyageSeul = draft.prestation.type === "nettoyage";
  const peutAvancer = aJour || total > 0 || nettoyageSeul;
  const libelleAction = aJour || (nettoyageSeul && total === 0) ? "Voir le devis" : "Générer le devis";

  const ajouterFichiers = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const fichiers = input.files ? Array.from(input.files) : [];
    input.value = "";
    if (!piece || fichiers.length === 0) return;
    const pieceId = piece.id;
    let ajoutees = 0;
    let illisibles = 0;
    let alerteFinale: Alerte = null;
    setAlerte(null);
    setTraitement({ fait: 0, total: fichiers.length });

    for (const [i, fichier] of fichiers.entries()) {
      const d = useStore.getState().draft;
      const restants = fichiers.length - i;
      if (d.photos.length >= MAX_PHOTOS_LOGEMENT) {
        alerteFinale = {
          ton: "warn",
          texte: `Limite de ${MAX_PHOTOS_LOGEMENT} photos par logement atteinte : ${pluralPhotos(restants)} non ajoutée${restants > 1 ? "s" : ""}. Supprimez des photos moins utiles pour en ajouter d'autres.`,
        };
        break;
      }
      if (d.photos.filter((p) => p.pieceId === pieceId).length >= MAX_PHOTOS_PIECE) {
        alerteFinale = {
          ton: "warn",
          texte: `Limite de ${MAX_PHOTOS_PIECE} photos par pièce atteinte : ${pluralPhotos(restants)} non ajoutée${restants > 1 ? "s" : ""}. Supprimez-en une ou créez une autre pièce.`,
        };
        break;
      }
      try {
        const image = await preparerImage(fichier);
        const id = nouvelId("ph");
        const blobKey = `photo:${id}`;
        await putPhoto(blobKey, image.blob);
        const resultat = addPhoto({ id, pieceId, blobKey, width: image.width, height: image.height, addedAt: new Date().toISOString() });
        if (!resultat.ok) {
          await deletePhoto(blobKey);
          continue;
        }
        ajoutees++;
      } catch (err) {
        if (err instanceof QuotaPhotosError) {
          alerteFinale = {
            ton: "danger",
            texte: "Stockage de la tablette plein : la photo n'a pas été enregistrée. Supprimez des photos ou envoyez les devis en cours, puis réessayez.",
          };
          break;
        }
        if (err instanceof StockageIndisponibleError) {
          alerteFinale = {
            ton: "danger",
            texte:
              "La tablette refuse d'enregistrer les photos (stockage du navigateur indisponible, par exemple en navigation privée). Ouvrez l'application dans un onglet normal, puis réessayez.",
          };
          break;
        }
        if (err instanceof ImageIllisibleError || err instanceof Error) illisibles++;
      }
      setTraitement({ fait: i + 1, total: fichiers.length });
    }

    if (!alerteFinale && illisibles > 0) {
      alerteFinale = {
        ton: "danger",
        texte: `${pluralPhotos(illisibles)} illisible${illisibles > 1 ? "s" : ""} : format non reconnu. Reprenez la photo avec l'appareil ou choisissez un fichier JPEG ou PNG.`,
      };
    }
    setTraitement(null);
    setAlerte(alerteFinale);
    if (ajoutees > 0 && !alerteFinale) toast(`${pluralPhotos(ajoutees)} ajoutée${ajoutees > 1 ? "s" : ""} à ${piece.nom}`);
  };

  const supprimerPhoto = (photoId: string) => {
    const photo = removePhoto(photoId);
    if (photo) void deletePhoto(photo.blobKey).catch(() => undefined);
    setAlerte(null);
  };

  const demanderSuppressionPiece = (pieceId: string) => {
    const aDesDonnees = (compteurs.get(pieceId) ?? 0) > 0 || draft.inventaire.some((it) => it.pieceId === pieceId);
    if (aDesDonnees) setDialogue({ type: "supprimer", pieceId });
    else removePiece(pieceId);
  };

  const confirmerSuppressionPiece = (pieceId: string) => {
    const cles = removePiece(pieceId);
    void deletePhotos(cles).catch(() => undefined);
    setDialogue(null);
  };

  const generer = () => {
    if (!etape1Valide(useStore.getState().draft)) {
      toast("Complétez d'abord le client et le lieu");
      router.push("/nouveau/client");
      return;
    }
    if (aJour || (nettoyageSeul && total === 0) || !onGenerer) {
      router.push("/nouveau/devis");
      return;
    }
    onGenerer();
  };

  let etatAnalyse: ReactNode = null;
  if (piece) {
    const nObjets = draft.inventaire.filter((it) => it.pieceId === piece.id).length;
    if (piece.analyse?.status === "ok" && piece.analyse.hash === piece.hashPhotos) {
      etatAnalyse = <span className="text-ok">Analysée : {nObjets > 1 ? `${nObjets} lignes d'inventaire` : `${nObjets} ligne d'inventaire`}</span>;
    } else if (piece.analyse?.status === "ok") {
      etatAnalyse = <span className="text-warn">Photos modifiées depuis l&apos;analyse : seule cette pièce sera analysée à nouveau.</span>;
    } else if (piece.analyse?.status === "erreur" && nPiece > 0) {
      etatAnalyse = <span className="text-danger">La dernière analyse de cette pièce a échoué, elle sera relancée.</span>;
    } else if (nPiece > 0) {
      etatAnalyse = <span>Pas encore analysée.</span>;
    }
  }

  const tuileAjout = "relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-r border-[1.5px] border-dashed border-line bg-surface-2 p-2 text-center font-semibold text-brand focus-within:outline-2 focus-within:outline-brand";
  const tuileDesactivee = "cursor-not-allowed opacity-50";
  const ajoutImpossible = pleinLogement || pleinPiece || bloque;
  const raisonLimite = pleinLogement
    ? `Limite de ${MAX_PHOTOS_LOGEMENT} photos atteinte`
    : pleinPiece
      ? `Limite de ${MAX_PHOTOS_PIECE} photos pour cette pièce`
      : null;

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <RoomList
          pieces={draft.pieces}
          actifId={piece?.id}
          compteurs={compteurs}
          onChoisir={(id) => {
            setPieceActive(id);
            setAlerte(null);
          }}
          onAjouter={() => setDialogue({ type: "ajout", nom: "" })}
          disabled={bloque}
        />
        <section className="min-w-0 flex-1 overflow-auto px-6 py-[18px]" aria-labelledby="titre-piece">
          {piece ? (
            <>
              <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 id="titre-piece" className="m-0 text-[17px] font-semibold">
                  {piece.nom}
                </h2>
                <Button className="h-12 px-3 text-[13px]" onClick={() => setDialogue({ type: "renommer", pieceId: piece.id, nom: piece.nom })} disabled={bloque}>
                  Renommer
                </Button>
                <Button className="h-12 px-3 text-[13px]" onClick={() => demanderSuppressionPiece(piece.id)} disabled={bloque}>
                  Supprimer la pièce
                </Button>
                <span className="montant ml-auto text-muted" aria-live="polite">
                  {total} / {MAX_PHOTOS_LOGEMENT} photos
                </span>
                <p className="m-0 w-full text-muted">
                  Plusieurs angles de la même pièce sont bienvenus, les doublons sont fusionnés.{" "}
                  <span className="montant">
                    {nPiece} / {MAX_PHOTOS_PIECE} dans cette pièce.
                  </span>{" "}
                  {etatAnalyse}
                </p>
              </div>

              {alerte ? (
                <div
                  role="alert"
                  className={`mb-3.5 flex items-start justify-between gap-3 rounded-rs px-3.5 py-2.5 ${alerte.ton === "danger" ? "bg-danger-soft" : "bg-warn-soft"}`}
                >
                  <p className="m-0 py-1">{alerte.texte}</p>
                  <button type="button" className="h-12 w-12 shrink-0 rounded-rs text-[18px] text-muted" aria-label="Fermer le message" onClick={() => setAlerte(null)}>
                    ×
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-4 gap-3">
                {photosPiece.map((photo, i) => (
                  <PhotoTile key={photo.id} photo={photo} titre={`${piece.nom} ${i + 1}`} onSupprimer={() => supprimerPhoto(photo.id)} disabled={bloque} />
                ))}
                <label className={`${tuileAjout} ${ajoutImpossible ? tuileDesactivee : ""}`}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={ajoutImpossible}
                    onChange={(e) => void ajouterFichiers(e)}
                    data-testid="entree-camera"
                  />
                  <svg {...iconeProps}>
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  Prendre une photo
                  {raisonLimite ? <span className="text-[12px] font-medium text-muted">{raisonLimite}</span> : null}
                </label>
                <label className={`${tuileAjout} ${ajoutImpossible ? tuileDesactivee : ""}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={ajoutImpossible}
                    onChange={(e) => void ajouterFichiers(e)}
                    data-testid="entree-galerie"
                  />
                  <svg {...iconeProps}>
                    <rect x="4" y="5" width="16" height="14" rx="2" />
                    <path d="M4 15l5-5 4 4 3-3 4 4" />
                    <circle cx="16" cy="9" r="1.5" />
                  </svg>
                  Depuis la galerie
                  {raisonLimite ? <span className="text-[12px] font-medium text-muted">{raisonLimite}</span> : null}
                </label>
              </div>
              {traitement ? (
                <p className="mt-3 flex items-center gap-2 text-muted" role="status">
                  <span className="ps-spinner inline-block h-4 w-4 rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
                  Préparation des photos : {traitement.fait} / {traitement.total}
                </p>
              ) : null}
              {photosPiece.length === 0 && !traitement ? (
                <p className="mt-4 text-muted">Aucune photo dans cette pièce. Prenez une vue d&apos;ensemble depuis l&apos;entrée, puis les coins et les rangements ouverts.</p>
              ) : null}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted">
              <p>Aucune pièce pour ce logement. Ajoutez une pièce pour y déposer des photos.</p>
              <Button variant="brand" onClick={() => setDialogue({ type: "ajout", nom: "" })}>
                Ajouter une pièce
              </Button>
            </div>
          )}
        </section>
      </div>

      <BottomBar
        left={
          total === 0
            ? nettoyageSeul
              ? "Nettoyage seul : les photos sont facultatives."
              : "Ajoutez au moins une photo pour générer le devis."
            : `${pluralPhotos(total)} dans ${piecesAvecPhotos} pièce${piecesAvecPhotos > 1 ? "s" : ""}${aAnalyser.length > 0 && !aJour && draft.inventaire.length > 0 ? `, ${aAnalyser.length} à analyser` : ""}`
        }
      >
        <ButtonLink href="/nouveau/client">Retour</ButtonLink>
        <Button variant="primary" onClick={generer} disabled={!peutAvancer || bloque}>
          {libelleAction}
        </Button>
      </BottomBar>

      {overlay}

      <ConfirmDialog
        open={dialogue?.type === "ajout"}
        title="Ajouter une pièce"
        confirmLabel="Ajouter"
        confirmDisabled={dialogue?.type === "ajout" && !dialogue.nom.trim()}
        onCancel={() => setDialogue(null)}
        onConfirm={() => {
          if (dialogue?.type !== "ajout" || !dialogue.nom.trim()) return;
          addPiece(dialogue.nom);
          setDialogue(null);
          setAlerte(null);
        }}
      >
        {dialogue?.type === "ajout" ? (
          <div className="flex flex-col gap-3">
            <label htmlFor="nom-piece" className="text-[12.5px] font-medium">
              Nom de la pièce
            </label>
            <input
              id="nom-piece"
              className={inputClass}
              value={dialogue.nom}
              maxLength={40}
              onChange={(e) => setDialogue({ type: "ajout", nom: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dialogue.nom.trim()) {
                  addPiece(dialogue.nom);
                  setDialogue(null);
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="h-12 rounded-full border border-line px-4 font-medium text-ink" onClick={() => setDialogue({ type: "ajout", nom: s })}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialogue?.type === "renommer"}
        title="Renommer la pièce"
        confirmLabel="Enregistrer"
        confirmDisabled={dialogue?.type === "renommer" && !dialogue.nom.trim()}
        onCancel={() => setDialogue(null)}
        onConfirm={() => {
          if (dialogue?.type !== "renommer" || !dialogue.nom.trim()) return;
          renamePiece(dialogue.pieceId, dialogue.nom);
          setDialogue(null);
        }}
      >
        {dialogue?.type === "renommer" ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="renommer-piece" className="text-[12.5px] font-medium">
              Nouveau nom
            </label>
            <input
              id="renommer-piece"
              className={inputClass}
              value={dialogue.nom}
              maxLength={40}
              onChange={(e) => setDialogue({ ...dialogue, nom: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dialogue.nom.trim()) {
                  renamePiece(dialogue.pieceId, dialogue.nom);
                  setDialogue(null);
                }
              }}
            />
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialogue?.type === "supprimer"}
        title={`Supprimer la pièce « ${draft.pieces.find((p) => dialogue?.type === "supprimer" && p.id === dialogue.pieceId)?.nom ?? ""} » ?`}
        confirmLabel="Supprimer la pièce"
        confirmVariant="danger"
        onCancel={() => setDialogue(null)}
        onConfirm={() => {
          if (dialogue?.type === "supprimer") confirmerSuppressionPiece(dialogue.pieceId);
        }}
      >
        {dialogue?.type === "supprimer" ? (
          <p>
            Ses {pluralPhotos(compteurs.get(dialogue.pieceId) ?? 0)} et son inventaire (
            {draft.inventaire.filter((it) => it.pieceId === dialogue.pieceId).length} lignes) seront supprimés. Cette action est définitive.
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
