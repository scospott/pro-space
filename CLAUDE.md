@AGENTS.md

# Pro Space Devis

## But
Application web, tablette d'abord, qui permet à Ethan (Pro Space Sàrl, débarras et nettoyage, 1530 Payerne) de créer un dossier client, d'ajouter des photos par pièce, de laisser l'IA inventorier les objets, puis de générer, corriger et télécharger un devis PDF calculé par une grille tarifaire qu'il administre.

## Principe
**Le modèle classe, le code chiffre.** Le LLM ne fait que reconnaître et compter des objets rattachés au catalogue. Tous les montants sortent de `lib/pricing.ts` (pur, testé) à partir de la grille du store. Jamais un prix ne sort du LLM.

## Avant toute tâche
- Lire `docs/SPEC.md` (référence fonctionnelle et technique) ; référence visuelle : `docs/maquette-v0.html`.
- Choix ambigus consignés dans `docs/DECISIONS.md` (une ligne : choix, raison).
- Tests et build verts avant chaque commit : `npm test && npm run build`.

## Stack
Next.js 16 (App Router, TypeScript strict), Tailwind v4 (`@theme` dans `app/globals.css`), zustand + persist (localStorage), idb-keyval (photos), `@anthropic-ai/sdk` (vision, serveur uniquement), `@react-pdf/renderer` (PDF serveur), `@fontsource/ibm-plex-sans`, vitest, Playwright, sharp (dev).

## Conventions
- TypeScript strict, aucun `any`.
- Textes d'interface en français, casse de phrase, sans emoji, sans anglais résiduel. Marque Pro Space uniquement.
- Tokens de design obligatoires (la palette Tailwind par défaut est désactivée) : `ink`, `muted`, `line`, `line-soft`, `canvas`, `surface`, `surface-2`, `brand`, `brand-ink`, `brand-soft`, `accent`, `accent-ink`, `ok`, `ok-soft`, `warn`, `warn-soft`, `danger`, `danger-soft`, rayons `rounded-r` (10 px) et `rounded-rs` (6 px).
- Couleurs de marque : `--brand` = `#003664`, bleu marine unique du logo (`public/logo-site.webp`) ; `--accent` = `#E8772E` (le logo n'a qu'une couleur, l'accent de la maquette est conservé).
- Cibles tactiles ≥ 48 px, champs 46 px, rien qui dépende du survol. Chiffres tabulaires (`montant`) sur les montants.
- Le moteur de prix et l'extraction lisent la grille du store, jamais `lib/grille.default.ts` directement (seuls le store et les tests l'importent).
- La clé `ANTHROPIC_API_KEY` ne quitte jamais le serveur. Ne jamais lire, afficher ni commiter `.env.local`.

## Commandes
- `npm run dev` : serveur de développement (`npm run dev -- -H 0.0.0.0` pour la tablette).
- `npm test` : tests unitaires (vitest).
- `npm run test:e2e` : parcours complet (Playwright, Chromium, viewport 1024 × 768).
- `npm run build` : build de production.
- `npm run lint` : eslint.
- `npm run logo` : régénère `public/logo.png` et `public/logo-mark.png` depuis le webp.
