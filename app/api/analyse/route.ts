import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildTool, lireReponseOutil, OUTIL_INVENTAIRE, type EntreeCatalogue } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTOS = 8;
const MAX_OCTETS = 4 * 1024 * 1024;
const RE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const RE_ID = /^[a-z0-9_]{1,40}$/;

function erreur(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function lireCatalogue(x: unknown): EntreeCatalogue[] | null {
  if (!Array.isArray(x) || x.length === 0 || x.length > 300) return null;
  const catalogue: EntreeCatalogue[] = [];
  for (const c of x) {
    if (typeof c !== "object" || c === null || !("id" in c) || !("label" in c)) return null;
    if (typeof c.id !== "string" || !RE_ID.test(c.id) || typeof c.label !== "string") return null;
    const exemples = "exemples" in c && typeof c.exemples === "string" ? c.exemples.slice(0, 200) : undefined;
    catalogue.push({ id: c.id, label: c.label.slice(0, 120), exemples });
  }
  return catalogue;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return erreur("Clé API manquante côté serveur", 500);

  const annonce = Number(request.headers.get("content-length") ?? "0");
  if (annonce > MAX_OCTETS) return erreur("Photos trop lourdes pour une seule analyse (4 Mo au plus). Retirez une photo de la pièce.", 413);
  const texte = await request.text();
  if (texte.length > MAX_OCTETS) return erreur("Photos trop lourdes pour une seule analyse (4 Mo au plus). Retirez une photo de la pièce.", 413);

  let corps: unknown;
  try {
    corps = JSON.parse(texte);
  } catch {
    return erreur("Requête illisible.", 400);
  }
  if (typeof corps !== "object" || corps === null) return erreur("Requête illisible.", 400);
  const nom = "nom" in corps && typeof corps.nom === "string" ? corps.nom.trim().slice(0, 60) : "";
  const remarques = "remarques" in corps && typeof corps.remarques === "string" ? corps.remarques.slice(0, 1000) : "";
  const photos = "photos" in corps && Array.isArray(corps.photos) ? corps.photos : null;
  const catalogue = "catalogue" in corps ? lireCatalogue(corps.catalogue) : null;

  if (!nom) return erreur("Nom de pièce manquant.", 400);
  if (!photos || photos.length === 0) return erreur("Aucune photo à analyser pour cette pièce.", 400);
  if (photos.length > MAX_PHOTOS) return erreur(`${MAX_PHOTOS} photos au plus par pièce.`, 400);
  if (!catalogue) return erreur("Catalogue de la grille manquant ou invalide.", 400);
  const images: string[] = [];
  for (const p of photos) {
    if (typeof p !== "string") return erreur("Photo invalide.", 400);
    const data = p.replace(/^data:image\/jpeg;base64,/, "");
    if (!RE_BASE64.test(data)) return erreur("Photo invalide : JPEG en base64 attendu.", 400);
    images.push(data);
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 55_000 });

  const content: Anthropic.ContentBlockParam[] = [];
  images.forEach((data, i) => {
    content.push({ type: "text", text: `Photo ${i + 1}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
  });
  content.push({
    type: "text",
    text: `Inventorie les objets à évacuer de la pièce « ${nom} » visibles sur ces ${images.length} photo${images.length > 1 ? "s" : ""}, puis appelle ${OUTIL_INVENTAIRE}.`,
  });

  const debut = Date.now();
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 8000,
      // La sortie forcée par outil n'est pas compatible avec la réflexion étendue.
      thinking: { type: "disabled" },
      system: buildSystemPrompt(catalogue, nom, remarques),
      tools: [buildTool(catalogue)],
      tool_choice: { type: "tool", name: OUTIL_INVENTAIRE },
      messages: [{ role: "user", content }],
    });

    console.info(
      `[analyse] pièce="${nom}" photos=${images.length} modèle=${message.model} entrée=${message.usage.input_tokens} sortie=${message.usage.output_tokens} durée=${Date.now() - debut}ms arrêt=${message.stop_reason}`,
    );

    if (message.stop_reason === "refusal") {
      return erreur("Le service d'analyse a refusé ces photos. Vérifiez qu'elles montrent bien la pièce, puis relancez.", 422);
    }
    if (message.stop_reason === "max_tokens") {
      return erreur("Inventaire trop long pour une seule analyse. Répartissez les photos de cette pièce en deux pièces.", 502);
    }
    const bloc = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === OUTIL_INVENTAIRE);
    if (!bloc) return erreur("Réponse de l'analyse sans inventaire. Relancez l'analyse de cette pièce.", 502);

    const { items, remarques: remarquesIa } = lireReponseOutil(bloc.input);
    return Response.json({
      items,
      remarques: remarquesIa,
      usage: { entree: message.usage.input_tokens, sortie: message.usage.output_tokens },
    });
  } catch (e) {
    console.error(`[analyse] échec pièce="${nom}" après ${Date.now() - debut}ms :`, e instanceof Error ? e.message : e);
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      return erreur("Clé API refusée par le service d'analyse. Vérifiez ANTHROPIC_API_KEY sur le serveur.", 500);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return erreur("Service d'analyse saturé. Patientez une minute, puis relancez cette pièce.", 429);
    }
    if (e instanceof Anthropic.NotFoundError) {
      return erreur("Modèle d'analyse introuvable. Vérifiez ANTHROPIC_MODEL sur le serveur.", 500);
    }
    if (e instanceof Anthropic.BadRequestError) {
      return erreur("Requête refusée par le service d'analyse (photo illisible ou paramètre invalide). Reprenez la photo, puis relancez.", 400);
    }
    if (e instanceof Anthropic.APIConnectionTimeoutError) {
      return erreur("L'analyse a dépassé le délai. Relancez cette pièce, ou retirez une photo.", 504);
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return erreur("Service d'analyse injoignable depuis le serveur. Relancez dans un instant.", 502);
    }
    if (e instanceof Anthropic.APIError) {
      return erreur(`Service d'analyse indisponible (code ${e.status ?? "inconnu"}). Relancez dans un instant.`, 502);
    }
    return erreur("Erreur inattendue pendant l'analyse. Relancez cette pièce.", 500);
  }
}
