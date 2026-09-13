# Décisions prises pendant le build

Une ligne par décision : choix, raison.

- `--brand` = `#003664` (couleur unique du logo mesurée pixel par pixel), `--brand-ink` = `#00284B`, `--brand-soft` = `#E1EBF3` ; `--accent` = `#E8772E` conservé : le logo n'a qu'une couleur.
- Palette Tailwind par défaut désactivée dans `@theme` (`--color-*: initial`) : force l'usage des seuls tokens.
- Ajout des tokens `danger` / `danger-soft` et `scrim` : la maquette n'a pas de couleur d'erreur ni de voile de modale, indispensables aux messages de validation et aux dialogues.
- `@types/node` passé de 20 à 22 : conflit de dépendances pairs avec vitest 5, et Node 22 est le runtime utilisé.
- Polices Fontsource importées dans `app/layout.tsx` (import JS documenté par Fontsource) plutôt que par `@import` CSS.
- `InventaireItem.filiereManuelle` ajouté : sans ce drapeau, impossible de distinguer un choix manuel (§6.1 point 3, qui écrase tout) d'une filière calculée qui doit suivre un changement de destination.
- `Piece.analyse.hash` et `Piece.corrige` ajoutés : empreinte des photos au moment de l'analyse (ré-analyse partielle) et marqueur de corrections manuelles (confirmation avant d'écraser).
- `Totaux` complété (`majorationEtagePct`, `nettoyageAPreciser`, `minimumHT`, `tvaPct`, poids par filière) et `LigneDevis` complétée (`piece`, `surfaceM2`, `avertissement`) : le document et le PDF se rendent depuis le seul snapshot.
- `Totaux.remise` est négatif (ou 0) : il entre tel quel dans la somme 1 à 10 du §6.2.
- Remise plafonnée à la somme des postes 1 à 9 : évite un sous-total négatif (le minimum de facturation s'applique ensuite).
- Minimum de facturation affiché dans le bloc totaux (pas dans le tableau) : conforme au §9 et à la maquette.
- Lignes à 0 (stationnement privé, portage inclus, pas de majoration) non affichées ; ressourcerie et SENS affichées à 0.00 dès qu'elles ont du volume (§6.2 point 7).
- Taxes spéciales regroupées par catégorie (« Taxe d'élimination, pneu », 4 × CHF 6.00) dans la section Tri et élimination.
- Durée estimée : `Math.round` des minutes (231 × 1.3 = 300.3 → 300), affichage arrondi au quart d'heure.
- Dates formatées en heure de Zurich (`Intl`, fuseau Europe/Zurich) : identiques sur la tablette et sur le serveur Vercel en UTC.
- Identifiants par `crypto.getRandomValues` et non `crypto.randomUUID` : ce dernier n'existe pas hors HTTPS, or la tablette teste en http://IP:3000.
- Brouillon par défaut : civilité Madame, appartement, rez (étage 0), sans ascenseur, place privée, débarras, tri sur place ; les champs obligatoires à valeur par défaut sont donc toujours valides, le panneau droit rend visible leur effet.
- Pièces par défaut créées avec le brouillon et remplacées au changement de type de logement tant qu'aucune photo ni inventaire n'existe.
- Réinitialiser la grille incrémente aussi la version : c'est une modification des prix appliqués aux futurs devis.
- Store persistant en `skipHydration` + `useSyncExternalStore` sur `persist.hasHydrated()` : pas de décalage de rendu serveur/client.
- Saisie différée : valeur locale écrite dans le store 300 ms après la dernière frappe, immédiatement à la sortie du champ, au démontage et avant toute validation (`flushSaisies`) ; aucune frappe perdue en changeant d'écran.
- Pas de bouton « Enregistrer le brouillon » (présent dans la maquette) : l'enregistrement est continu, la barre haute affiche l'heure du dernier enregistrement.
- Proposition « Reprendre le brouillon / Repartir de zéro » uniquement à l'ouverture de « Nouveau devis » (rail ou page d'accueil, paramètre `?reprise=1`), jamais au retour depuis l'étape 2 ni au rechargement : sinon la question reviendrait à chaque navigation arrière. Échap = reprendre (non destructif).
- Un nombre saisi hors bornes (étage > 40, texte non numérique) n'est pas écrit dans le store et le champ revient à la dernière valeur valide à la sortie.
- Trajet : après un échec, l'adresse est mémorisée avec `source: 'manuel'` pour ne pas relancer le calcul en boucle ; bouton « Relancer le calcul », et « Corriger à la main » sur un trajet calculé. Libellé manuel « Payerne – localité » (la variable BASE_ADDRESS n'est lue que côté serveur).
- Stepper : l'étape 3 est accessible dès qu'un inventaire existe (ou pour un nettoyage seul), pas seulement avec des photos : un devis dupliqué n'a plus de photos mais garde son inventaire.
- Grille du formulaire en 12 colonnes calibrée pour 572 px utiles en tablette ; types de prestation et destinations sur toute la largeur pour que « Débarras + nettoyage » tienne sur une ligne.
- Boutons « Prendre une photo » et « Depuis la galerie » : `<label>` contenant l'`<input type="file">` visuellement masqué, plutôt qu'un `input.click()` en JavaScript, fiable sur Safari iPadOS et accessible au clavier.
- Photos traitées une par une (redimensionnement puis IndexedDB) : mémoire maîtrisée sur tablette avec des originaux de 12 Mpx ; progression « Préparation des photos : 3 / 6 ».
- Compteur de la barre basse « 16 photos dans 5 pièces » : compte les pièces qui contiennent au moins une photo.
- Renommer et supprimer la pièce active : boutons dans l'en-tête de la zone photos (pas de geste ni de menu au survol). Suppression confirmée dès que la pièce contient des photos ou un inventaire.
- Ajout de pièce : dialogue avec nom libre et suggestions tactiles (Chambre 2, Bureau, Buanderie, Garage, Grenier, Extérieur).
- Vignettes via `next/image` en `unoptimized` sur l'URL blob : pas d'avertissement eslint, pas d'optimisation serveur inutile.
- Marque du rail : `public/logo-mark.png` (maison du logo, découpée par sharp) en masque CSS blanc sur fond `brand` : le logo complet est bleu marine et illisible sur le rail.
