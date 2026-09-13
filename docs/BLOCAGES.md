# Blocages rencontrés pendant le build

Aucune phase n'a été bloquée : les dix phases ont abouti avec tests et build verts, et le parcours Playwright passe.

Incidents résolus en cours de route (aucun n'a demandé plus d'une tentative) :

- Phase 0 : conflit de dépendances pairs entre vitest 5 et `@types/node` 20, résolu en passant à `@types/node` 22.
- Phase 0 : styles de base hors couche CSS qui écrasaient les utilitaires Tailwind (texte des boutons illisible), rangés dans `@layer base`.
- Phase 6 : en-tête du PDF où le titre « Devis » chevauchait le numéro, corrigé (hauteur de ligne et bloc de largeur fixe).
- Phase 8 : sélecteur ambigu dans le test (« Mes devis » dans le rail et dans l'écran), corrigé dans le test en ciblant le rail.

Points non vérifiables dans cette session (pas des blocages, à couvrir par la recette) :

- Aucun test sur une vraie tablette : caméra, orientation des photos iPad et Android, clavier tactile, Safari iPadOS.
- Précision réelle de l'inventaire par l'IA : un seul test réel sur une image de synthèse (3 objets reconnus). À évaluer sur de vraies photos de logements.
- Déploiement Vercel non effectué (hors du périmètre de la session, variables à saisir par Scott).
