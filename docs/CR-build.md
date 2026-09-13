# Compte rendu de build, Pro Space Devis

(Document complété en fin de build.)

## Smoke test réel de l'analyse (phase 4)

- Commande : `node scripts/smoke-analyse.mjs http://localhost:3100 tests/fixtures/salon.jpg` (serveur de dev, clé de `.env.local`).
- Résultat : HTTP 200 en 3,1 s, modèle `claude-sonnet-5`, arrêt `tool_use`, 3 objets (canapé 3 places, bibliothèque, table basse).
- Tokens observés pour 1 photo 1280 × 960 : **entrée 5 211, sortie 210**.
