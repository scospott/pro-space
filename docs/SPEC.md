# Pro Space Devis — Spécification v1 (démo)

> Référence unique du build. Copiée dans `docs/SPEC.md` du repo `pro-space`. Claude Code la lit avant chaque prompt.
> Maquette visuelle de référence : `docs/maquette-v0.html` (tokens, layout, écrans, mini-moteur de prix en JS).
> Statut : validée par Scott le 13/09/2026. Build de la démo en une traite.

---

## 0. En une phrase

Une application web (tablette d'abord, ordinateur ensuite) qui permet à Ethan, seul utilisateur, de créer un dossier client, d'y ajouter des photos par pièce, de laisser l'IA **inventorier** les objets, puis de générer, corriger et envoyer un **devis PDF** calculé par une **grille tarifaire déterministe** qu'il administre lui-même.

Principe gravé : **le modèle classe, le code chiffre.** Jamais un prix ne sort du LLM.

---

## 1. Client

| | |
|---|---|
| Société | Pro Space Sàrl, 1530 Payerne (VD), Suisse |
| Activité | Débarras, nettoyage (fin de bail, après travaux, insalubre), déchèterie à domicile. Particuliers et professionnels |
| Zone | Suisse romande : Vaud, Fribourg, Neuchâtel (Lausanne, Payerne, Yverdon, Fribourg, Bulle, Montreux, Vevey, Morges…) |
| Contact | +41 78 351 56 50, contact@pro-space.ch, 08h00–18h30 lundi–samedi |
| Utilisateur | Ethan, seul dans l'entreprise, ~60 devis/mois, tout à la main aujourd'hui |
| Devise, TVA | CHF, TVA 8,1 % |
| Logo | `public/logo-site.webp` (UI) ; converti en `public/logo.png` pour le PDF |
| Site | https://pro-space.ch — « Le prix d'un débarras dépend du volume, du type d'objets, des conditions d'accès et du temps nécessaire » → c'est exactement le modèle de la grille |

---

## 2. Périmètre

| | Démo (ce build) | Version vendue (plus tard) |
|---|---|---|
| Utilisateurs | Ethan, pas d'authentification | Ethan, auth simple (Supabase Auth) |
| Stockage devis | localStorage (snapshots) | Supabase, table `devis` uniquement |
| Photos | Jamais stockées côté serveur. En mémoire + IndexedDB local le temps du devis | Idem |
| Clients | Saisis à chaque devis, pas de fichier client | Idem |
| Envoi | Simulé : le PDF se télécharge, le devis passe en « envoyé » | Resend ou Gmail API depuis contact@pro-space.ch |
| Trajet | Nominatim + OSRM (gratuit, sans clé), saisie manuelle en secours | Google Routes API |
| Hébergement | Vercel, compte de Scott | Comptes d'Ethan, code livré avec feuille de route |
| Marque | Pro Space uniquement, aucune mention ScottLab | Idem |

**Hors périmètre, définitivement pour la v1** : vidéo, WhatsApp, suivi de statut (ouvert, accepté…), signature électronique, planning, facturation, multi-langue, multi-utilisateur, application native, estimation de poids par l'IA, envoi de photos par le client final via un portail.

---

## 3. Parcours et écrans

Navigation : un **rail** à gauche (Nouveau devis, Mes devis, Grille tarifaire), une **barre haute** avec le titre et le **stepper** 1 Client et lieu → 2 Photos → 3 Devis, une **barre basse** avec les actions de l'écran. Voir la maquette.

### Règles UX non négociables

1. **Aucun retour en arrière ne fait perdre une saisie.** Le brouillon (client, lieu, prestation, pièces, photos, inventaire, corrections, remise, options) est sauvegardé en continu. Revenir à l'étape 1 depuis le devis, modifier l'étage, revenir au devis : l'inventaire est intact, seul le prix se recalcule.
2. **Ré-analyse partielle.** Chaque pièce porte un hash de ses photos. Si Ethan ajoute ou retire des photos dans une pièce après génération, seule cette pièce est ré-analysée ; les corrections manuelles des autres pièces sont conservées. Les corrections manuelles d'une pièce ré-analysée sont perdues, et l'écran le dit avant de relancer.
3. **Stepper cliquable vers l'arrière, toujours.** Vers l'avant seulement si l'étape est valide (champs obligatoires, au moins une photo).
4. **Tablette d'abord.** Cibles tactiles ≥ 48 px, champs 46 px, rien qui dépende du survol, `<input type="file" capture="environment">` pour la caméra, `multiple` pour la galerie. Même layout élargi sur ordinateur.
5. **Erreurs et vides parlent.** Une pièce dont l'analyse échoue affiche « L'analyse du salon a échoué, relancer » avec un bouton, sans bloquer les autres. Un écran vide invite à agir.
6. **Rien ne part sans validation.** Le devis s'affiche déjà calculé, chaque ligne est corrigeable, le bouton « Envoyer » est la seule sortie.
7. **Un devis envoyé est figé.** Snapshot complet (lignes, totaux, version de grille). « Renvoyer » renvoie le même document. « Dupliquer pour corriger » crée un nouveau numéro pré-rempli.
8. Reprise : à l'ouverture de « Nouveau devis » avec un brouillon existant, proposer « Reprendre le brouillon » / « Repartir de zéro ».

### Écran 1 — Client et lieu (`/nouveau/client`)

| Groupe | Champs (obligatoire en gras) | Notes |
|---|---|---|
| Client | Civilité (Madame, Monsieur, Société), **Prénom**, **Nom**, **E-mail**, Téléphone | Société : le prénom devient facultatif, le nom = raison sociale |
| Lieu de l'intervention | **Rue et numéro**, **NPA**, **Localité**, Type (Appartement, Maison, Local commercial, Cave/garage seul), Pièces (ex. 3,5), Surface m², **Étage** (0 = rez), **Ascenseur** (oui/non), Portage camion → entrée en m, **Stationnement** (Place privée ou accès direct · Rue sans restriction · Zone bleue, autorisation communale · Centre-ville, accès difficile) | L'adresse déclenche le calcul du trajet (§8) dès que rue + NPA + localité sont remplis (debounce 800 ms) |
| Prestation | **Type** (Débarras · Nettoyage · Débarras + nettoyage), **Destination des objets** (Déchetterie · Ressourcerie · Tri sur place), Type de nettoyage si nettoyage (Fin de bail · Après travaux · Insalubre), Date souhaitée (texte libre), Remarques pour le devis | Les remarques sont transmises à l'IA (ex. « conserver le piano ») |
| Panneau droit « Ce que le calcul prendra en compte » | Trajet (km, min, source), majoration étage, portage, stationnement, nettoyage | Mis à jour en direct. Si le trajet n'est pas calculable : champs km et minutes à saisir |

Action : « Continuer vers les photos ».

### Écran 2 — Photos par pièce (`/nouveau/photos`)

- Liste de pièces à gauche, préremplie selon le type de logement : Appartement → Salon, Cuisine, Chambre, Salle de bain, Cave ; Maison → + Garage, Grenier, Extérieur ; Local → Local, Réserve ; Cave/garage seul → Cave, Garage. « Ajouter une pièce » (nom libre), renommer, supprimer (avec ses photos).
- Grille de vignettes de la pièce sélectionnée, bouton « Prendre une photo » et « Depuis la galerie », suppression par vignette.
- Limites : **20 photos par logement, 8 par pièce** (au-delà, message clair). Redimensionnement côté client avant stockage : côté long ≤ 1280 px, JPEG qualité 0,82, orientation EXIF respectée (`createImageBitmap(blob, { imageOrientation: 'from-image' })`).
- Compteurs : « 16 / 20 photos », « 16 photos dans 5 pièces ».
- Action : « Générer le devis » (désactivé sans photo). Si une génération a déjà eu lieu et que rien n'a changé, le bouton devient « Voir le devis ».

### Écran 3 — Génération (overlay sur l'écran 2)

Liste des pièces avec état (en attente, en cours, terminé, échec + relancer), puis « Calcul du devis selon la grille Pro Space ». Un appel API par pièce, lancés en parallèle. Le texte de pied : « Les photos servent à reconnaître et compter les objets. Le prix est calculé par la grille Pro Space, pas par l'IA. »

### Écran 4 — Devis (`/nouveau/devis`)

- Gauche : le **document** tel que le client le recevra (même rendu que le PDF, §9), recalculé à chaque correction.
- Droite, panneau « Inventaire détecté » : par pièce, chaque ligne = catégorie, confiance (Sûr ≥ 85 %, À vérifier < 85 %, Ajouté à la main), quantité (− / +), filière (Déchetterie · Ressourcerie · Reprise gratuite, sélecteur compact), retirer. En bas : « Ajouter un objet non détecté » (recherche dans le catalogue, quantité), option Nettoyage (interrupteur, surface reprise de l'écran 1), Remise (% ou CHF).
- Barre basse : « Modifier » (retour écran 1, sans perte), « Télécharger le PDF », « Envoyer à {email} ».
- Envoyer (démo) : modale de confirmation avec l'e-mail modifiable, mention « Démo : l'e-mail n'est pas envoyé, le PDF est téléchargé ». Valider = snapshot dans Mes devis (statut envoyé), téléchargement du PDF, toast « Devis 2026-0413 envoyé à … », bouton qui devient « Renvoyer ».

### Écran 5 — Mes devis (`/devis`)

Tableau : numéro, client, lieu, date, total TTC, statut (brouillon/envoyé), actions (Ouvrir, Renvoyer, Dupliquer pour corriger). Recherche texte. Ouvrir = écran devis en lecture seule. Totaux du mois en barre basse. Trois devis d'exemple préchargés en démo, marqués « Exemple ».

### Écran 6 — Grille tarifaire (`/grille`)

Deux colonnes : Paramètres (§5.1) et Catalogue d'objets (§5.2), tous les champs éditables, validation (nombres ≥ 0, TVA en %), « Enregistrer la grille » (incrémente la version, horodate), « Réinitialiser aux valeurs par défaut » (confirmation). Note affichée : « Une modification s'applique aux futurs devis, pas à ceux déjà envoyés. »

---

## 4. Modèle de données (TypeScript, `lib/types.ts`)

```ts
type Civilite = 'madame' | 'monsieur' | 'societe';
type TypeLogement = 'appartement' | 'maison' | 'local' | 'cave_garage';
type Stationnement = 'prive' | 'rue_libre' | 'zone_bleue' | 'centre_difficile';
type TypePrestation = 'debarras' | 'nettoyage' | 'debarras_nettoyage';
type Destination = 'dechetterie' | 'ressourcerie' | 'tri';
type TypeNettoyage = 'fin_de_bail' | 'apres_travaux' | 'insalubre';
type Filiere = 'dechetterie' | 'ressourcerie' | 'sens' | 'special';
type Etat = 'bon' | 'use' | 'hs';

interface Client { civilite: Civilite; prenom: string; nom: string; email: string; telephone: string }
interface Lieu { rue: string; npa: string; localite: string; type: TypeLogement; pieces?: string; surfaceM2?: number;
  etage: number; ascenseur: boolean; portageM: number; stationnement: Stationnement }
interface Prestation { type: TypePrestation; destination: Destination; typeNettoyage?: TypeNettoyage; dateSouhaitee?: string; remarques?: string }
interface Trajet { kmAller: number; minAller: number; source: 'calcule' | 'manuel'; libelle: string } // ex. "Payerne – Lausanne"

interface Photo { id: string; pieceId: string; blobKey: string; width: number; height: number; addedAt: string } // blob dans IndexedDB
interface Piece { id: string; nom: string; hashPhotos: string; analyse?: { at: string; status: 'ok' | 'erreur'; remarques?: string } }

interface InventaireItem { id: string; pieceId: string; categoryId: string; label: string; quantite: number;
  confiance: number | null; etat: Etat; filiere: Filiere; photos: number[]; origine: 'ia' | 'manuel' }

interface Categorie { id: string; label: string; volumeM3: number; poidsKg: number; manutentionMin: number; prixCHF: number;
  filiereDefaut: Filiere; taxeUnitaireCHF?: number; groupe: string; exemples?: string }

interface Grille { version: number; updatedAt: string; params: GrilleParams; catalogue: Categorie[] }

interface Devis { id: string; numero: string; createdAt: string; statut: 'brouillon' | 'envoye';
  client: Client; lieu: Lieu; prestation: Prestation; trajet: Trajet; pieces: Piece[]; photos: Photo[];
  inventaire: InventaireItem[]; nettoyageInclus: boolean; remise?: { type: 'pct' | 'chf'; valeur: number };
  snapshot?: { grilleVersion: number; lignes: LigneDevis[]; totaux: Totaux; sentAt?: string; sentTo?: string } }
```

`LigneDevis` = `{ section, designation, detail?, quantite?, volumeM3?, montantCHF }`. `Totaux` = `{ manutention, majorationEtage, portage, stationnement, deplacement, elimination, taxesSpeciales, nettoyage, remise, sousTotalHT, minimumApplique, totalHT, tva, totalTTC, volumeM3, poidsDechetterieKg, dureeMin }`.

---

## 5. Grille tarifaire v1 (valeurs par défaut, `lib/grille.default.ts`)

Aucune grille écrite n'existe chez Ethan. Celle-ci est **plausible pour la Suisse romande** et cohérente en interne ; il l'ajustera dans l'écran Grille. Tout est HT, CHF.

### 5.1 Paramètres

| Clé | Valeur | Sens |
|---|---|---|
| `tauxHoraireEquipe` | 95.00 | CHF/h, équipe de 2 personnes (sert au temps de trajet et à la durée estimée) |
| `tarifKm` | 1.20 | CHF/km, camion, aller-retour |
| `tarifTonneDechetterie` | 240.00 | CHF/tonne, encombrants |
| `majorationEtagePct` | 10 | % de la manutention **par étage sans ascenseur** (rez = 0), plafonné par `majorationEtageMaxPct` |
| `majorationEtageMaxPct` | 50 | |
| `portageInclusM` | 20 | Mètres inclus entre le camion et l'entrée |
| `portageSuppCHF` | 30.00 | Par tranche de 20 m entamée au-delà |
| `stationnement` | prive 0 · rue_libre 0 · zone_bleue 60 · centre_difficile 90 | Forfait |
| `nettoyageM2` | fin_de_bail 10.00 · apres_travaux 14.00 · insalubre 20.00 | CHF/m² |
| `nettoyageMinimumCHF` | 250.00 | |
| `minimumFacturationHT` | 350.00 | |
| `tvaPct` | 8.1 | |
| `arrondiTTC` | 0.05 | Arrondi commercial suisse |

### 5.2 Catalogue (40 catégories)

Colonnes : volume de transport m³, poids estimé kg, manutention en minutes (équipe de 2), prix HT par unité, filière par défaut.

| id | Catégorie | m³ | kg | min | CHF | Filière |
|---|---|---|---|---|---|---|
| canape_3p | Canapé 3 places | 1.5 | 60 | 20 | 95 | dechetterie |
| canape_2p | Canapé 2 places | 1.0 | 45 | 15 | 70 | dechetterie |
| canape_angle | Canapé d'angle | 2.5 | 90 | 30 | 150 | dechetterie |
| fauteuil | Fauteuil | 0.5 | 20 | 8 | 35 | dechetterie |
| table_basse | Table basse | 0.3 | 15 | 5 | 25 | ressourcerie |
| meuble_tv | Meuble TV | 0.4 | 25 | 8 | 35 | ressourcerie |
| bibliotheque | Bibliothèque, étagère en bois | 0.9 | 45 | 15 | 55 | dechetterie |
| buffet | Buffet, vaisselier | 1.2 | 70 | 20 | 90 | ressourcerie |
| table_salle | Table de salle à manger | 0.8 | 40 | 12 | 60 | ressourcerie |
| chaise | Chaise | 0.15 | 5 | 2 | 10 | ressourcerie |
| tv | Téléviseur, écran | 0.15 | 12 | 4 | 20 | sens |
| tapis | Tapis | 0.15 | 10 | 3 | 15 | dechetterie |
| piano_droit | Piano droit | 1.0 | 220 | 60 | 350 | ressourcerie |
| refrigerateur | Réfrigérateur, congélateur | 0.7 | 70 | 15 | 80 | sens |
| lave_linge | Lave-linge, lave-vaisselle, sèche-linge | 0.5 | 75 | 15 | 80 | sens |
| cuisiniere | Cuisinière, four | 0.5 | 60 | 12 | 70 | sens |
| petit_electro | Petit électroménager (pièce) | 0.05 | 8 | 2 | 8 | sens |
| table_cuisine | Table de cuisine | 0.5 | 25 | 8 | 40 | ressourcerie |
| vaisselle_carton | Vaisselle, ustensiles (par carton) | 0.08 | 12 | 3 | 8 | dechetterie |
| lit_double | Lit double avec matelas | 1.2 | 50 | 18 | 90 | dechetterie |
| lit_simple | Lit simple avec matelas | 0.8 | 35 | 12 | 60 | dechetterie |
| matelas | Matelas seul | 0.4 | 20 | 5 | 30 | dechetterie |
| armoire_3p | Armoire 3 portes (démontage inclus) | 2.0 | 110 | 35 | 140 | dechetterie |
| armoire_2p | Armoire 2 portes (démontage inclus) | 1.4 | 80 | 25 | 100 | dechetterie |
| commode | Commode | 0.5 | 35 | 8 | 40 | ressourcerie |
| table_nuit | Table de nuit | 0.15 | 10 | 3 | 12 | ressourcerie |
| bureau | Bureau | 0.6 | 35 | 10 | 45 | ressourcerie |
| vetements_sac | Vêtements, textiles (par sac) | 0.1 | 6 | 2 | 5 | ressourcerie |
| meuble_sdb | Meuble de salle de bain, colonne | 0.3 | 20 | 6 | 25 | dechetterie |
| miroir_cadre | Miroir, cadre, tableau | 0.05 | 5 | 2 | 8 | ressourcerie |
| etagere_metal | Étagère métallique | 0.4 | 15 | 6 | 20 | dechetterie |
| velo | Vélo | 0.3 | 15 | 4 | 25 | ressourcerie |
| pneu | Pneu | 0.1 | 9 | 2 | 10 | special (taxe 6.00/unité) |
| outil_jardin | Outil, mobilier de jardin (pièce) | 0.3 | 12 | 4 | 20 | dechetterie |
| bac_plante | Pot, bac de plantes | 0.1 | 15 | 3 | 10 | dechetterie |
| carton | Carton ou sac divers | 0.1 | 8 | 2 | 5 | dechetterie |
| sac_dechets | Sac de déchets 110 l | 0.1 | 8 | 1 | 5 | dechetterie |
| peinture_chimique | Peinture, solvant, produit chimique (bidon) | 0.02 | 5 | 2 | 8 | special (taxe 10.00/unité) |
| gros_volume | Objet volumineux non listé (par m³ estimé) | 1.0 | 60 | 15 | 70 | dechetterie |
| petit_objet | Petit objet non listé | 0.05 | 3 | 1 | 4 | dechetterie |

Groupes pour l'affichage : Séjour, Cuisine, Chambre, Salle de bain, Cave et extérieur, Divers.

---

## 6. Moteur de prix (`lib/pricing.ts`, pur, testé)

Entrée : `Devis` (sans snapshot) + `Grille`. Sortie : `{ lignes: LigneDevis[], totaux: Totaux }`. Aucun accès réseau, aucun aléa.

### 6.1 Filière effective d'une ligne

1. `filiereDefaut` de la catégorie si `sens` ou `special` → **toujours** conservée (reprise gratuite électro, taxes spéciales).
2. Sinon, selon la destination du dossier : `dechetterie` → dechetterie ; `ressourcerie` → ressourcerie si `etat ∈ {bon, use}`, sinon dechetterie ; `tri` → ressourcerie si `etat = bon`, sinon dechetterie.
3. Le choix manuel d'Ethan sur la ligne (`item.filiere`) écrase tout.

### 6.2 Ordre de calcul (arrondis à 0.01 sauf mention)

| # | Poste | Formule |
|---|---|---|
| 1 | Manutention | Σ `quantite × prixCHF` |
| 2 | Majoration étage | si `!ascenseur` et `etage ≥ 1` : `manutention × min(majorationEtagePct × etage, majorationEtageMaxPct) / 100`, sinon 0 |
| 3 | Portage | `ceil(max(0, portageM − portageInclusM) / 20) × portageSuppCHF` |
| 4 | Stationnement | forfait selon `lieu.stationnement` |
| 5 | Déplacement | `2 × kmAller × tarifKm + (2 × minAller / 60) × tauxHoraireEquipe` |
| 6 | Élimination déchetterie | `tonnes = Σ(poidsKg × quantite des lignes dechetterie) / 1000` ; montant `= tonnes × tarifTonneDechetterie` ; ligne affichée avec m³ et tonnes |
| 7 | Ressourcerie, reprise SENS | lignes à 0.00, affichées avec leur volume (transparence du tri) |
| 8 | Taxes spéciales | Σ `taxeUnitaireCHF × quantite` (pneus, produits chimiques) |
| 9 | Nettoyage | si inclus : `max(surfaceM2 × nettoyageM2[type], nettoyageMinimumCHF)` ; sans surface saisie → ligne « à préciser », 0, avertissement |
| 10 | Remise | `pct` : `sousTotal × valeur / 100` ; `chf` : valeur. Ligne négative |
| 11 | Sous-total HT | Σ 1→10 |
| 12 | Minimum | si `sousTotal < minimumFacturationHT` → `totalHT = minimumFacturationHT`, ligne « Minimum de facturation » |
| 13 | TVA | `totalHT × tvaPct / 100`, arrondi 0.01 |
| 14 | Total TTC | `arrondi(totalHT + tva, 0.05)` |
| 15 | Durée estimée | `Σ manutentionMin × quantite × (1 + majoration étage)` → minutes, affichée arrondie au quart d'heure, « environ 5 h à 2 personnes » |

Format monétaire : `CHF 2'653.40` (apostrophe des milliers, deux décimales). Dates `13.09.2026`.

### 6.3 Cas de référence (test « golden », dossier Rochat)

Entrées : appartement 3,5 pièces, 75 m², 3e étage sans ascenseur, portage 25 m, zone bleue, prestation débarras + nettoyage fin de bail, destination tri, trajet 49 km / 45 min aller, pas de remise. Inventaire :

| Pièce | categoryId | qté | etat |
|---|---|---|---|
| Salon | canape_3p | 1 | use |
| Salon | meuble_tv | 1 | bon |
| Salon | table_basse | 1 | bon |
| Salon | bibliotheque | 2 | use |
| Salon | carton | 6 | use |
| Cuisine | refrigerateur | 1 | use |
| Cuisine | table_cuisine | 1 | bon |
| Cuisine | chaise | 4 | bon |
| Cuisine | carton | 4 | use |
| Chambre | lit_double | 1 | use |
| Chambre | armoire_3p | 1 | bon |
| Chambre | commode | 1 | bon |
| Salle de bain | meuble_sdb | 1 | use |
| Cave | etagere_metal | 3 | use |
| Cave | velo | 1 | bon |
| Cave | carton | 10 | use |
| Cave | pneu | 4 | hs |

Résultats attendus, à l'identique dans le test :

| Poste | CHF |
|---|---|
| Manutention | 945.00 |
| Majoration 3e étage sans ascenseur (30 %) | 283.50 |
| Portage 25 m (1 tranche) | 30.00 |
| Stationnement zone bleue | 60.00 |
| Déplacement 98 km, 1 h 30 | 260.10 |
| Déchetterie 425 kg → 0.425 t | 102.00 |
| Ressourcerie (245 kg), reprise SENS (70 kg) | 0.00 |
| Taxe pneus 4 × 6.00 | 24.00 |
| Nettoyage fin de bail 75 m² | 750.00 |
| Sous-total HT | 2'454.60 |
| TVA 8,1 % | 198.82 |
| **Total TTC** | **2'653.40** |
| Volume | 13.7 m³ |
| Durée estimée | 231 min × 1.3 = 300 min → 5 h 00 |

Autres tests obligatoires : minimum de facturation (1 chaise, rez, ascenseur, 5 km / 8 min → HT 350.00, TTC 378.35) ; ascenseur présent → majoration 0 ; étage 8 sans ascenseur → plafond 50 % ; remise 10 % ; arrondi TTC à 0.05 ; nettoyage sous le minimum → 250.00 ; sens/special jamais basculés par la destination.

---

## 7. Extraction vision (`lib/vision.ts`, `app/api/analyse/route.ts`)

- Modèle : `claude-sonnet-5` via `@anthropic-ai/sdk`, clé serveur uniquement (`ANTHROPIC_API_KEY`). **Un appel par pièce**, jusqu'à 8 photos JPEG base64, lancés en parallèle depuis le client (une requête `POST /api/analyse` par pièce, `maxDuration = 60`).
- Sortie forcée par **tool use** : outil `report_inventory`, `tool_choice` forcé, `input_schema` strict ci-dessous. Le code ne lit que `tool_use.input`.
- Vérifier la signature exacte du SDK et les limites images sur docs.claude.com (Context7) avant d'écrire l'appel.

Schéma de l'outil :

```json
{
  "type": "object",
  "properties": {
    "items": { "type": "array", "items": { "type": "object", "properties": {
      "categoryId": { "type": "string", "enum": ["<les 40 ids du catalogue>"] },
      "label": { "type": "string", "description": "Ce qui est vu, en français, 2 à 6 mots" },
      "quantity": { "type": "integer", "minimum": 1 },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
      "etat": { "type": "string", "enum": ["bon", "use", "hs"] },
      "photos": { "type": "array", "items": { "type": "integer" }, "description": "Index des photos (1..n) où l'objet est visible" },
      "note": { "type": "string" }
    }, "required": ["categoryId", "label", "quantity", "confidence", "etat", "photos"] } },
    "remarques": { "type": "string", "description": "Accès, objets lourds, doutes, objets hors catalogue" }
  },
  "required": ["items"]
}
```

Prompt système (esprit, à rédiger en français) : tu es l'inventoriste d'une entreprise suisse de débarras ; ces photos montrent **une seule pièce** (« {nom} ») sous plusieurs angles ; compte chaque objet physique **une seule fois** même s'il apparaît sur plusieurs photos ; ne compte pas ce qui est fixé au bâtiment (cuisine agencée, radiateurs, sanitaires, luminaires, stores) ; exclus les objets que le dossier demande de conserver (remarques : « {remarques} ») ; regroupe les petits objets en cartons ou sacs et arrondis au supérieur ; rattache chaque objet à la catégorie la plus proche en volume, `gros_volume` ou `petit_objet` si rien ne convient ; `confidence` basse quand la photo est sombre, partielle ou l'objet ambigu ; `etat` selon l'aspect ; réponds uniquement via l'outil. Le catalogue (id, libellé, exemples) est injecté dans le système.

Post-traitement (`lib/vision.ts`, testé) : fusion des doublons de même `categoryId` dans la pièce (somme des quantités, confiance minimale) ; `categoryId` inconnu → `petit_objet` avec note ; `confidence < 0.85` → « À vérifier » dans l'UI ; filière initiale = règle §6.1 ; `origine: 'ia'`. Erreur API ou réponse sans tool_use → statut `erreur` sur la pièce, bouton « Relancer », les autres pièces ne sont pas bloquées.

---

## 8. Trajet (`lib/trajet.ts`, `app/api/trajet/route.ts`)

- Adresse de départ : `BASE_ADDRESS` (env, défaut « Payerne, Suisse »), géocodée une fois et mise en cache mémoire.
- Géocodage : Nominatim (`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ch&q=…`), en-tête `User-Agent: pro-space-devis/0.1 (contact@pro-space.ch)`, côté serveur, 1 requête/s max.
- Routage : OSRM public (`https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false`) → `distance` (m), `duration` (s). Réponse `{ kmAller, minAller, libelle: "Payerne – Lausanne" }`, km arrondi à l'unité, minutes à l'unité.
- Échec (timeout 6 s, adresse introuvable) → `source: 'manuel'`, champs km et minutes visibles dans le panneau droit, valeur mémorisée dans le brouillon. Le devis affiche « Déplacement Payerne – Lausanne, aller-retour, 98 km, 1 h 30 ».
- Version vendue : Google Routes API, même interface `getTrajet(adresse)`.

---

## 9. Document devis et PDF (`lib/pdf/DevisPdf.tsx`, `app/api/pdf/route.ts`)

- Génération serveur avec `@react-pdf/renderer` (`renderToBuffer`, `serverExternalPackages` dans `next.config.ts`), police IBM Plex Sans depuis `@fontsource/ibm-plex-sans` (fichiers `.woff` 400/500/600), logo `public/logo.png` (converti depuis le webp avec `sharp`, commité).
- Mise en page (identique à l'aperçu HTML) : logo à gauche ; à droite « Devis », N° `AAAA-NNNN`, « Payerne, le JJ.MM.AAAA », « Valable jusqu'au … » (+30 jours) ; blocs Pro Space Sàrl (1530 Payerne, téléphone, e-mail, « IDE CHE-xxx.xxx.xxx TVA » à compléter) et client ; paragraphe Objet généré (type de prestation, logement, étage, date souhaitée, remarques) ; tableau Désignation · Qté · Volume · Montant avec sections **Débarras et manutention** (ligne par catégorie et par pièce, nom de pièce en gris), **Tri et élimination**, **Accès et déplacement**, **Nettoyage** (si inclus), **Remise** (si présente) ; bloc totaux (Sous-total HT, Minimum de facturation si appliqué, TVA 8,1 %, Total TTC) ; durée estimée ; conditions.
- Conditions (texte fixe, modifiable dans les paramètres de la grille plus tard) : « Devis établi sur la base des photos transmises et de notre grille tarifaire. Les objets non visibles sur les photos ou les volumes supplémentaires constatés sur place sont facturés selon la même grille. Paiement à 10 jours net. Devis valable 30 jours. »
- Nom de fichier : `Devis-2026-0413-Rochat.pdf`. Numérotation : compteur dans le store, démarre à 413 en démo (les trois exemples portent 0410–0412), format `AAAA-NNNN`.

---

## 10. Persistance (démo)

- `zustand` + middleware `persist` (localStorage), clé `pro-space-devis`. Slices : `draft` (Devis en cours), `devis[]` (snapshots), `grille`, `compteur`, `ui`. Garde d'hydratation pour éviter les décalages SSR.
- Photos : `idb-keyval`, clé = `photo.blobKey`, valeur = Blob JPEG redimensionné. Vignettes via `URL.createObjectURL` à l'affichage, révoquées à la sortie. Un devis envoyé ne conserve **pas** ses photos (snapshot texte uniquement, principe « on ne stocke pas les photos »).
- Version vendue : même interface de store, `devis[]` et `grille` déplacés vers Supabase.

---

## 11. Architecture technique

```
app/
  layout.tsx                 police, rail, barre haute, garde d'hydratation
  page.tsx                   → redirection /nouveau/client
  nouveau/client/page.tsx    écran 1
  nouveau/photos/page.tsx    écran 2 (+ overlay de génération)
  nouveau/devis/page.tsx     écran 4
  devis/page.tsx             écran 5, devis/[id]/page.tsx lecture seule
  grille/page.tsx            écran 6
  api/analyse/route.ts       POST { pieceId, nom, remarques, photos: base64[] } → { items, remarques }
  api/trajet/route.ts        POST { adresse } → { kmAller, minAller, libelle } | { error }
  api/pdf/route.ts           POST Devis (avec snapshot) → application/pdf
components/                  Rail, Topbar, Stepper, Field, Segmented, Toggle, PhotoTile, RoomList,
                             InventoryPanel, DevisDocument, GenerationOverlay, ConfirmDialog, Toast
lib/
  types.ts  grille.default.ts  pricing.ts  pricing.test.ts  vision.ts  vision.test.ts
  trajet.ts  numbering.ts  format.ts  store.ts  photos.ts  image.ts (resize)  pdf/DevisPdf.tsx
docs/SPEC.md  docs/maquette-v0.html  CLAUDE.md  .env.example  README.md
```

Stack : Next.js 15+ (App Router, TypeScript strict), Tailwind v4 (`@theme` tokens dans `globals.css`, valeurs de la maquette, `--brand` et `--accent` alignés sur le logo), zustand, idb-keyval, `@anthropic-ai/sdk`, `@react-pdf/renderer`, `@fontsource/ibm-plex-sans`, vitest, sharp (dev). Pas de composant tiers lourd, pas d'animation hors l'overlay de génération et les réponses aux actions.

### Variables d'environnement

```
ANTHROPIC_API_KEY=            # serveur uniquement, jamais NEXT_PUBLIC
ANTHROPIC_MODEL=claude-sonnet-5
BASE_ADDRESS="Payerne, Suisse"
NEXT_PUBLIC_DEMO=true         # envoi simulé + devis d'exemple
```

`.env.local` est ignoré par git ; `.env.example` est commité avec les clés vides. Les mêmes variables sont saisies dans le projet Vercel.

---

## 12. Recette de la démo

| # | Vérification | Attendu |
|---|---|---|
| 1 | `npm test` | Golden Rochat et tous les cas §6.3 verts |
| 2 | `npm run build` | Zéro erreur, zéro warning TypeScript |
| 3 | Tablette, Wi-Fi local (`http://IP:3000`) | Écran 1 rempli en < 2 min, trajet calculé sur une vraie adresse |
| 4 | Caméra + galerie | 2 pièces, 6 photos, vignettes correctes, orientation correcte |
| 5 | Générer | Overlay par pièce, inventaire cohérent, confiances affichées |
| 6 | Retour écran 1, changer l'étage, revenir | Inventaire intact, majoration recalculée |
| 7 | Ajouter une photo dans une pièce, relancer | Seule cette pièce est ré-analysée |
| 8 | Corriger quantités, filière, remise, nettoyage | Document recalculé instantanément |
| 9 | Télécharger le PDF | Identique à l'aperçu, logo, polices, montants |
| 10 | Envoyer | Snapshot dans Mes devis, PDF téléchargé, Renvoyer disponible |
| 11 | Grille : changer un prix, nouveau devis | Nouveau prix appliqué ; l'ancien devis inchangé |
| 12 | Rechargement de la page à chaque étape | Rien de perdu |
| 13 | Déploiement Vercel | Même parcours en HTTPS, variables d'environnement en place |

---

## 13. À confirmer avec Ethan (n'empêche pas la démo)

Adresse exacte de départ · IDE et mentions du devis · valeurs de la grille (surtout taux horaire, tarif à la tonne, nettoyage au m²) · conditions de paiement · s'il veut afficher le détail ligne par ligne ou un forfait global par section · ses 5 derniers devis réels pour caler la grille.
