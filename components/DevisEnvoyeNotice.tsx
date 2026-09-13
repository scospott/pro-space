"use client";

import { dateCH, heureCH } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Button, ButtonLink } from "./Button";

/** Affiché sur les étapes 1 et 2 quand le devis en cours a déjà été envoyé (il est figé). */
export function DevisEnvoyeNotice() {
  const draft = useStore((s) => s.draft);
  const resetDraft = useStore((s) => s.resetDraft);
  const dupliquerDevis = useStore((s) => s.dupliquerDevis);
  const sentAt = draft.snapshot?.sentAt;

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas p-8">
      <div className="w-full max-w-[560px] rounded-r bg-surface p-7 shadow-sm">
        <h2 className="text-[18px] font-semibold">Devis {draft.numero} envoyé</h2>
        <p className="mt-2 text-muted">
          {sentAt ? `Envoyé le ${dateCH(sentAt)} à ${heureCH(sentAt)} à ${draft.snapshot?.sentTo ?? draft.client.email}. ` : null}
          Un devis envoyé est figé. Pour le corriger, dupliquez-le : un nouveau numéro sera attribué à l&apos;envoi.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/nouveau/devis">Voir le devis</ButtonLink>
          <Button onClick={() => dupliquerDevis(draft.id)}>Dupliquer pour corriger</Button>
          <Button variant="brand" onClick={resetDraft}>
            Nouveau devis
          </Button>
        </div>
      </div>
    </div>
  );
}
