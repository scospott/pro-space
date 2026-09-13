"use client";

import { dateCH, heureCH } from "@/lib/format";
import { calculerDevis } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BottomBar } from "../BottomBar";
import { Button, ButtonLink } from "../Button";
import { Chargement } from "../Chargement";
import { DevisDocument } from "../DevisDocument";
import { useActionsDevis } from "../useActionsDevis";

export function EcranDevisLecture({ id }: { id: string }) {
  const hydrated = useHydrated();
  const devis = useStore((s) => s.devis.find((d) => d.id === id));
  const grille = useStore((s) => s.grille);
  const actions = useActionsDevis();

  if (!hydrated) return <Chargement texte="Chargement du devis…" />;
  if (!devis) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
        <p className="max-w-[440px] text-muted">
          Ce devis est introuvable sur cette tablette. Les devis sont enregistrés localement : ouvrez-le depuis l&apos;appareil qui l&apos;a créé.
        </p>
        <ButtonLink href="/devis" variant="brand">
          Retour à Mes devis
        </ButtonLink>
      </div>
    );
  }

  const resultat = devis.snapshot ? { lignes: devis.snapshot.lignes, totaux: devis.snapshot.totaux } : calculerDevis(devis, grille);
  const sentAt = devis.snapshot?.sentAt;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-[22px]">
        <DevisDocument devis={devis} lignes={resultat.lignes} totaux={resultat.totaux} />
      </div>
      <BottomBar
        left={
          sentAt
            ? `${devis.exemple ? "Exemple. " : ""}Envoyé le ${dateCH(sentAt)} à ${heureCH(sentAt)}, grille version ${devis.snapshot?.grilleVersion ?? "?"}`
            : "Brouillon"
        }
      >
        <ButtonLink href="/devis">Retour</ButtonLink>
        <Button onClick={() => actions.dupliquer(devis)}>Dupliquer pour corriger</Button>
        <Button onClick={() => void actions.telecharger(devis)} disabled={actions.enTelechargement}>
          {actions.enTelechargement ? "Préparation du PDF…" : "Télécharger le PDF"}
        </Button>
        <Button variant="primary" onClick={() => actions.renvoyer(devis)}>
          Renvoyer
        </Button>
      </BottomBar>
      {actions.dialogues}
    </>
  );
}
