# Recette de la démo Pro Space Devis

Checklist de docs/SPEC.md §12. Cocher la case et noter le résultat observé (date, appareil, remarque).

| Fait | # | Vérification | Attendu | Résultat |
|---|---|---|---|---|
| [ ] | 1 | `npm test` | Golden Rochat et tous les cas §6.3 verts | |
| [ ] | 2 | `npm run build` | Zéro erreur, zéro warning TypeScript | |
| [ ] | 3 | Tablette, Wi-Fi local (`http://IP:3000`) | Écran 1 rempli en moins de 2 min, trajet calculé sur une vraie adresse | |
| [ ] | 4 | Caméra et galerie | 2 pièces, 6 photos, vignettes correctes, orientation correcte | |
| [ ] | 5 | Générer | Overlay par pièce, inventaire cohérent, confiances affichées | |
| [ ] | 6 | Retour écran 1, changer l'étage, revenir | Inventaire intact, majoration recalculée | |
| [ ] | 7 | Ajouter une photo dans une pièce, relancer | Seule cette pièce est ré-analysée | |
| [ ] | 8 | Corriger quantités, filière, remise, nettoyage | Document recalculé instantanément | |
| [ ] | 9 | Télécharger le PDF | Identique à l'aperçu, logo, polices, montants | |
| [ ] | 10 | Envoyer | Snapshot dans Mes devis, PDF téléchargé, Renvoyer disponible | |
| [ ] | 11 | Grille : changer un prix, nouveau devis | Nouveau prix appliqué ; l'ancien devis inchangé | |
| [ ] | 12 | Rechargement de la page à chaque étape | Rien de perdu | |
| [ ] | 13 | Déploiement Vercel | Même parcours en HTTPS, variables d'environnement en place | |

Vérifications complémentaires utiles :

| Fait | Vérification | Attendu | Résultat |
|---|---|---|---|
| [ ] | `npm run test:e2e` | Parcours Playwright Rochat vert (CHF 2'653.40, 2026-0413, duplication à CHF 2'688.55) | |
| [ ] | Couper le Wi-Fi pendant une génération | La pièce passe en échec avec « Relancer », les autres restent analysées | |
| [ ] | Adresse inconnue à l'écran 1 | Message clair, champs km et minutes à saisir, rien de bloqué | |
