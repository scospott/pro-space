"use client";

import { useEffect } from "react";
import { devisExemples } from "@/lib/exemples";
import { useStore } from "@/lib/store";

/** Mode démo actif sauf si NEXT_PUBLIC_DEMO vaut explicitement « false ». */
export const MODE_DEMO = process.env.NEXT_PUBLIC_DEMO !== "false";

/** Relit le store persistant une seule fois, après le premier rendu client, puis charge les exemples de démo. */
export function StoreHydrator() {
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => {
      if (!MODE_DEMO) return;
      const etat = useStore.getState();
      if (etat.devis.length === 0 && !etat.ui.exemplesCharges) etat.chargerExemples(devisExemples(etat.grille));
    });
  }, []);
  return null;
}
