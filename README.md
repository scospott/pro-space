# Pro Space Devis

Démo tablette d'abord : dossier client, photos par pièce, inventaire par l'IA, devis PDF calculé par la grille tarifaire Pro Space. Le modèle classe, le code chiffre.

Référence fonctionnelle : `docs/SPEC.md`. Référence visuelle : `docs/maquette-v0.html`.

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
npm run dev
```

Ouvrir http://localhost:3000.

## Variables d'environnement

| Variable | Exemple | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Clé serveur pour l'analyse des photos. Jamais préfixée `NEXT_PUBLIC`. |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Modèle utilisé pour l'inventaire. |
| `BASE_ADDRESS` | `Payerne, Suisse` | Adresse de départ du camion pour le calcul du trajet. |
| `NEXT_PUBLIC_DEMO` | `true` | Envoi simulé et trois devis d'exemple. |

## Tester sur la tablette (même Wi-Fi)

1. Lancer le serveur sur toutes les interfaces : `npm run dev -- -H 0.0.0.0` (ou `npm run build && npm start -- -H 0.0.0.0`).
2. Trouver l'IP du PC : `hostname -I` (Linux), `ipconfig getifaddr en0` (macOS), `ipconfig` (Windows).
3. Sur la tablette, ouvrir `http://IP-DU-PC:3000`.
4. Si rien ne répond, autoriser le port 3000 dans le pare-feu du PC.

## Commandes

- `npm test` : tests unitaires (moteur de prix, post-traitement vision).
- `npm run test:e2e` : parcours complet Playwright (`npx playwright install chromium` la première fois).
- `npm run build` : build de production.
- `npm run lint` : eslint.
