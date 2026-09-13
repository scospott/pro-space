// Captures d'écran de contrôle en 1024 × 768 (outil de développement, hors build).
// Usage : node scripts/capture.mjs http://localhost:3100 /nouveau/client /grille
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [base = "http://localhost:3100", ...chemins] = process.argv.slice(2);
mkdirSync("test-results/captures", { recursive: true });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1024, height: 768 } });
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") console.log(`[console ${msg.type()}]`, msg.text());
});
page.on("pageerror", (err) => console.log("[erreur page]", err.message));

for (const chemin of chemins.length ? chemins : ["/nouveau/client"]) {
  await page.goto(base + chemin, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const nom = chemin.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "accueil";
  await page.screenshot({ path: `test-results/captures/${nom}.png` });
  console.log(`test-results/captures/${nom}.png`);
}
await navigateur.close();
