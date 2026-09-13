"use client";

import { useMemo, useState } from "react";
import { piecesAAnalyser, piecesAOublier } from "@/lib/analyse";
import { chf, dateCH, heureCH } from "@/lib/format";
import { nouvelId } from "@/lib/id";
import { deletePhotos } from "@/lib/photos";
import { calculerDevis } from "@/lib/pricing";
import { flushSaisies } from "@/lib/saisie";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { etape1Valide } from "@/lib/validation";
import { BottomBar } from "../BottomBar";
import { Button, ButtonLink } from "../Button";
import { Chargement } from "../Chargement";
import { ConfirmDialog } from "../ConfirmDialog";
import { DevisDocument } from "../DevisDocument";
import { EnvoiDialog } from "../EnvoiDialog";
import { GenerationOverlay } from "../GenerationOverlay";
import { InventoryPanel } from "../InventoryPanel";
import { useToast } from "../Toast";
import { useActionsDevis } from "../useActionsDevis";

type Relance = { id: string; pieces: string[]; oublier: string[]; nom: string };

export function EcranDevis() {
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const grille = useStore((s) => s.grille);
  const saveDevisSnapshot = useStore((s) => s.saveDevisSnapshot);
  const toast = useToast((s) => s.show);
  const actions = useActionsDevis();
  const [relance, setRelance] = useState<Relance | null>(null);
  const [aConfirmer, setAConfirmer] = useState<Relance | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const snapshot = draft.statut === "envoye" ? draft.snapshot : undefined;
  const resultat = useMemo(() => (snapshot ? { lignes: snapshot.lignes, totaux: snapshot.totaux } : calculerDevis(draft, grille)), [draft, grille, snapshot]);

  if (!hydrated) return <Chargement />;

  if (!snapshot && !etape1Valide(draft)) {
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

  const aTraiter = snapshot ? [] : [...piecesAAnalyser(draft), ...piecesAOublier(draft)];

  const relancerPiece = (pieceId: string) => {
    const d = useStore.getState().draft;
    const piece = d.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const sansPhoto = piecesAOublier(d).some((p) => p.id === pieceId);
    const plan: Relance = { id: nouvelId("relance"), pieces: sansPhoto ? [] : [pieceId], oublier: sansPhoto ? [pieceId] : [], nom: piece.nom };
    if (piece.corrige) setAConfirmer(plan);
    else setRelance(plan);
  };

  const envoyer = (email: string) => {
    flushSaisies();
    const { devis, blobKeys } = saveDevisSnapshot(email);
    setEnvoi(false);
    void deletePhotos(blobKeys).catch(() => undefined);
    toast(`Devis ${devis.numero} envoyé à ${email}`);
    void actions.telecharger(devis);
  };

  const sentAt = snapshot?.sentAt;

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

        {snapshot ? (
          <aside className="flex w-[360px] shrink-0 flex-col gap-4 border-l border-line bg-surface px-5 py-[18px]" aria-label="Devis envoyé">
            <div>
              <h2 className="m-0 text-[15px] font-semibold">Devis {draft.numero} envoyé</h2>
              <p className="mt-1 text-[12.5px] text-muted">
                {sentAt ? `Le ${dateCH(sentAt)} à ${heureCH(sentAt)}, à ${snapshot.sentTo ?? draft.client.email}.` : null} Le document est figé : grille version{" "}
                {snapshot.grilleVersion}, {resultat.lignes.length} lignes.
              </p>
            </div>
            <div className="rounded-rs bg-surface-2 px-4 py-3">
              <p className="m-0 flex justify-between">
                <span>Total TTC</span>
                <span className="montant font-semibold">{chf(resultat.totaux.totalTTC)}</span>
              </p>
            </div>
            <p className="m-0 text-[12.5px] text-muted">Pour changer une quantité ou un prix, dupliquez le devis : la copie reprend tout, avec la grille actuelle.</p>
            <div className="mt-auto flex flex-col gap-2">
              <ButtonLink href="/nouveau/client?nouveau=1" variant="brand">
                Nouveau devis
              </ButtonLink>
              <ButtonLink href="/devis">Voir dans Mes devis</ButtonLink>
            </div>
          </aside>
        ) : (
          <InventoryPanel draft={draft} grille={grille} />
        )}
      </div>

      {snapshot ? (
        <BottomBar left="Envoyé. Pour corriger, dupliquez le devis.">
          <Button onClick={() => actions.dupliquer(draft)}>Dupliquer pour corriger</Button>
          <Button onClick={() => void actions.telecharger(draft)} disabled={actions.enTelechargement}>
            {actions.enTelechargement ? "Préparation du PDF…" : "Télécharger le PDF"}
          </Button>
          <Button variant="primary" onClick={() => actions.renvoyer(draft)}>
            Renvoyer le devis
          </Button>
        </BottomBar>
      ) : (
        <BottomBar left="Rien n'est envoyé tant que vous n'avez pas validé.">
          <ButtonLink href="/nouveau/client">Modifier</ButtonLink>
          <Button onClick={() => void actions.telecharger(draft)} disabled={actions.enTelechargement}>
            {actions.enTelechargement ? "Préparation du PDF…" : "Télécharger le PDF"}
          </Button>
          <Button variant="primary" onClick={() => setEnvoi(true)} className="max-w-[340px]">
            <span className="truncate">Envoyer à {draft.client.email}</span>
          </Button>
        </BottomBar>
      )}

      {envoi ? (
        <EnvoiDialog
          titre="Envoyer le devis"
          emailInitial={draft.client.email}
          confirmLabel="Envoyer et télécharger le PDF"
          avertissement={
            resultat.totaux.nettoyageAPreciser
              ? "Le nettoyage est encore « à préciser » (surface manquante) : il figurera à CHF 0.00."
              : aTraiter.length > 0
                ? "Des pièces n'ont pas été analysées avec leurs dernières photos : vérifiez le bandeau au-dessus du document."
                : undefined
          }
          onCancel={() => setEnvoi(false)}
          onConfirm={envoyer}
        />
      ) : null}
      {actions.dialogues}
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
