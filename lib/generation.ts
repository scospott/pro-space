"use client";

// Analyse d'une pièce côté client : lecture des blobs, appel de /api/analyse, post-traitement avec la grille du store.
import { getPhoto } from "./photos";
import { useStore } from "./store";
import type { InventaireItem } from "./types";
import { lireRemarques, postTraiter } from "./vision";

const MAX_OCTETS_REQUETE = 4 * 1024 * 1024;
const DELAI_MS = 75_000;

export class AnalyseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyseError";
  }
}

export async function blobEnBase64(blob: Blob): Promise<string> {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let binaire = "";
  const tranche = 0x8000;
  for (let i = 0; i < octets.length; i += tranche) {
    binaire += String.fromCharCode(...octets.subarray(i, i + tranche));
  }
  return btoa(binaire);
}

function messageErreur(x: unknown): string | undefined {
  return typeof x === "object" && x !== null && "error" in x && typeof x.error === "string" ? x.error : undefined;
}

export async function analyserPiece(pieceId: string): Promise<{ items: InventaireItem[]; remarques: string }> {
  const { draft, grille } = useStore.getState();
  const piece = draft.pieces.find((p) => p.id === pieceId);
  if (!piece) throw new AnalyseError("Pièce introuvable dans le brouillon.");
  const photos = draft.photos.filter((p) => p.pieceId === pieceId);
  if (photos.length === 0) throw new AnalyseError(`Aucune photo dans « ${piece.nom} ».`);

  const donnees = await Promise.all(
    photos.map(async (p) => {
      const blob = await getPhoto(p.blobKey);
      if (!blob) throw new AnalyseError(`Une photo de « ${piece.nom} » est introuvable sur la tablette. Supprimez-la et reprenez-la.`);
      return blobEnBase64(blob);
    }),
  );

  const corps = JSON.stringify({
    pieceId,
    nom: piece.nom,
    remarques: draft.prestation.remarques ?? "",
    photos: donnees,
    catalogue: grille.catalogue.map((c) => ({ id: c.id, label: c.label, exemples: c.exemples })),
  });
  if (corps.length > MAX_OCTETS_REQUETE) {
    throw new AnalyseError(`Photos de « ${piece.nom} » trop lourdes pour une seule analyse. Retirez une photo de la pièce.`);
  }

  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
  let reponse: Response;
  try {
    reponse = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corps,
      signal: controle.signal,
    });
  } catch {
    throw new AnalyseError(
      controle.signal.aborted
        ? "L'analyse ne répond pas. Vérifiez la connexion, puis relancez cette pièce."
        : "Connexion perdue pendant l'analyse. Vérifiez le Wi-Fi, puis relancez cette pièce.",
    );
  } finally {
    clearTimeout(minuteur);
  }

  const data: unknown = await reponse.json().catch(() => null);
  if (!reponse.ok) throw new AnalyseError(messageErreur(data) ?? `Analyse impossible (code ${reponse.status}). Relancez cette pièce.`);

  const courant = useStore.getState();
  return {
    items: postTraiter(data, pieceId, courant.draft.prestation.destination, courant.grille),
    remarques: lireRemarques(data),
  };
}
