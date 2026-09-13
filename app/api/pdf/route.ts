import { nomFichierPdf } from "@/lib/document";
import { renderDevisPdf } from "@/lib/pdf/DevisPdf";
import { lireDevisImprimable } from "@/lib/pdf/lecture";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_OCTETS = 1024 * 1024;

export async function POST(request: Request) {
  const texte = await request.text();
  if (texte.length > MAX_OCTETS) return Response.json({ error: "Devis trop volumineux pour être imprimé." }, { status: 413 });
  let corps: unknown;
  try {
    corps = JSON.parse(texte);
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }
  const devis = lireDevisImprimable(corps);
  if (!devis) return Response.json({ error: "Devis incomplet : impossible de produire le PDF." }, { status: 400 });

  try {
    const pdf = await renderDevisPdf(devis);
    const nom = nomFichierPdf(devis);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nom}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[pdf] échec du rendu :", e instanceof Error ? e.message : e);
    return Response.json({ error: "Le PDF n'a pas pu être produit. Réessayez dans un instant." }, { status: 500 });
  }
}
