"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nomClient } from "@/lib/document";
import { deletePhotos } from "@/lib/photos";
import { brouillonNonVide, useStore } from "@/lib/store";
import { devisPourImpression, telechargerPdf } from "@/lib/telechargement";
import type { Devis } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { EnvoiDialog } from "./EnvoiDialog";
import { useToast } from "./Toast";

/** Actions communes sur un devis : télécharger, renvoyer, dupliquer pour corriger. */
export function useActionsDevis() {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const dupliquerDevis = useStore((s) => s.dupliquerDevis);
  const [renvoi, setRenvoi] = useState<Devis | null>(null);
  const [duplication, setDuplication] = useState<Devis | null>(null);
  const [enTelechargement, setEnTelechargement] = useState(false);

  const telecharger = async (devis: Devis) => {
    setEnTelechargement(true);
    try {
      await telechargerPdf(devisPourImpression(devis, useStore.getState().grille));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Le PDF n'a pas pu être téléchargé. Réessayez.");
    } finally {
      setEnTelechargement(false);
    }
  };

  const faireDuplication = (devis: Devis) => {
    const draft = useStore.getState().draft;
    if (draft.statut === "brouillon" && draft.id !== devis.id) void deletePhotos(draft.photos.map((p) => p.blobKey)).catch(() => undefined);
    dupliquerDevis(devis.id);
    setDuplication(null);
    toast(`Copie du devis ${devis.numero} créée : corrigez-la, un nouveau numéro sera attribué à l'envoi`);
    router.push("/nouveau/devis");
  };

  const dupliquer = (devis: Devis) => {
    const draft = useStore.getState().draft;
    if (brouillonNonVide(draft) && draft.id !== devis.id) setDuplication(devis);
    else faireDuplication(devis);
  };

  const brouillon = useStore((s) => s.draft);

  const dialogues = (
    <>
      {renvoi ? (
        <EnvoiDialog
          key={renvoi.id}
          titre={`Renvoyer le devis ${renvoi.numero}`}
          emailInitial={renvoi.snapshot?.sentTo ?? renvoi.client.email}
          confirmLabel="Renvoyer et télécharger le PDF"
          onCancel={() => setRenvoi(null)}
          onConfirm={(email) => {
            const devis = renvoi;
            setRenvoi(null);
            toast(`Devis ${devis.numero} renvoyé à ${email}`);
            void telecharger(devis);
          }}
        />
      ) : null}
      <ConfirmDialog
        open={duplication !== null}
        title="Remplacer le brouillon en cours ?"
        confirmLabel="Dupliquer pour corriger"
        onCancel={() => setDuplication(null)}
        onConfirm={() => {
          if (duplication) faireDuplication(duplication);
        }}
      >
        <p>
          Le brouillon pour {nomClient(brouillon) || "un client sans nom"} sera remplacé par une copie du devis {duplication?.numero}. Ses photos seront supprimées de la
          tablette.
        </p>
      </ConfirmDialog>
    </>
  );

  return { telecharger, renvoyer: setRenvoi, dupliquer, enTelechargement, dialogues };
}
