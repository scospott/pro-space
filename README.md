# Pro Space Devis

Démo tablette d'abord pour Pro Space Sàrl (débarras et nettoyage, Payerne) : dossier client, photos par pièce, inventaire par l'IA, devis PDF calculé par la grille tarifaire que l'entreprise administre. **Le modèle classe, le code chiffre** : aucun prix ne sort de l'IA.

Référence fonctionnelle : `docs/SPEC.md`. Référence visuelle : `docs/maquette-v0.html`. Décisions de build : `docs/DECISIONS.md`. Compte rendu : `docs/CR-build.md`. Recette : `docs/RECETTE.md`.

## Installation

Node.js 22 ou plus récent.

```bash
npm install
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
npm run dev
```

Ouvrir http://localhost:3000. Les données (brouillon, devis envoyés, grille) restent dans le navigateur (localStorage) ; les photos dans IndexedDB, supprimées à l'envoi du devis.

## Variables d'environnement

| Variable | Valeur | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Clé serveur pour l'analyse des photos. Jamais préfixée `NEXT_PUBLIC`. Sans elle, l'analyse affiche « Clé API manquante côté serveur ». |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Modèle d'inventaire (défaut `claude-sonnet-5`). |
| `BASE_ADDRESS` | `Payerne, Suisse` | Adresse de départ du camion pour le calcul du trajet. |
| `NEXT_PUBLIC_DEMO` | `true` | Trois devis d'exemple. Lue au build : redéployer après modification. |

## Déploiement sur Vercel

1. Importer le dépôt GitHub dans Vercel (framework détecté : Next.js, aucune commande à changer).
2. Dans *Settings → Environment Variables*, ajouter pour *Production* et *Preview* exactement :
   - `ANTHROPIC_API_KEY` = la clé (type *Sensitive*)
   - `ANTHROPIC_MODEL` = `claude-sonnet-5`
   - `BASE_ADDRESS` = `Payerne, Suisse`
   - `NEXT_PUBLIC_DEMO` = `true`
3. Déployer. Les fonctions `/api/analyse` (60 s max), `/api/pdf` et `/api/trajet` tournent en Node.js ; les polices et le logo du PDF sont inclus par `outputFileTracingIncludes` (`next.config.ts`).
4. Vérifier sur l'URL HTTPS : trajet calculé à l'écran 1, génération d'un devis, téléchargement du PDF.

## Tester sur la tablette (même Wi-Fi)

1. Lancer le serveur sur toutes les interfaces : `npm run dev -- -H 0.0.0.0` (ou `npm run build && npm start -- -H 0.0.0.0`, plus proche de la production).
2. Trouver l'IP du PC : `hostname -I` (Linux), `ipconfig getifaddr en0` (macOS), `ipconfig` (Windows).
3. Sur la tablette, ouvrir `http://IP-DU-PC:3000`.
4. Si rien ne répond, autoriser le port 3000 dans le pare-feu du PC.

L'application fonctionne en HTTP sur le réseau local (pas de fonction réservée à HTTPS) ; la caméra s'ouvre par le sélecteur de fichiers du système.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires : moteur de prix (golden Rochat), post-traitement vision, formulaire de grille |
| `npm run test:e2e` | Parcours complet Playwright en 1024 × 768 sur un build de production (`npx playwright install chromium` la première fois) |
| `npm run build` | Build de production |
| `npm run lint` | eslint |
| `npm run logo` | Régénère `public/logo.png` et `public/logo-mark.png` depuis le webp |
| `node scripts/fixtures.mjs` | Régénère les trois JPEG de test de `tests/fixtures/` |
| `node scripts/smoke-analyse.mjs http://localhost:3000` | Appel réel de `/api/analyse` avec une photo de test (consomme quelques tokens) |
