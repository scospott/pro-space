// Mode démo scripté (NEXT_PUBLIC_DEMO_FIXTURE=true) : inventaire et trajet rejoués depuis lib/demo/fixture-fribourg.ts.
// Désactivé par défaut : sans la variable, l'analyse et le trajet sont réels.

export const MODE_FIXTURE = process.env.NEXT_PUBLIC_DEMO_FIXTURE === "true";

/** Pièces par défaut d'une maison en mode démo scripté, dans cet ordre. */
export const PIECES_MAISON_DEMO = ["Salon", "Cuisine", "Chambre 1", "Chambre 2", "Bureau", "Cave", "Garage"];
