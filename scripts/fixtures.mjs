// Génère trois JPEG de test dans tests/fixtures/ (sharp). La troisième porte une orientation EXIF 6
// (photo prise en portrait) pour vérifier la rotation au redimensionnement.
// Usage : node scripts/fixtures.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dossier = path.join(racine, "tests", "fixtures");
mkdirSync(dossier, { recursive: true });

function scene({ fond, sol, meubles, titre }) {
  const formes = meubles
    .map(({ x, y, w, h, c, rx = 8 }) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`)
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <rect width="1600" height="1200" fill="${fond}"/>
    <rect y="820" width="1600" height="380" fill="${sol}"/>
    ${formes}
    <text x="60" y="110" font-family="sans-serif" font-size="72" fill="#ffffff" opacity="0.85">${titre}</text>
  </svg>`);
}

const images = [
  {
    nom: "salon.jpg",
    svg: scene({
      fond: "#9a8675",
      sol: "#5f5044",
      titre: "Salon",
      meubles: [
        { x: 180, y: 600, w: 760, h: 260, c: "#3f5a7a", rx: 40 },
        { x: 220, y: 520, w: 680, h: 140, c: "#4c6b8f", rx: 30 },
        { x: 1080, y: 380, w: 360, h: 480, c: "#6b4a2f" },
        { x: 520, y: 900, w: 360, h: 90, c: "#8a6a44" },
      ],
    }),
    orientation: 1,
  },
  {
    nom: "cuisine.jpg",
    svg: scene({
      fond: "#c9c3b6",
      sol: "#8d8577",
      titre: "Cuisine",
      meubles: [
        { x: 1100, y: 260, w: 320, h: 620, c: "#e8e8e8" },
        { x: 300, y: 640, w: 520, h: 40, c: "#7a5a3a" },
        { x: 340, y: 680, w: 30, h: 200, c: "#7a5a3a" },
        { x: 750, y: 680, w: 30, h: 200, c: "#7a5a3a" },
        { x: 200, y: 900, w: 160, h: 140, c: "#b58b55" },
      ],
    }),
    orientation: 1,
  },
  {
    nom: "cave-portrait.jpg",
    svg: scene({
      fond: "#6d6a66",
      sol: "#3c3a37",
      titre: "Cave",
      meubles: [
        { x: 120, y: 200, w: 420, h: 680, c: "#9aa3a8", rx: 2 },
        { x: 700, y: 560, w: 520, h: 300, c: "#2b2b2b", rx: 150 },
        { x: 1260, y: 700, w: 240, h: 240, c: "#b58b55" },
      ],
    }),
    orientation: 6,
  },
];

for (const { nom, svg, orientation } of images) {
  const cible = path.join(dossier, nom);
  await sharp(svg).jpeg({ quality: 85 }).withMetadata({ orientation }).toFile(cible);
  const meta = await sharp(cible).metadata();
  console.log(`tests/fixtures/${nom} : ${meta.width} × ${meta.height}, orientation ${meta.orientation ?? 1}, ${meta.size ?? "?"} octets`);
}
