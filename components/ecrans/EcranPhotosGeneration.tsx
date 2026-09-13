"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { piecesAAnalyser, piecesAOublier } from "@/lib/analyse";
import { useStore } from "@/lib/store";
import { ConfirmDialog } from "../ConfirmDialog";
import { GenerationOverlay } from "../GenerationOverlay";
import { EcranPhotos } from "./EcranPhotos";

type Lancement = { id: number; pieces: string[]; oublier: string[] };

/** Plan de génération : pièces à analyser, pièces à oublier, et pièces corrigées à la main qui seront écrasées. */
export function planGeneration(pieceIds?: string[]): Lancement & { corrigees: string[] } {
  const d = useStore.getState().draft;
  const pieces = (pieceIds ? d.pieces.filter((p) => pieceIds.includes(p.id)) : piecesAAnalyser(d)).map((p) => p.id);
  const oublier = pieceIds ? [] : piecesAOublier(d).map((p) => p.id);
  const corrigees = d.pieces.filter((p) => (pieces.includes(p.id) || oublier.includes(p.id)) && p.corrige).map((p) => p.nom);
  return { id: Date.now(), pieces, oublier, corrigees };
}

export function EcranPhotosGeneration() {
  const router = useRouter();
  const [lancement, setLancement] = useState<Lancement | null>(null);
  const [aConfirmer, setAConfirmer] = useState<(Lancement & { corrigees: string[] }) | null>(null);

  const generer = () => {
    const plan = planGeneration();
    if (plan.pieces.length === 0 && plan.oublier.length === 0) {
      router.push("/nouveau/devis");
      return;
    }
    if (plan.corrigees.length > 0) {
      setAConfirmer(plan);
      return;
    }
    setLancement(plan);
  };

  return (
    <EcranPhotos
      onGenerer={generer}
      overlay={
        <>
          {lancement ? (
            <GenerationOverlay
              key={lancement.id}
              pieceIds={lancement.pieces}
              oublier={lancement.oublier}
              onTermine={() => {
                setLancement(null);
                router.push("/nouveau/devis");
              }}
              onFermer={() => setLancement(null)}
            />
          ) : null}
          <ConfirmDialog
            open={aConfirmer !== null}
            title="Écraser les corrections manuelles ?"
            confirmLabel="Relancer l'analyse"
            confirmVariant="primary"
            onCancel={() => setAConfirmer(null)}
            onConfirm={() => {
              if (aConfirmer) setLancement(aConfirmer);
              setAConfirmer(null);
            }}
          >
            <p>
              Les photos ont changé dans : {aConfirmer?.corrigees.join(", ")}. Leur inventaire va être analysé à nouveau et les corrections faites à la main dans
              {aConfirmer && aConfirmer.corrigees.length > 1 ? " ces pièces" : " cette pièce"} seront perdues.
            </p>
            <p className="mt-2">Les autres pièces et leurs corrections ne changent pas.</p>
          </ConfirmDialog>
        </>
      }
    />
  );
}
