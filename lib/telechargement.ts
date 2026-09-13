"use client";

import { nomFichierPdf } from "./document";
import { calculerDevis } from "./pricing";
import type { Devis, Grille } from "./types";

/** Devis prêt à imprimer : le snapshot figé s'il est envoyé, sinon un calcul à l'instant avec la grille du store. */
export function devisPourImpression(devis: Devis, grille: Grille): Devis {
  if (devis.snapshot) return { ...devis, photos: [] };
  const { lignes, totaux } = calculerDevis(devis, grille);
  return { ...devis, photos: [], snapshot: { grilleVersion: grille.version, lignes, totaux } };
}

export async function telechargerPdf(devis: Devis): Promise<void> {
  let reponse: Response;
  try {
    reponse = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(devis),
    });
  } catch {
    throw new Error("Connexion perdue : le PDF n'a pas pu être téléchargé. Vérifiez le Wi-Fi, puis réessayez.");
  }
  if (!reponse.ok) {
    const data: unknown = await reponse.json().catch(() => null);
    const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : null;
    throw new Error(message ?? "Le PDF n'a pas pu être produit. Réessayez dans un instant.");
  }
  const blob = await reponse.blob();
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichierPdf(devis);
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
