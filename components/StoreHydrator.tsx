"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Relit le store persistant une seule fois, après le premier rendu client. */
export function StoreHydrator() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);
  return null;
}
