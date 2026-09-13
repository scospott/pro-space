// Convertit le logo du site (webp) en PNG 1024 px de large, fond transparent,
// pour l'interface et le PDF. Usage : node scripts/logo-to-png.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(racine, "public", "logo-site.webp");
const cible = path.join(racine, "public", "logo.png");

const info = await sharp(source)
  .ensureAlpha()
  .resize({ width: 1024, kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toFile(cible);

console.log(`public/logo.png écrit : ${info.width} × ${info.height} px`);

// Marque seule (la maison, colonnes 0 à 104 du webp) pour le rail, utilisée en masque CSS.
const meta = await sharp(source).metadata();
const maison = await sharp(source)
  .ensureAlpha()
  .extract({ left: 0, top: 0, width: 105, height: meta.height ?? 123 })
  .png()
  .toBuffer();
const marque = await sharp(maison)
  .trim()
  .resize({ width: 256, height: 256, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(racine, "public", "logo-mark.png"));

console.log(`public/logo-mark.png écrit : ${marque.width} × ${marque.height} px`);
