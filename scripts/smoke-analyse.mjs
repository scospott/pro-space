// Test réel de /api/analyse : une photo de fixture, redimensionnée comme sur la tablette (1280 px, JPEG 0,82).
// Usage : node scripts/smoke-analyse.mjs http://localhost:3100 [tests/fixtures/salon.jpg]
import sharp from "sharp";
import { defaultGrille } from "../lib/grille.default.ts";

const [base = "http://localhost:3100", fichier = "tests/fixtures/salon.jpg"] = process.argv.slice(2);
const jpeg = await sharp(fichier).rotate().resize({ width: 1280, height: 1280, fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
const catalogue = defaultGrille().catalogue.map((c) => ({ id: c.id, label: c.label, exemples: c.exemples }));

const debut = Date.now();
const reponse = await fetch(`${base}/api/analyse`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pieceId: "smoke", nom: "Salon", remarques: "Conserver le piano", photos: [jpeg.toString("base64")], catalogue }),
});
const data = await reponse.json();
const duree = ((Date.now() - debut) / 1000).toFixed(1);
console.log(`statut ${reponse.status} en ${duree} s`);
if (!reponse.ok) {
  console.log("erreur :", data.error);
  process.exit(1);
}
if (!Array.isArray(data.items)) {
  console.log("forme inattendue :", Object.keys(data));
  process.exit(1);
}
console.log(`${data.items.length} objet(s) :`, data.items.map((i) => `${i.quantity} × ${i.categoryId} (${i.label}, ${i.etat}, ${i.confidence})`).join(" | "));
console.log("remarques :", data.remarques);
console.log(`tokens : entrée ${data.usage?.entree}, sortie ${data.usage?.sortie}`);
