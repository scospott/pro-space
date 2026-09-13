"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "./store";

const abonner = (rappel: () => void) => useStore.persist.onFinishHydration(rappel);
const instantane = () => useStore.persist.hasHydrated();
const instantaneServeur = () => false;

/** Vrai une fois le store relu depuis localStorage (évite les décalages entre rendu serveur et client). */
export function useHydrated(): boolean {
  return useSyncExternalStore(abonner, instantane, instantaneServeur);
}
