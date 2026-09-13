// Icônes de l'application installée (manifest et écran d'accueil iPad) depuis public/logo.png :
// fond blanc, logo centré avec marges. Usage : node scripts/icones.mjs
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = path.join(racine, "public", "logo.png");

const icones = [
  { nom: "icon-192.png", taille: 192 },
  { nom: "icon-512.png", taille: 512 },
  { nom: "apple-touch-icon.png", taille: 180 },
];

// Le logo occupe 72 % de la largeur : il reste dans la zone sûre d'une icône arrondie ou masquée.
const PART_LARGEUR = 0.72;

for (const { nom, taille } of icones) {
  const largeur = Math.round(taille * PART_LARGEUR);
  const logoRedimensionne = await sharp(logo).resize({ width: largeur, kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  await sharp({ create: { width: taille, height: taille, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: logoRedimensionne, gravity: "center" }])
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(racine, "public", nom));
  console.log(`public/${nom} écrit : ${taille} × ${taille} px`);
}
