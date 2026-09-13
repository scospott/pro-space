import type { Categorie, Grille, GrilleParams } from "./types";

// Grille tarifaire v1 (docs/SPEC.md §5). Tout est HT, en CHF.
// Seuls le store et les tests importent ce fichier : le moteur et l'extraction lisent la grille du store.

const PARAMS: GrilleParams = {
  tauxHoraireEquipe: 95,
  tarifKm: 1.2,
  tarifTonneDechetterie: 240,
  majorationEtagePct: 10,
  majorationEtageMaxPct: 50,
  portageInclusM: 20,
  portageSuppCHF: 30,
  stationnement: { prive: 0, rue_libre: 0, zone_bleue: 60, centre_difficile: 90 },
  nettoyageM2: { fin_de_bail: 10, apres_travaux: 14, insalubre: 20 },
  nettoyageMinimumCHF: 250,
  minimumFacturationHT: 350,
  tvaPct: 8.1,
  arrondiTTC: 0.05,
};

const CATALOGUE: Categorie[] = [
  // Séjour
  { id: "canape_3p", label: "Canapé 3 places", volumeM3: 1.5, poidsKg: 60, manutentionMin: 20, prixCHF: 95, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "sofa, divan, canapé-lit" },
  { id: "canape_2p", label: "Canapé 2 places", volumeM3: 1.0, poidsKg: 45, manutentionMin: 15, prixCHF: 70, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "causeuse, petit sofa, banquette" },
  { id: "canape_angle", label: "Canapé d'angle", volumeM3: 2.5, poidsKg: 90, manutentionMin: 30, prixCHF: 150, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "canapé en L, méridienne, canapé modulable" },
  { id: "fauteuil", label: "Fauteuil", volumeM3: 0.5, poidsKg: 20, manutentionMin: 8, prixCHF: 35, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "bergère, fauteuil relax, pouf" },
  { id: "table_basse", label: "Table basse", volumeM3: 0.3, poidsKg: 15, manutentionMin: 5, prixCHF: 25, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "table de salon, guéridon, bout de canapé" },
  { id: "meuble_tv", label: "Meuble TV", volumeM3: 0.4, poidsKg: 25, manutentionMin: 8, prixCHF: 35, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "banc TV, meuble hi-fi, console" },
  { id: "bibliotheque", label: "Bibliothèque, étagère en bois", volumeM3: 0.9, poidsKg: 45, manutentionMin: 15, prixCHF: 55, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "étagère murale, rayonnage, meuble à livres" },
  { id: "buffet", label: "Buffet, vaisselier", volumeM3: 1.2, poidsKg: 70, manutentionMin: 20, prixCHF: 90, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "bahut, enfilade, meuble de salle à manger" },
  { id: "table_salle", label: "Table de salle à manger", volumeM3: 0.8, poidsKg: 40, manutentionMin: 12, prixCHF: 60, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "table à manger, table extensible, table de ferme" },
  { id: "chaise", label: "Chaise", volumeM3: 0.15, poidsKg: 5, manutentionMin: 2, prixCHF: 10, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "tabouret, chaise pliante, chaise de bar" },
  { id: "tv", label: "Téléviseur, écran", volumeM3: 0.15, poidsKg: 12, manutentionMin: 4, prixCHF: 20, filiereDefaut: "sens", groupe: "Séjour", exemples: "télévision, moniteur, écran d'ordinateur" },
  { id: "tapis", label: "Tapis", volumeM3: 0.15, poidsKg: 10, manutentionMin: 3, prixCHF: 15, filiereDefaut: "dechetterie", groupe: "Séjour", exemples: "carpette, descente de lit, moquette roulée" },
  { id: "piano_droit", label: "Piano droit", volumeM3: 1.0, poidsKg: 220, manutentionMin: 60, prixCHF: 350, filiereDefaut: "ressourcerie", groupe: "Séjour", exemples: "piano, harmonium, orgue électrique" },
  // Cuisine
  { id: "refrigerateur", label: "Réfrigérateur, congélateur", volumeM3: 0.7, poidsKg: 70, manutentionMin: 15, prixCHF: 80, filiereDefaut: "sens", groupe: "Cuisine", exemples: "frigo, congélateur-coffre, cave à vin" },
  { id: "lave_linge", label: "Lave-linge, lave-vaisselle, sèche-linge", volumeM3: 0.5, poidsKg: 75, manutentionMin: 15, prixCHF: 80, filiereDefaut: "sens", groupe: "Cuisine", exemples: "machine à laver, lave-vaisselle, séchoir" },
  { id: "cuisiniere", label: "Cuisinière, four", volumeM3: 0.5, poidsKg: 60, manutentionMin: 12, prixCHF: 70, filiereDefaut: "sens", groupe: "Cuisine", exemples: "four indépendant, cuisinière à gaz, plaque de cuisson" },
  { id: "petit_electro", label: "Petit électroménager (pièce)", volumeM3: 0.05, poidsKg: 8, manutentionMin: 2, prixCHF: 8, filiereDefaut: "sens", groupe: "Cuisine", exemples: "micro-ondes, aspirateur, machine à café" },
  { id: "table_cuisine", label: "Table de cuisine", volumeM3: 0.5, poidsKg: 25, manutentionMin: 8, prixCHF: 40, filiereDefaut: "ressourcerie", groupe: "Cuisine", exemples: "table de bistrot, desserte, îlot mobile" },
  { id: "vaisselle_carton", label: "Vaisselle, ustensiles (par carton)", volumeM3: 0.08, poidsKg: 12, manutentionMin: 3, prixCHF: 8, filiereDefaut: "dechetterie", groupe: "Cuisine", exemples: "assiettes, casseroles, verres" },
  // Chambre
  { id: "lit_double", label: "Lit double avec matelas", volumeM3: 1.2, poidsKg: 50, manutentionMin: 18, prixCHF: 90, filiereDefaut: "dechetterie", groupe: "Chambre", exemples: "lit 160, lit 140, sommier et matelas" },
  { id: "lit_simple", label: "Lit simple avec matelas", volumeM3: 0.8, poidsKg: 35, manutentionMin: 12, prixCHF: 60, filiereDefaut: "dechetterie", groupe: "Chambre", exemples: "lit 90, lit d'enfant, lit superposé" },
  { id: "matelas", label: "Matelas seul", volumeM3: 0.4, poidsKg: 20, manutentionMin: 5, prixCHF: 30, filiereDefaut: "dechetterie", groupe: "Chambre", exemples: "matelas, sommier seul, surmatelas" },
  { id: "armoire_3p", label: "Armoire 3 portes (démontage inclus)", volumeM3: 2.0, poidsKg: 110, manutentionMin: 35, prixCHF: 140, filiereDefaut: "dechetterie", groupe: "Chambre", exemples: "grande armoire, penderie, dressing" },
  { id: "armoire_2p", label: "Armoire 2 portes (démontage inclus)", volumeM3: 1.4, poidsKg: 80, manutentionMin: 25, prixCHF: 100, filiereDefaut: "dechetterie", groupe: "Chambre", exemples: "armoire, garde-robe, petite penderie" },
  { id: "commode", label: "Commode", volumeM3: 0.5, poidsKg: 35, manutentionMin: 8, prixCHF: 40, filiereDefaut: "ressourcerie", groupe: "Chambre", exemples: "chiffonnier, meuble à tiroirs, semainier" },
  { id: "table_nuit", label: "Table de nuit", volumeM3: 0.15, poidsKg: 10, manutentionMin: 3, prixCHF: 12, filiereDefaut: "ressourcerie", groupe: "Chambre", exemples: "chevet, table de chevet, petit caisson" },
  { id: "bureau", label: "Bureau", volumeM3: 0.6, poidsKg: 35, manutentionMin: 10, prixCHF: 45, filiereDefaut: "ressourcerie", groupe: "Chambre", exemples: "secrétaire, table de travail, bureau d'angle" },
  { id: "vetements_sac", label: "Vêtements, textiles (par sac)", volumeM3: 0.1, poidsKg: 6, manutentionMin: 2, prixCHF: 5, filiereDefaut: "ressourcerie", groupe: "Chambre", exemples: "habits, linge de maison, rideaux" },
  // Salle de bain
  { id: "meuble_sdb", label: "Meuble de salle de bain, colonne", volumeM3: 0.3, poidsKg: 20, manutentionMin: 6, prixCHF: 25, filiereDefaut: "dechetterie", groupe: "Salle de bain", exemples: "colonne, meuble sous lavabo, armoire à pharmacie" },
  { id: "miroir_cadre", label: "Miroir, cadre, tableau", volumeM3: 0.05, poidsKg: 5, manutentionMin: 2, prixCHF: 8, filiereDefaut: "ressourcerie", groupe: "Salle de bain", exemples: "miroir mural, tableau, cadre photo" },
  // Cave et extérieur
  { id: "etagere_metal", label: "Étagère métallique", volumeM3: 0.4, poidsKg: 15, manutentionMin: 6, prixCHF: 20, filiereDefaut: "dechetterie", groupe: "Cave et extérieur", exemples: "rayonnage métallique, étagère de cave, étagère de garage" },
  { id: "velo", label: "Vélo", volumeM3: 0.3, poidsKg: 15, manutentionMin: 4, prixCHF: 25, filiereDefaut: "ressourcerie", groupe: "Cave et extérieur", exemples: "bicyclette, vélo d'enfant, trottinette" },
  { id: "pneu", label: "Pneu", volumeM3: 0.1, poidsKg: 9, manutentionMin: 2, prixCHF: 10, filiereDefaut: "special", taxeUnitaireCHF: 6, groupe: "Cave et extérieur", exemples: "pneu, roue complète, jante" },
  { id: "outil_jardin", label: "Outil, mobilier de jardin (pièce)", volumeM3: 0.3, poidsKg: 12, manutentionMin: 4, prixCHF: 20, filiereDefaut: "dechetterie", groupe: "Cave et extérieur", exemples: "tondeuse, chaise de jardin, parasol" },
  { id: "bac_plante", label: "Pot, bac de plantes", volumeM3: 0.1, poidsKg: 15, manutentionMin: 3, prixCHF: 10, filiereDefaut: "dechetterie", groupe: "Cave et extérieur", exemples: "pot de fleurs, jardinière, bac à fleurs" },
  // Divers
  { id: "carton", label: "Carton ou sac divers", volumeM3: 0.1, poidsKg: 8, manutentionMin: 2, prixCHF: 5, filiereDefaut: "dechetterie", groupe: "Divers", exemples: "carton de déménagement, sac divers, caisse" },
  { id: "sac_dechets", label: "Sac de déchets 110 l", volumeM3: 0.1, poidsKg: 8, manutentionMin: 1, prixCHF: 5, filiereDefaut: "dechetterie", groupe: "Divers", exemples: "sac poubelle, sac de gravats, sac taxé" },
  { id: "peinture_chimique", label: "Peinture, solvant, produit chimique (bidon)", volumeM3: 0.02, poidsKg: 5, manutentionMin: 2, prixCHF: 8, filiereDefaut: "special", taxeUnitaireCHF: 10, groupe: "Divers", exemples: "pot de peinture, diluant, bidon d'huile" },
  { id: "gros_volume", label: "Objet volumineux non listé (par m³ estimé)", volumeM3: 1.0, poidsKg: 60, manutentionMin: 15, prixCHF: 70, filiereDefaut: "dechetterie", groupe: "Divers", exemples: "encombrant, machine, meuble hors catalogue" },
  { id: "petit_objet", label: "Petit objet non listé", volumeM3: 0.05, poidsKg: 3, manutentionMin: 1, prixCHF: 4, filiereDefaut: "dechetterie", groupe: "Divers", exemples: "bibelot, lampe, objet divers" },
];

export const GRILLE_DEFAUT_DATE = "2026-09-13T00:00:00.000Z";

/** Copie fraîche de la grille par défaut, version 1. */
export function defaultGrille(): Grille {
  return {
    version: 1,
    updatedAt: GRILLE_DEFAUT_DATE,
    params: structuredClone(PARAMS),
    catalogue: structuredClone(CATALOGUE),
  };
}
