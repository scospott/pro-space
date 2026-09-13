// Trois devis envoyés d'exemple pour la démo (NEXT_PUBLIC_DEMO). Totaux calculés par le moteur, jamais saisis.
import { empreintePhotos } from "./hash";
import { calculerDevis, filiereParRegle } from "./pricing";
import type { Client, Devis, Etat, Grille, Lieu, Prestation, Trajet } from "./types";

type LigneExemple = [piece: string, categoryId: string, quantite: number, etat: Etat];

type ModeleExemple = {
  numero: string;
  joursAvant: number;
  heure: number;
  client: Client;
  lieu: Lieu;
  prestation: Prestation;
  trajet: Trajet;
  nettoyageInclus: boolean;
  lignes: LigneExemple[];
};

const MODELES: ModeleExemple[] = [
  {
    numero: "0410",
    joursAvant: 2,
    heure: 9,
    client: { civilite: "monsieur", prenom: "Marc", nom: "Bovet", email: "marc.bovet@gmail.com", telephone: "026 663 21 45" },
    lieu: { rue: "Rue de la Gare 12", npa: "1470", localite: "Estavayer-le-Lac", type: "cave_garage", etage: 0, ascenseur: false, portageM: 10, stationnement: "rue_libre" },
    prestation: { type: "debarras", destination: "dechetterie", dateSouhaitee: "Dès le 1er octobre", remarques: "Garder l'établi fixé au mur" },
    trajet: { kmAller: 17, minAller: 20, source: "calcule", libelle: "Payerne – Estavayer-le-Lac" },
    nettoyageInclus: false,
    lignes: [
      ["Cave", "etagere_metal", 2, "use"],
      ["Cave", "carton", 8, "use"],
      ["Garage", "velo", 2, "use"],
      ["Garage", "pneu", 4, "hs"],
      ["Garage", "outil_jardin", 3, "use"],
    ],
  },
  {
    numero: "0411",
    joursAvant: 1,
    heure: 11,
    client: { civilite: "societe", prenom: "Sophie Clerc", nom: "Régie Naef, appartement 2e", email: "sophie.clerc@naef.ch", telephone: "026 347 11 20" },
    lieu: { rue: "Rue de Romont 18", npa: "1700", localite: "Fribourg", type: "appartement", pieces: "2,5", surfaceM2: 55, etage: 2, ascenseur: true, portageM: 15, stationnement: "zone_bleue" },
    prestation: { type: "debarras_nettoyage", destination: "tri", typeNettoyage: "fin_de_bail", dateSouhaitee: "Avant l'état des lieux du 30.09.2026" },
    trajet: { kmAller: 22, minAller: 25, source: "calcule", libelle: "Payerne – Fribourg" },
    nettoyageInclus: true,
    lignes: [
      ["Salon", "canape_2p", 1, "use"],
      ["Salon", "carton", 3, "use"],
      ["Cuisine", "table_cuisine", 1, "bon"],
      ["Cuisine", "chaise", 2, "bon"],
      ["Cuisine", "lave_linge", 1, "use"],
      ["Chambre", "lit_simple", 1, "use"],
      ["Chambre", "armoire_2p", 1, "bon"],
      ["Chambre", "carton", 2, "use"],
    ],
  },
  {
    numero: "0412",
    joursAvant: 0,
    heure: 8,
    client: { civilite: "societe", prenom: "Me Laurent Chappuis", nom: "Succession Dubey", email: "l.chappuis@notaires-broye.ch", telephone: "026 660 44 10" },
    lieu: { rue: "Rue de Lausanne 45", npa: "1530", localite: "Payerne", type: "maison", pieces: "5,5", surfaceM2: 140, etage: 1, ascenseur: false, portageM: 15, stationnement: "prive" },
    prestation: { type: "debarras", destination: "ressourcerie", dateSouhaitee: "Semaine du 5 octobre", remarques: "Le piano est repris par la ressourcerie" },
    trajet: { kmAller: 2, minAller: 5, source: "calcule", libelle: "Payerne – Payerne" },
    nettoyageInclus: false,
    lignes: [
      ["Salon", "canape_angle", 1, "use"],
      ["Salon", "fauteuil", 2, "use"],
      ["Salon", "buffet", 1, "bon"],
      ["Salon", "piano_droit", 1, "bon"],
      ["Salon", "tapis", 3, "use"],
      ["Cuisine", "table_salle", 1, "bon"],
      ["Cuisine", "chaise", 6, "bon"],
      ["Cuisine", "refrigerateur", 1, "use"],
      ["Cuisine", "cuisiniere", 1, "hs"],
      ["Chambre", "lit_double", 2, "use"],
      ["Chambre", "armoire_3p", 2, "bon"],
      ["Chambre", "commode", 2, "bon"],
      ["Grenier", "carton", 25, "use"],
      ["Grenier", "vetements_sac", 10, "bon"],
    ],
  },
];

export function devisExemples(grille: Grille, maintenant: Date = new Date()): Devis[] {
  const annee = maintenant.getFullYear();
  const vide = empreintePhotos([]);
  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));

  return MODELES.map((m) => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() - m.joursAvant);
    date.setHours(m.heure, 15, 0, 0);
    const iso = date.toISOString();
    const nomsPieces = [...new Set(m.lignes.map(([piece]) => piece))];
    const pieces = nomsPieces.map((nom, i) => ({
      id: `exemple-${m.numero}-p${i + 1}`,
      nom,
      hashPhotos: vide,
      analyse: { at: iso, status: "ok" as const, hash: vide },
    }));
    const idPiece = new Map(pieces.map((p) => [p.nom, p.id]));
    const devis: Devis = {
      id: `exemple-${m.numero}`,
      numero: `${annee}-${m.numero}`,
      createdAt: iso,
      statut: "envoye",
      client: m.client,
      lieu: m.lieu,
      prestation: m.prestation,
      trajet: m.trajet,
      pieces,
      photos: [],
      inventaire: m.lignes.map(([piece, categoryId, quantite, etat], i) => ({
        id: `exemple-${m.numero}-i${i + 1}`,
        pieceId: idPiece.get(piece) ?? "",
        categoryId,
        label: categories.get(categoryId)?.label ?? categoryId,
        quantite,
        confiance: 0.92,
        etat,
        filiere: filiereParRegle(categories.get(categoryId), etat, m.prestation.destination),
        photos: [1],
        origine: "ia",
      })),
      nettoyageInclus: m.nettoyageInclus,
      exemple: true,
    };
    const { lignes, totaux } = calculerDevis(devis, grille);
    return { ...devis, snapshot: { grilleVersion: grille.version, lignes, totaux, sentAt: iso, sentTo: m.client.email } };
  }).reverse();
}
