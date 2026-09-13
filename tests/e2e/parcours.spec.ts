import { expect, test, type Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROCHAT_CLIENT, ROCHAT_INVENTAIRE, ROCHAT_LIEU, ROCHAT_PIECES } from "../../lib/fixtures/rochat";

// Parcours complet de la démo (docs/SPEC.md §12), en 1024 × 768.
// /api/analyse et /api/trajet sont simulés ; le PDF est produit par le vrai serveur.

const FIXTURES = path.join(process.cwd(), "tests", "fixtures");
const PHOTOS = ["salon.jpg", "cuisine.jpg", "cave-portrait.jpg"].map((nom) => path.join(FIXTURES, nom));

async function fixturesJpeg() {
  mkdirSync(FIXTURES, { recursive: true });
  const couleurs = ["#9a8675", "#c9c3b6", "#6d6a66"];
  for (const [i, chemin] of PHOTOS.entries()) {
    if (existsSync(chemin)) continue;
    await sharp({ create: { width: 1600, height: 1200, channels: 3, background: couleurs[i] } })
      .jpeg({ quality: 85 })
      .withMetadata({ orientation: i === 2 ? 6 : 1 })
      .toFile(chemin);
  }
}

async function simulerServices(page: Page) {
  await page.route("**/api/trajet", (route) => route.fulfill({ json: { kmAller: 49, minAller: 45, libelle: "Payerne – Lausanne" } }));
  await page.route("**/api/analyse", async (route) => {
    const corps: unknown = route.request().postDataJSON();
    const nom = typeof corps === "object" && corps !== null && "nom" in corps && typeof corps.nom === "string" ? corps.nom : "";
    const items = ROCHAT_INVENTAIRE.filter((l) => l.piece === nom).map((l) => ({
      categoryId: l.categoryId,
      label: `${l.categoryId} vu sur la photo`,
      quantity: l.quantite,
      confidence: 0.91,
      etat: l.etat,
      photos: [1],
    }));
    await route.fulfill({ json: { items, remarques: "" } });
  });
}

/** Lien du rail de navigation principal (un bouton « Voir dans Mes devis » existe aussi dans les écrans). */
function rail(page: Page, nom: "Nouveau devis" | "Mes devis" | "Grille tarifaire") {
  return page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: nom });
}

function toast(page: Page, texte: string | RegExp) {
  return page.getByRole("status").filter({ hasText: texte });
}

test.beforeAll(async () => {
  await fixturesJpeg();
});

