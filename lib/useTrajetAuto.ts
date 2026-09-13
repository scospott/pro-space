"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "./store";

export type EtatTrajet = { etat: "repos" | "calcul" | "ok" | "echec"; message?: string };

export const LIEU_DEPART = "Payerne";

type ReponseTrajet = { kmAller: number; minAller: number; libelle: string };

function estReponseTrajet(x: unknown): x is ReponseTrajet {
  return (
    typeof x === "object" &&
    x !== null &&
    "kmAller" in x &&
    typeof x.kmAller === "number" &&
    "minAller" in x &&
    typeof x.minAller === "number" &&
    "libelle" in x &&
    typeof x.libelle === "string"
  );
}

function messageErreur(x: unknown): string | undefined {
  return typeof x === "object" && x !== null && "error" in x && typeof x.error === "string" ? x.error : undefined;
}

/** Calcule le trajet dès que rue, NPA et localité sont remplis (800 ms après la dernière modification). */
export function useTrajetAuto(actif: boolean): EtatTrajet & { relancer: () => void } {
  const rue = useStore((s) => s.draft.lieu.rue.trim());
  const npa = useStore((s) => s.draft.lieu.npa.trim());
  const localite = useStore((s) => s.draft.lieu.localite.trim());
  const adresseCalculee = useStore((s) => s.draft.trajet.adresse);
  const statut = useStore((s) => s.draft.statut);
  const setTrajet = useStore((s) => s.setTrajet);
  const [etat, setEtat] = useState<EtatTrajet>({ etat: "repos" });

  const complet = Boolean(rue && /^\d{4}$/.test(npa) && localite);
  const adresse = complet ? `${rue}, ${npa} ${localite}` : "";

  useEffect(() => {
    if (!actif || !complet || statut !== "brouillon" || adresseCalculee === adresse) return;
    const controle = new AbortController();
    const minuteur = setTimeout(() => {
      setEtat({ etat: "calcul" });
      void (async () => {
        try {
          const reponse = await fetch("/api/trajet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adresse, localite }),
            signal: controle.signal,
          });
          const data: unknown = await reponse.json().catch(() => null);
          if (!reponse.ok || !estReponseTrajet(data)) {
            throw new Error(messageErreur(data) ?? "Trajet non calculable pour cette adresse.");
          }
          setTrajet({ kmAller: data.kmAller, minAller: data.minAller, libelle: data.libelle, source: "calcule", adresse });
          setEtat({ etat: "ok" });
        } catch (e) {
          if (controle.signal.aborted) return;
          const courant = useStore.getState().draft.trajet;
          setTrajet({ ...courant, source: "manuel", libelle: `${LIEU_DEPART} – ${localite}`, adresse });
          const message = e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Calcul du trajet indisponible, vérifiez la connexion.";
          setEtat({ etat: "echec", message });
        }
      })();
    }, 800);
    return () => {
      clearTimeout(minuteur);
      controle.abort();
    };
  }, [actif, complet, adresse, adresseCalculee, statut, localite, setTrajet]);

  const relancer = useCallback(() => {
    const courant = useStore.getState().draft.trajet;
    setTrajet({ ...courant, adresse: undefined });
  }, [setTrajet]);

  return { ...etat, relancer };
}
