# Compte rendu de build, Pro Space Devis

Build de la démo en une session, le 13.09.2026. Dépôt : `git@github.com:scospott/pro-space.git`, branche `main`, chaque phase commitée et poussée (le remote a toujours répondu).

## En bref

- Parcours complet fonctionnel en 1024 × 768 : client et lieu avec trajet réel, photos par pièce, analyse IA par pièce en parallèle, devis corrigeable recalculé sans réseau, PDF serveur, envoi simulé, Mes devis, grille tarifaire administrable.
- Le moteur de prix reproduit au centime le cas golden Rochat : **CHF 2'653.40 TTC**, 13.7 m³, 300 min.
- Vérifications finales : `npm test` 40 tests verts, `npm run test:e2e` parcours vert, `npm run build` sans erreur ni avertissement, `npm run lint` propre, aucun `any`, aucun `console.log` côté client.
- Aucun blocage (voir `docs/BLOCAGES.md`). Décisions consignées dans `docs/DECISIONS.md`.

## Phase par phase

| Phase | Commit | Contenu |
|---|---|---|
| 0 | `afbef7b` | Next.js 16.3 (App Router, Turbopack), Tailwind v4 avec les tokens de la maquette en `@theme` (palette par défaut désactivée), IBM Plex Sans, logo PNG 1024 px et marque du rail extraits par sharp, coquille rail + barre haute + stepper + barre basse, composants de base, CLAUDE.md, README, `.env.example`. |
| 1 | `b58e70b` | Types du §4 complétés, grille par défaut (paramètres §5.1, 40 catégories avec groupe et exemples), moteur `calculerDevis` pur dans l'ordre du §6.2, formats suisses, numérotation, store zustand persistant (clé `pro-space-devis`, compteur 413) avec garde d'hydratation, IndexedDB pour les photos, empreinte des photos. 23 tests dont le golden Rochat et tous les cas obligatoires. |
| 2 | `95b6162` | Écran 1 en trois groupes, saisie différée 300 ms sans perte, validation avec messages précis et focus sur le premier champ, panneau « Ce que le calcul prendra en compte » en direct, trajet Nominatim + OSRM (timeout 6 s, cache de l'adresse de départ, file d'une requête par seconde), saisie manuelle en secours, reprise de brouillon, stepper conditionnel. Testé sur une vraie adresse : Payerne – Lausanne, 44 km, 46 min. |
| 3 | `0392a60` | Écran photos : pièces par défaut selon le logement, ajout, renommage, suppression confirmée, caméra et galerie, redimensionnement 1280 px JPEG 0,82 avec orientation EXIF (vérifiée sur une fixture en orientation 6), limites 8 par pièce et 20 par logement, compteurs, « Voir le devis » quand rien n'a changé. |
| 4 | `8348795` | Prompt système et outil `report_inventory` (enum des ids du catalogue du store), post-traitement testé (fusion, confiance minimale, catégorie inconnue, filière), route `/api/analyse` (8 photos et 4 Mo maximum, sortie forcée par outil, erreurs HTTP propres, log des tokens), overlay de génération par pièce avec relance individuelle, ré-analyse partielle avec confirmation avant d'écraser des corrections. Test réel concluant (voir plus bas). |
| 5 | `62f3add` | Document HTML identique au PDF (contenu partagé par `lib/document.ts`), panneau d'inventaire (confiance, quantités, filière, retrait, ajout depuis le catalogue avec recherche), nettoyage, remise, bandeau par pièce à reprendre. |
| 6 | `69e2cd8` | PDF `@react-pdf/renderer` (A4, marges 18 mm, polices et logo embarqués, en-tête de tableau répété, pied de page numéroté), route `/api/pdf`, envoi simulé (numéro attribué, snapshot figé, photos supprimées, PDF téléchargé, toast), Renvoyer, Dupliquer pour corriger, Mes devis (recherche, total du mois, état vide), lecture seule, trois devis d'exemple calculés par le moteur. Vérifié sur `npm run build && npm start` : PDF de 201 Ko, en-tête `%PDF-`, 2 pages. |
| 7 | `45219d1` | Grille tarifaire : tous les paramètres avec unité et aide, catalogue par groupe entièrement éditable, validation à chaque frappe (testée), enregistrement versionné, annulation, réinitialisation confirmée, ajout de catégorie avec identifiant snake_case, suppression refusée si utilisée. Audit : `grille.default` n'est importé que par le store, les tests et le script de test réel. |
| 8 | `4b54d0e` | Parcours Playwright sur build de production : dossier Rochat, cinq pièces, génération simulée, total CHF 2'653.40, envoi et PDF 2026-0413, ligne dans Mes devis, prix du canapé passé à 120 et enregistré, copie recalculée à CHF 2'688.55, ancien devis inchangé. Un seul correctif, dans le test (sélecteur ambigu). |
| 9 | dernier commit | Audit UX (cibles 48 px du panneau d'inventaire, largeur des champs de la grille, message de stockage indisponible), test de l'absence de clé API, recette, README, ce compte rendu. |

## Ce qui n'est pas fait, ou seulement en démo

- Envoi d'e-mail réel : simulé comme prévu par la spec (le PDF se télécharge).
- Stockage local uniquement : les devis et la grille vivent dans le navigateur de la tablette ; un autre appareil ne les voit pas (version vendue : Supabase).
- Pas de test sur une vraie tablette ni de mesure de la qualité de l'inventaire sur de vraies photos : voir `docs/BLOCAGES.md` et `docs/RECETTE.md`.
- IDE de l'entreprise laissé en « CHE-xxx.xxx.xxx » (§13, à confirmer avec Ethan).
- Si `ANTHROPIC_MODEL` passe à un modèle qui refuse la sortie forcée par outil (Claude Fable 5.1), l'analyse renverra une erreur : garder `claude-sonnet-5` ou adapter l'appel.

## Décisions principales

Toutes sont dans `docs/DECISIONS.md`. Les plus structurantes :

- La tablette envoie le catalogue de sa grille à `/api/analyse` et post-traite la réponse elle-même ; le serveur ne connaît jamais la grille ni les prix.
- `/api/pdf` n'imprime que le snapshot reçu : le PDF est toujours la copie exacte de l'aperçu.
- Filière manuelle marquée par `filiereManuelle` pour qu'elle écrase la règle de destination, et elle seulement.
- Identifiants sans `crypto.randomUUID` (indisponible en HTTP sur l'IP du PC).
- Mode démo actif sauf `NEXT_PUBLIC_DEMO=false`.

## Analyse IA : tokens observés et coût estimé

Test réel (phase 4) : `node scripts/smoke-analyse.mjs http://localhost:3100 tests/fixtures/salon.jpg`, serveur de dev avec la clé de `.env.local`.

- HTTP 200 en 3,1 s, modèle `claude-sonnet-5`, arrêt `tool_use`, 3 objets reconnus (canapé 3 places, bibliothèque, table basse).
- **1 photo 1280 × 960 : 5 211 tokens en entrée, 210 en sortie.** Soit environ 3 570 tokens fixes par pièce (consignes et catalogue) et environ 1 640 tokens par photo.
- Parcours navigateur réel : deux pièces analysées en parallèle, devis affiché en 3,7 s.

Estimation au tarif Claude Sonnet 5 (2 $ par million de tokens en entrée, 10 $ en sortie) :

| Dossier | Entrée | Sortie | Coût |
|---|---|---|---|
| Appartement type, 16 photos dans 5 pièces | ~44 000 | ~1 500 | ~0,10 $ |
| Maison au maximum, 20 photos dans 8 pièces | ~61 000 | ~2 400 | ~0,15 $ |

Pour 60 devis par mois, compter environ 6 à 9 $ par mois, ré-analyses partielles comprises. Le trajet (Nominatim, OSRM) et le PDF ne coûtent rien.

## Clé API absente

Test en production avec `ANTHROPIC_API_KEY` vide : `/api/analyse` répond HTTP 500 `{"error":"Clé API manquante côté serveur"}`, affiché tel quel sur la ligne de la pièce dans l'overlay avec « Relancer », sans plantage ni blocage des autres pièces.

## Déployer sur Vercel

1. Vercel, *Add New → Project*, importer `scospott/pro-space` (Next.js détecté, réglages par défaut).
2. *Settings → Environment Variables* (Production et Preview) : `ANTHROPIC_API_KEY` (sensible), `ANTHROPIC_MODEL=claude-sonnet-5`, `BASE_ADDRESS=Payerne, Suisse`, `NEXT_PUBLIC_DEMO=true`.
3. *Deploy*. La durée maximale de `/api/analyse` est de 60 s (`maxDuration`) ; les polices et le logo du PDF sont inclus par `outputFileTracingIncludes`.
4. Contrôle sur l'URL HTTPS : trajet calculé sur une vraie adresse, génération d'un devis avec 2 ou 3 photos, téléchargement du PDF (logo et polices présents).

## Les trois premières choses à tester sur tablette

1. **Photos réelles** : dans deux pièces, prendre 3 photos à la caméra et en ajouter 3 depuis la galerie, en portrait et en paysage. Vérifier les vignettes, l'orientation, puis « Générer le devis » et la cohérence de l'inventaire (ce qui est fixé au mur ne doit pas être compté).
2. **Aller-retour sans perte** : depuis le devis, corriger une quantité, revenir à l'écran 1, passer l'étage de 3 à 1, revenir au devis ; l'inventaire et la correction doivent être intacts, la majoration recalculée. Recharger la page à chaque étape.
3. **Envoi et PDF sur l'appareil** : envoyer le devis, ouvrir le PDF téléchargé dans la visionneuse de la tablette (logo, accents, montants identiques à l'aperçu), puis le retrouver dans Mes devis et utiliser « Renvoyer ».