test("dossier Rochat : client, photos, génération, envoi, grille, duplication", async ({ page }) => {
  await simulerServices(page);

  // Écran 1 : client et lieu
  await page.goto("/nouveau/client?reprise=1");
  await page.locator("#champ-prenom").fill(ROCHAT_CLIENT.prenom);
  await page.locator("#champ-nom").fill(ROCHAT_CLIENT.nom);
  await page.locator("#champ-email").fill(ROCHAT_CLIENT.email);
  await page.locator("#champ-telephone").fill(ROCHAT_CLIENT.telephone);
  await page.locator("#champ-rue").fill(ROCHAT_LIEU.rue);
  await page.locator("#champ-npa").fill(ROCHAT_LIEU.npa);
  await page.locator("#champ-localite").fill(ROCHAT_LIEU.localite);
  await page.locator("#champ-pieces").fill(ROCHAT_LIEU.pieces);
  await page.locator("#champ-surfaceM2").fill(String(ROCHAT_LIEU.surfaceM2));
  await page.locator("#champ-etage").fill(String(ROCHAT_LIEU.etage));
  await page.getByRole("radio", { name: "Non" }).click();
  await page.locator("#champ-portageM").fill(String(ROCHAT_LIEU.portageM));
  await page.locator("#champ-stationnement").selectOption("zone_bleue");
  await page.getByRole("radio", { name: "Débarras + nettoyage" }).click();
  await page.getByRole("radio", { name: "Tri sur place" }).click();
  await page.getByRole("radio", { name: "Fin de bail" }).click();
  await page.locator("#champ-date").fill("Semaine du 21.09.2026");
  await page.locator("#champ-remarques").fill("Vider entièrement, conserver le piano (non compté)");
  await expect(page.getByText("49 km, 45 min")).toBeVisible();
  await expect(page.getByText("+30 % manutention")).toBeVisible();
  await page.getByRole("button", { name: "Continuer vers les photos" }).click();

  // Écran 2 : cinq pièces, une photo chacune
  await expect(page).toHaveURL(/\/nouveau\/photos$/);
  const pieces = page.getByRole("navigation", { name: "Pièces" });
  for (const nom of ROCHAT_PIECES) await expect(pieces.getByRole("button", { name: new RegExp(`^${nom}`) })).toBeVisible();
  for (const [i, nom] of ROCHAT_PIECES.entries()) {
    await pieces.getByRole("button", { name: new RegExp(`^${nom}`) }).click();
    await page.getByTestId("entree-galerie").setInputFiles(PHOTOS[i % PHOTOS.length]);
    await expect(page.getByTestId("vignette").locator("img")).toHaveCount(1);
  }
  await expect(page.getByText("5 photos dans 5 pièces")).toBeVisible();
  await expect(page.getByText("5 / 20 photos")).toBeVisible();

  // Écran 3 : génération
  await page.getByRole("button", { name: "Générer le devis" }).click();
  await expect(page.getByRole("dialog", { name: "Génération du devis" })).toBeVisible();

  // Écran 4 : devis
  await expect(page).toHaveURL(/\/nouveau\/devis$/, { timeout: 30_000 });
  await expect(page.getByTestId("ligne-inventaire")).toHaveCount(ROCHAT_INVENTAIRE.length);
  await expect(page.getByTestId("total-ttc")).toHaveText("CHF 2'653.40");

  // Envoi simulé : numéro attribué, PDF téléchargé
  await page.getByRole("button", { name: /^Envoyer à/ }).click();
  await expect(page.getByText("Démo : l'e-mail n'est pas envoyé, le PDF est téléchargé.")).toBeVisible();
  const telechargement = page.waitForEvent("download");
  await page.getByRole("button", { name: "Envoyer et télécharger le PDF" }).click();
  const pdf = await telechargement;
  expect(pdf.suggestedFilename()).toBe("Devis-2026-0413-Rochat.pdf");
  const chemin = await pdf.path();
  expect(statSync(chemin).size).toBeGreaterThan(20_000);
  expect(readFileSync(chemin).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await expect(toast(page, "Devis 2026-0413 envoyé à isabelle.rochat@bluewin.ch")).toBeVisible();
  await expect(page.getByRole("button", { name: "Renvoyer le devis" })).toBeVisible();
  await expect(page.getByText(/^Envoyé le \d{2}\.\d{2}\.\d{4} à \d{2}:\d{2}$/)).toBeVisible();

  // Mes devis
  await rail(page, "Mes devis").click();
  const ligne0413 = page.getByTestId("ligne-devis").filter({ hasText: "2026-0413" });
  await expect(ligne0413).toHaveCount(1);
  await expect(ligne0413).toContainText("CHF 2'653.40");
  await expect(ligne0413).toContainText("Envoyé");

  // Grille : prix du canapé 3 places modifié et enregistré
  await rail(page, "Grille tarifaire").click();
  await page.getByLabel("Prix CHF, Canapé 3 places").fill("120");
  await page.getByRole("button", { name: "Enregistrer la grille" }).click();
  await expect(toast(page, "Grille enregistrée (version 2)")).toBeVisible();

  // Nouveau devis dupliqué : recalculé avec la nouvelle grille
  await rail(page, "Mes devis").click();
  await page.getByRole("button", { name: "Dupliquer pour corriger le devis 2026-0413" }).click();
  await expect(page).toHaveURL(/\/nouveau\/devis$/);
  await expect(page.getByText("N° brouillon")).toBeVisible();
  await expect(page.getByTestId("total-ttc")).toHaveText("CHF 2'688.55");

  // L'ancien devis est inchangé
  await rail(page, "Mes devis").click();
  await expect(page.getByTestId("ligne-devis").filter({ hasText: "2026-0413" })).toContainText("CHF 2'653.40");
  await page.getByRole("link", { name: "2026-0413" }).click();
  await expect(page).toHaveURL(/\/devis\/.+/);
  await expect(page.getByText("N° 2026-0413")).toBeVisible();
  await expect(page.getByTestId("total-ttc")).toHaveText("CHF 2'653.40");
});
