import { getTrajet, TrajetError } from "@/lib/trajet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }
  if (typeof corps !== "object" || corps === null || !("adresse" in corps) || typeof corps.adresse !== "string") {
    return Response.json({ error: "Adresse manquante." }, { status: 400 });
  }
  const adresse = corps.adresse.trim().slice(0, 200);
  if (adresse.length < 5) {
    return Response.json({ error: "Adresse trop courte." }, { status: 400 });
  }
  const localite = "localite" in corps && typeof corps.localite === "string" ? corps.localite.trim().slice(0, 80) : undefined;

  try {
    const trajet = await getTrajet(adresse, { localite });
    return Response.json(trajet);
  } catch (e) {
    if (e instanceof TrajetError) {
      return Response.json({ error: e.message }, { status: e.statut });
    }
    return Response.json({ error: "Calcul du trajet indisponible. Saisissez le trajet à la main." }, { status: 502 });
  }
}
