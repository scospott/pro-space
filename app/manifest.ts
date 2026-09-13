import type { MetadataRoute } from "next";
import { COULEUR_BRAND, NOM_APPLICATION } from "@/lib/marque";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOM_APPLICATION,
    short_name: "Pro Space",
    description: "Devis de débarras et de nettoyage à partir de photos, calculés par la grille Pro Space.",
    lang: "fr-CH",
    start_url: "/nouveau/client",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    theme_color: COULEUR_BRAND,
    background_color: COULEUR_BRAND,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
