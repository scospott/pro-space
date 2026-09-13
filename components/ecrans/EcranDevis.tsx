"use client";

import { useMemo, useState, type ReactNode } from "react";
import { piecesAAnalyser, piecesAOublier } from "@/lib/analyse";
import { nouvelId } from "@/lib/id";
import { calculerDevis } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { etape1Valide } from "@/lib/validation";
import { BottomBar } from "../BottomBar";
import { Button, ButtonLink } from "../Button";
import { Chargement } from "../Chargement";
import { ConfirmDialog } from "../ConfirmDialog";
import { DevisDocument } from "../DevisDocument";
import { GenerationOverlay } from "../GenerationOverlay";
import { InventoryPanel } from "../InventoryPanel";

type Relance = { id: string; pieces: string[]; oublier: string[]; nom: string };

export type ActionsDevis = {
  /** Barre basse et panneau droit quand le devis est envoyé (branchés en phase 6). */
  barre?: ReactNode;
  panneauEnvoye?: ReactNode;
};

export function EcranDevis({ barre, panneauEnvoye }: ActionsDevis) {
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const grille = useStore((s) => s.grille);
  const [relance, setRelance] = useState<Relance | null>(null);
  const [aConfirmer, setAConfirmer] = useState<Relance | null>(null);

  const envoye = draft.statut === "envoye" && draft.snapshot !== undefined;
  const resultat = useMemo(
    () => (draft.statut === "envoye" && draft.snapshot ? { lignes: draft.snapshot.lignes, totaux: draft.snapshot.totaux } : calculerDevis(draft, grille)),
    [draft, grille],
  );

  if (!hydrated) return <Chargement />;

  if (!envoye && !etape1Valide(draft)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
        <p className="max-w-[460px] text-muted">
          Le client et le lieu ne sont pas complets : le devis ne peut pas encore être établi. Complétez l&apos;étape 1, puis ajoutez les photos.
        </p>
        <ButtonLink href="/nouveau/client" variant="brand">
          Compléter le client et le lieu
        </ButtonLink>
      </div>
    );
  }

  const aTraiter = envoye ? [] : [...piecesAAnalyser(draft), ...piecesAOublier(draft)];

  const relancerPiece = (pieceId: string) => {
    const d = useStore.getState().draft;
    const piece = d.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const sansPhoto = piecesAOublier(d).some((p) => p.id === pieceId);
    const plan: Relance = { id: nouvelId("relance"), pieces: sansPhoto ? [] : [pieceId], oublier: sansPhoto ? [pieceId] : [], nom: piece.nom };
    if (piece.corrige) setAConfirmer(plan);
    else setRelance(plan);
  };

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto bg-canvas p-[22px]">
          {aTraiter.length > 0 ? (
            <div className="mx-auto mb-4 flex max-w-[640px] flex-col gap-2">
              {aTraiter.map((piece) => {
                const sansPhoto = !draft.photos.some((p) => p.pieceId === piece.id);
                let texte = `Les photos de « ${piece.nom} » ont changé depuis l'analyse.`;
                let action = "Relancer l'analyse de cette pièce";
                if (sansPhoto) {
                  texte = `Toutes les photos de « ${piece.nom} » ont été retirées.`;
                  action = "Retirer les objets détectés";
                } else if (piece.analyse?.status === "erreur") {
                  texte = `L'analyse de « ${piece.nom} » a échoué.`;
                  action = "Relancer l'analyse";
                } else if (!piece.analyse) {
                  texte = `Nouvelles photos dans « ${piece.nom} », pas encore analysées.`;
                  action = "Analyser cette pièce";
                }
                return (
                  <div key={piece.id} role="status" className="flex items-center justify-between gap-3 rounded-rs bg-warn-soft py-1.5 pr-1.5 pl-3.5" data-testid="bandeau-piece">
                    <p className="m-0">{texte} Les autres pièces ne bougent pas.</p>
                    <Button className="shrink-0" onClick={() => relancerPiece(piece.id)}>
                      {action}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}
          <DevisDocument devis={draft} lignes={resultat.lignes} totaux={resultat.totaux} />
        </div>
        {envoye ? panneauEnvoye : <InventoryPanel draft={draft} grille={grille} />}
      </div>

      {barre ?? (
        <BottomBar left="Rien n'est envoyé tant que vous n'avez pas validé.">
          <ButtonLink href="/nouveau/client">Modifier</ButtonLink>
          <Button disabled>Télécharger le PDF</Button>
          <Button variant="primary" disabled>
            Envoyer à {draft.client.email}
          </Button>
        </BottomBar>
      )}

      {relance ? (
        <GenerationOverlay key={relance.id} pieceIds={relance.pieces} oublier={relance.oublier} onTermine={() => setRelance(null)} onFermer={() => setRelance(null)} />
      ) : null}
      <ConfirmDialog
        open={aConfirmer !== null}
        title="Écraser les corrections manuelles ?"
        confirmLabel="Relancer l'analyse"
        confirmVariant="primary"
        onCancel={() => setAConfirmer(null)}
        onConfirm={() => {
          if (aConfirmer) setRelance(aConfirmer);
          setAConfirmer(null);
        }}
      >
        <p>Les corrections faites à la main dans « {aConfirmer?.nom} » seront perdues. Les autres pièces et leurs corrections ne changent pas.</p>
      </ConfirmDialog>
    </>
  );
}
