// Calcul du trajet côté serveur (docs/SPEC.md §8) : Nominatim pour géocoder, OSRM pour l'itinéraire.
// Version vendue : même interface getTrajet(adresse), branchée sur Google Routes API.

const USER_AGENT = "pro-space-devis/0.1 (contact@pro-space.ch)";
const TIMEOUT_MS = 6000;

type Point = { lat: number; lon: number };

export type ResultatTrajet = { kmAller: number; minAller: number; libelle: string };

type CodeErreur = "introuvable" | "depart" | "itineraire" | "delai" | "service";

const STATUT: Record<CodeErreur, number> = { introuvable: 404, depart: 502, itineraire: 502, delai: 504, service: 502 };

export class TrajetError extends Error {
  readonly code: CodeErreur;
  readonly statut: number;
  constructor(code: CodeErreur, message: string) {
    super(message);
    this.name = "TrajetError";
    this.code = code;
    this.statut = STATUT[code];
  }
}

let departEnCache: { adresse: string; point: Point } | null = null;

// Nominatim : une requête par seconde au plus, sérialisées.
let dernierAppel = 0;
let file: Promise<unknown> = Promise.resolve();

function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function aTour<T>(tache: () => Promise<T>): Promise<T> {
  const execution = file.then(async () => {
    const reste = 1000 - (Date.now() - dernierAppel);
    if (reste > 0) await attendre(reste);
    dernierAppel = Date.now();
    return tache();
  });
  file = execution.catch(() => undefined);
  return execution;
}

function estDelai(e: unknown): boolean {
  return e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
}

async function geocoder(requete: string, signal: AbortSignal): Promise<Point | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ch&q=${encodeURIComponent(requete)}`;
  const reponse = await aTour(() =>
    fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr" }, signal, cache: "no-store" }),
  );
  if (!reponse.ok) throw new TrajetError("service", "Le service de géocodage ne répond pas correctement.");
  const data: unknown = await reponse.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const premier: unknown = data[0];
  if (typeof premier !== "object" || premier === null || !("lat" in premier) || !("lon" in premier)) return null;
  const lat = Number(premier.lat);
  const lon = Number(premier.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function itineraire(depart: Point, arrivee: Point, signal: AbortSignal): Promise<{ metres: number; secondes: number }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${depart.lon},${depart.lat};${arrivee.lon},${arrivee.lat}?overview=false`;
  const reponse = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal, cache: "no-store" });
  if (!reponse.ok) throw new TrajetError("itineraire", "Aucun itinéraire trouvé vers cette adresse.");
  const data: unknown = await reponse.json();
  if (typeof data !== "object" || data === null || !("routes" in data) || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new TrajetError("itineraire", "Aucun itinéraire trouvé vers cette adresse.");
  }
  const route: unknown = data.routes[0];
  if (typeof route !== "object" || route === null || !("distance" in route) || !("duration" in route)) {
    throw new TrajetError("itineraire", "Aucun itinéraire trouvé vers cette adresse.");
  }
  const metres = Number(route.distance);
  const secondes = Number(route.duration);
  if (!Number.isFinite(metres) || !Number.isFinite(secondes)) {
    throw new TrajetError("itineraire", "Aucun itinéraire trouvé vers cette adresse.");
  }
  return { metres, secondes };
}

/** « Payerne, Suisse » → « Payerne » ; « 1005 Lausanne » → « Lausanne ». */
export function nomDeLieu(adresse: string): string {
  const premier = adresse.split(",")[0] ?? adresse;
  return premier.replace(/^\s*\d{4}\s+/, "").trim();
}

export function adresseDepart(): string {
  return process.env.BASE_ADDRESS?.trim() || "Payerne, Suisse";
}

export async function getTrajet(adresse: string, options: { localite?: string } = {}): Promise<ResultatTrajet> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const base = adresseDepart();
  try {
    let depart = departEnCache?.adresse === base ? departEnCache.point : null;
    if (!depart) {
      depart = await geocoder(base, signal);
      if (!depart) throw new TrajetError("depart", "Adresse de départ introuvable : vérifiez BASE_ADDRESS.");
      departEnCache = { adresse: base, point: depart };
    }
    const arrivee = await geocoder(adresse, signal);
    if (!arrivee) {
      throw new TrajetError("introuvable", "Adresse introuvable. Vérifiez la rue et le NPA, ou saisissez le trajet à la main.");
    }
    const { metres, secondes } = await itineraire(depart, arrivee, signal);
    const destination = options.localite?.trim() || nomDeLieu(adresse.split(",").slice(1).join(",") || adresse);
    return {
      kmAller: Math.round(metres / 1000),
      minAller: Math.round(secondes / 60),
      libelle: `${nomDeLieu(base)} – ${destination}`,
    };
  } catch (e) {
    if (e instanceof TrajetError) throw e;
    if (estDelai(e)) throw new TrajetError("delai", "Le calcul du trajet a pris plus de 6 secondes. Saisissez le trajet à la main.");
    throw new TrajetError("service", "Calcul du trajet indisponible. Saisissez les kilomètres et les minutes à la main.");
  }
}
