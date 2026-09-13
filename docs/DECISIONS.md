# Décisions prises pendant le build

Une ligne par décision : choix, raison.

- `--brand` = `#003664` (couleur unique du logo mesurée pixel par pixel), `--brand-ink` = `#00284B`, `--brand-soft` = `#E1EBF3` ; `--accent` = `#E8772E` conservé : le logo n'a qu'une couleur.
- Palette Tailwind par défaut désactivée dans `@theme` (`--color-*: initial`) : force l'usage des seuls tokens.
- Ajout des tokens `danger` / `danger-soft` et `scrim` : la maquette n'a pas de couleur d'erreur ni de voile de modale, indispensables aux messages de validation et aux dialogues.
- `@types/node` passé de 20 à 22 : conflit de dépendances pairs avec vitest 5, et Node 22 est le runtime utilisé.
- Polices Fontsource importées dans `app/layout.tsx` (import JS documenté par Fontsource) plutôt que par `@import` CSS.
- Marque du rail : `public/logo-mark.png` (maison du logo, découpée par sharp) en masque CSS blanc sur fond `brand` : le logo complet est bleu marine et illisible sur le rail.
