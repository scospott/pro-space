// Inventaire scripté du dossier de démonstration Fribourg (maison, 7 pièces).
// Lignes déjà post-traitées : jamais fusionnées, deux lignes peuvent partager un categoryId.
// photos = rang de la photo dans la pièce (1 = première déposée).
import type { InventaireItem } from "../types";

export type ItemFixture = Pick<InventaireItem, "categoryId" | "label" | "quantite" | "etat" | "photos"> & { confiance: number };

export type PieceFixture = { remarques: string; items: ItemFixture[] };

export const DEMO_INVENTAIRE: Record<string, PieceFixture> = {
  'salon': {
    remarques: 'Lustre et suspensions considérés comme fixes. Une pièce voisine est visible par la porte ouverte (table et chaises blanches) : non comptée, à photographier séparément.',
    items: [
      { categoryId: 'canape_3p', label: 'Canapé chesterfield jaune', quantite: 1, confiance: 0.97, etat: 'bon', photos: [1] },
      { categoryId: 'canape_2p', label: 'Canapé beige, partiellement visible', quantite: 1, confiance: 0.72, etat: 'bon', photos: [2] },
      { categoryId: 'fauteuil', label: 'Fauteuil club beige', quantite: 1, confiance: 0.96, etat: 'bon', photos: [1] },
      { categoryId: 'table_basse', label: 'Table basse en bois bleu', quantite: 1, confiance: 0.95, etat: 'bon', photos: [1] },
      { categoryId: 'table_salle', label: 'Table ronde de salle à manger', quantite: 1, confiance: 0.95, etat: 'bon', photos: [2] },
      { categoryId: 'table_cuisine', label: 'Tables d’appoint avec nappes', quantite: 2, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'chaise', label: 'Chaises rotin et cannées', quantite: 6, confiance: 0.80, etat: 'bon', photos: [1, 2] },
      { categoryId: 'bibliotheque', label: 'Bibliothèque pleine de livres', quantite: 1, confiance: 0.97, etat: 'bon', photos: [2] },
      { categoryId: 'commode', label: 'Commode grise trois tiroirs', quantite: 1, confiance: 0.94, etat: 'bon', photos: [2] },
      { categoryId: 'miroir_cadre', label: 'Miroir ovale doré, cadres et miroirs muraux', quantite: 5, confiance: 0.90, etat: 'bon', photos: [1, 2] }, // 4 si remarque « miroir »
      { categoryId: 'petit_electro', label: 'Radio vintage', quantite: 1, confiance: 0.85, etat: 'use', photos: [2] },
      { categoryId: 'bac_plante', label: 'Plante sur la bibliothèque', quantite: 1, confiance: 0.75, etat: 'use', photos: [2] },
      { categoryId: 'carton', label: 'Livres à emballer, estimation', quantite: 4, confiance: 0.80, etat: 'use', photos: [2] },
      { categoryId: 'petit_objet', label: 'Lampadaire, panneaux décoratifs, vases', quantite: 7, confiance: 0.85, etat: 'bon', photos: [1, 2] },
    ],
  },
  'cuisine': {
    remarques: 'Cuisine agencée, meuble haut mural et plafonnier non comptés, fixés. La cuisinière à bois en fonte est très lourde, prévoir trois personnes.',
    items: [
      { categoryId: 'gros_volume', label: 'Cuisinière à bois en fonte, très lourde', quantite: 1, confiance: 0.90, etat: 'use', photos: [2] },
      { categoryId: 'cuisiniere', label: 'Cuisinière électrique blanche', quantite: 1, confiance: 0.95, etat: 'use', photos: [2] },
      { categoryId: 'table_cuisine', label: 'Table de cuisine avec nappe', quantite: 1, confiance: 0.92, etat: 'bon', photos: [2] },
      { categoryId: 'chaise', label: 'Chaises bistrot en bois', quantite: 2, confiance: 0.94, etat: 'bon', photos: [2] },
      { categoryId: 'vaisselle_carton', label: 'Verres, théière, marmites, bocaux', quantite: 3, confiance: 0.85, etat: 'use', photos: [1, 2, 3] },
      { categoryId: 'petit_electro', label: 'Radio ancienne', quantite: 1, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'bac_plante', label: 'Pot de fleurs', quantite: 1, confiance: 0.80, etat: 'use', photos: [2] },
      { categoryId: 'vetements_sac', label: 'Rideaux', quantite: 1, confiance: 0.70, etat: 'use', photos: [2, 3] },
      { categoryId: 'miroir_cadre', label: 'Cadre photo', quantite: 1, confiance: 0.80, etat: 'bon', photos: [3] },
      { categoryId: 'petit_objet', label: 'Quatre siphons anciens, plateau, panier', quantite: 6, confiance: 0.88, etat: 'use', photos: [1, 2, 3] },
    ],
  },
  'chambre 1': {
    remarques: 'Pièce presque vide. L’objet sombre à droite n’est pas identifiable sur la photo.',
    items: [
      { categoryId: 'carton', label: 'Carton de déménagement, bac plastique', quantite: 2, confiance: 0.98, etat: 'use', photos: [1] },
      { categoryId: 'petit_objet', label: 'Guitare acoustique avec pied', quantite: 1, confiance: 0.96, etat: 'bon', photos: [1] },
      { categoryId: 'petit_objet', label: 'Objet sombre non identifié, angle droit', quantite: 1, confiance: 0.55, etat: 'use', photos: [1] },
      { categoryId: 'petit_objet', label: 'Petits objets sur le rebord de fenêtre', quantite: 3, confiance: 0.80, etat: 'use', photos: [1] },
      { categoryId: 'petit_electro', label: 'Ventilateur ou radiateur soufflant', quantite: 1, confiance: 0.70, etat: 'use', photos: [1] },
      { categoryId: 'tapis', label: 'Tapis bleu', quantite: 1, confiance: 0.90, etat: 'use', photos: [1] },
      { categoryId: 'vetements_sac', label: 'Rideaux et vêtements suspendus', quantite: 1, confiance: 0.75, etat: 'use', photos: [1] },
    ],
  },
  'chambre 2': {
    remarques: 'Radiateur mural non compté, fixé.',
    items: [
      { categoryId: 'lit_simple', label: 'Lit une place avec matelas et literie', quantite: 1, confiance: 0.97, etat: 'use', photos: [1] },
      { categoryId: 'bureau', label: 'Bureau blanc avec étagères', quantite: 1, confiance: 0.95, etat: 'bon', photos: [1] },
      { categoryId: 'chaise', label: 'Chaise de bureau à roulettes', quantite: 1, confiance: 0.93, etat: 'bon', photos: [1] },
      { categoryId: 'miroir_cadre', label: 'Cadres et dessins encadrés', quantite: 5, confiance: 0.90, etat: 'bon', photos: [1] },
      { categoryId: 'carton', label: 'Sac papier, boîte à chaussures, bacs plastique', quantite: 3, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'vetements_sac', label: 'Literie et coussins', quantite: 1, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'petit_objet', label: 'Ballon, cible, mini-stepper, lampe, panier, jouets', quantite: 6, confiance: 0.85, etat: 'use', photos: [1] },
    ],
  },
  'bureau': {
    remarques: 'Lambris mural non compté, fixé. Beaucoup de papier au sol, prévoir des sacs.',
    items: [
      { categoryId: 'bureau', label: 'Meuble machine à coudre et bureau en bois', quantite: 2, confiance: 0.90, etat: 'use', photos: [1, 2] },
      { categoryId: 'petit_electro', label: 'Machine à coudre, radiateur soufflant', quantite: 2, confiance: 0.90, etat: 'use', photos: [1] },
      { categoryId: 'tv', label: 'Téléviseur ancien', quantite: 1, confiance: 0.70, etat: 'hs', photos: [1] },
      { categoryId: 'chaise', label: 'Chaises pliantes', quantite: 3, confiance: 0.85, etat: 'use', photos: [1, 2] },
      { categoryId: 'lit_double', label: 'Cadre de lit en bois', quantite: 1, confiance: 0.62, etat: 'use', photos: [1] },
      { categoryId: 'table_cuisine', label: 'Table d’appoint avec bassines', quantite: 1, confiance: 0.70, etat: 'use', photos: [1] },
      { categoryId: 'table_salle', label: 'Grand plan de travail en bois', quantite: 1, confiance: 0.60, etat: 'use', photos: [2] },
      { categoryId: 'miroir_cadre', label: 'Miroir ou cadre rond', quantite: 1, confiance: 0.55, etat: 'use', photos: [2] },
      { categoryId: 'petit_objet', label: 'Machine à écrire, bassines, bols', quantite: 5, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'carton', label: 'Papiers et journaux à mettre en sacs', quantite: 3, confiance: 0.80, etat: 'hs', photos: [1] },
      { categoryId: 'sac_dechets', label: 'Débris au sol', quantite: 2, confiance: 0.80, etat: 'hs', photos: [2] },
      { categoryId: 'vetements_sac', label: 'Rideaux orange', quantite: 1, confiance: 0.75, etat: 'use', photos: [1] },
    ],
  },
  'cave': {
    remarques: 'Les photos 2 et 3 montrent le même coin, compté une seule fois.',
    items: [
      { categoryId: 'lave_linge', label: 'Lave-linge et sèche-linge Miele', quantite: 2, confiance: 0.97, etat: 'use', photos: [1] },
      { categoryId: 'armoire_2p', label: 'Armoire métallique deux portes', quantite: 1, confiance: 0.78, etat: 'use', photos: [1] },
      { categoryId: 'table_cuisine', label: 'Petite table pliante', quantite: 1, confiance: 0.80, etat: 'use', photos: [1] },
      { categoryId: 'chaise', label: 'Tabouret blanc', quantite: 1, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'vetements_sac', label: 'Linge et vêtements', quantite: 2, confiance: 0.85, etat: 'use', photos: [1] },
      { categoryId: 'carton', label: 'Sacs, cartons, sac IKEA, boîtes', quantite: 8, confiance: 0.85, etat: 'use', photos: [1, 2, 3] },
      { categoryId: 'peinture_chimique', label: 'Quatre pots de peinture et un seau d’enduit', quantite: 5, confiance: 0.93, etat: 'hs', photos: [2, 3] },
      { categoryId: 'outil_jardin', label: 'Perceuse', quantite: 1, confiance: 0.80, etat: 'use', photos: [2] },
      { categoryId: 'petit_objet', label: 'Étendoir, tapis caoutchouc, rouleau de sous-couche, outillage', quantite: 6, confiance: 0.80, etat: 'use', photos: [1, 2, 3] },
    ],
  },
  'garage': {
    remarques: 'Beaucoup de bois de récupération, vérifier le volume réel sur place.',
    items: [
      { categoryId: 'refrigerateur', label: 'Réfrigérateur blanc', quantite: 1, confiance: 0.98, etat: 'use', photos: [2] },
      { categoryId: 'outil_jardin', label: 'Brouette, échelle, scie circulaire', quantite: 3, confiance: 0.90, etat: 'use', photos: [1, 2] },
      { categoryId: 'bibliotheque', label: 'Rayonnages en bois', quantite: 4, confiance: 0.80, etat: 'use', photos: [2] },
      { categoryId: 'commode', label: 'Meuble à tiroirs blanc', quantite: 1, confiance: 0.70, etat: 'use', photos: [2] },
      { categoryId: 'etagere_metal', label: 'Rack métallique, étagère rouge', quantite: 2, confiance: 0.85, etat: 'use', photos: [1, 2] },
      { categoryId: 'petit_electro', label: 'Ventilateur sur pied, aspirateur d’atelier, nettoyeur haute pression', quantite: 3, confiance: 0.75, etat: 'use', photos: [1, 2] },
      { categoryId: 'armoire_2p', label: 'Armoire démontée, panneaux', quantite: 1, confiance: 0.62, etat: 'use', photos: [1] },
      { categoryId: 'lit_simple', label: 'Sommiers à lattes', quantite: 2, confiance: 0.66, etat: 'use', photos: [1] },
      { categoryId: 'table_salle', label: 'Plateau ou table en bois', quantite: 1, confiance: 0.70, etat: 'use', photos: [1] },
      { categoryId: 'table_basse', label: 'Petite table basse', quantite: 1, confiance: 0.75, etat: 'use', photos: [1] },
      { categoryId: 'chaise', label: 'Chaises bois et plastique', quantite: 5, confiance: 0.88, etat: 'use', photos: [1] },
      { categoryId: 'gros_volume', label: 'Planches et panneaux de bois empilés', quantite: 1, confiance: 0.85, etat: 'hs', photos: [1] },
      { categoryId: 'peinture_chimique', label: 'Seau de peinture', quantite: 1, confiance: 0.60, etat: 'hs', photos: [1] },
      { categoryId: 'carton', label: 'Cartons et sacs plastique', quantite: 6, confiance: 0.85, etat: 'use', photos: [1, 2] },
      { categoryId: 'petit_objet', label: 'Bidons, seaux, balais, corde, carrelage, extincteur, isolant', quantite: 9, confiance: 0.80, etat: 'use', photos: [1, 2] },
    ],
  },
};
