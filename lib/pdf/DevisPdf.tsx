// PDF du devis (docs/SPEC.md §9), rendu côté serveur avec @react-pdf/renderer.
// Même contenu que components/DevisDocument.tsx, via lib/document.ts.
import { readFileSync } from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  CONDITIONS,
  SOCIETE,
  colonneVolume,
  destinataire,
  enTeteDocument,
  libelleTva,
  lignesSociete,
  objetDevis,
  sectionsDevis,
  texteDuree,
} from "../document";
import { chf } from "../format";
import type { Devis } from "../types";

const RACINE = process.cwd();
const FAMILLE = "IBM Plex Sans";

// Couleurs identiques aux tokens de app/globals.css (le PDF ne lit pas le CSS).
const C = {
  ink: "#152128",
  muted: "#5C6B73",
  line: "#D8DEE2",
  lineSoft: "#EBEFF1",
  surface2: "#F5F7F8",
  brandInk: "#00284B",
  warn: "#B7791F",
};

const mm = (n: number) => (n * 72) / 25.4;

let policesEnregistrees = false;
function enregistrerPolices() {
  if (policesEnregistrees) return;
  Font.register({
    family: FAMILLE,
    fonts: [400, 500, 600].map((poids) => ({
      src: path.join(RACINE, "lib", "pdf", "fonts", `ibm-plex-sans-latin-${poids}-normal.woff`),
      fontWeight: poids,
    })),
  });
  // Pas de césure automatique (mots français coupés au hasard sinon).
  Font.registerHyphenationCallback((mot) => [mot]);
  policesEnregistrees = true;
}

let logoEnCache: Buffer | null = null;
function logo(): Buffer {
  if (!logoEnCache) logoEnCache = readFileSync(path.join(RACINE, "lib", "pdf", "assets", "logo.png"));
  return logoEnCache;
}

const s = StyleSheet.create({
  page: {
    paddingTop: mm(18),
    paddingBottom: mm(22),
    paddingHorizontal: mm(18),
    fontFamily: FAMILLE,
    fontSize: 9,
    lineHeight: 1.4,
    color: C.ink,
  },
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  logo: { width: 82, height: 40 },
  blocTitre: { width: 220, alignItems: "flex-end" },
  titre: { fontSize: 22, lineHeight: 1.15, fontWeight: 600, textAlign: "right", marginBottom: 4 },
  meta: { color: C.muted, textAlign: "right", lineHeight: 1.4 },
  adresses: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  gras: { fontWeight: 600 },
  muted: { color: C.muted },
  objet: { backgroundColor: C.surface2, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 9, marginBottom: 14 },
  thead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 5, color: C.muted, fontSize: 8, fontWeight: 500 },
  section: { borderBottomWidth: 1, borderBottomColor: C.line, paddingTop: 11, paddingBottom: 5, fontWeight: 600, color: C.brandInk },
  ligne: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: C.lineSoft, paddingVertical: 5 },
  colDesignation: { flex: 1, paddingRight: 6 },
  colQte: { width: 30, textAlign: "right", paddingRight: 6 },
  colVolume: { width: 50, textAlign: "right", paddingRight: 6 },
  colMontant: { width: 72, textAlign: "right" },
  piece: { color: C.muted, fontSize: 8 },
  detail: { color: C.muted, fontSize: 8 },
  totaux: { marginTop: 12, marginLeft: "auto", width: 200 },
  totalLigne: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalTTC: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.2,
    borderTopColor: C.ink,
    marginTop: 4,
    paddingTop: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  duree: { marginTop: 12, color: C.muted },
  conditions: { marginTop: 14, paddingTop: 8, borderTopWidth: 0.6, borderTopColor: C.lineSoft, color: C.muted, fontSize: 7.8, lineHeight: 1.5 },
  pied: { position: "absolute", bottom: mm(9), left: mm(18), right: mm(18), flexDirection: "row", justifyContent: "space-between", color: C.muted, fontSize: 7.5 },
});

export function DevisPdf({ devis }: { devis: Devis }) {
  const snapshot = devis.snapshot;
  if (!snapshot) throw new Error("Devis sans lignes calculées");
  const { lignes, totaux } = snapshot;
  const entete = enTeteDocument(devis);
  const dest = destinataire(devis);

  return (
    <Document title={`Devis ${entete.numero}`} author={SOCIETE.nom} creator="Pro Space Devis" producer="Pro Space Devis" language="fr-CH">
      <Page size="A4" style={s.page}>
        <View style={s.entete}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas d'attribut alt */}
          <Image src={{ data: logo(), format: "png" }} style={s.logo} />
          <View style={s.blocTitre}>
            <Text style={s.titre}>Devis</Text>
            <Text style={s.meta}>N° {entete.numero}</Text>
            <Text style={s.meta}>{entete.lieuDate}</Text>
            <Text style={s.meta}>{entete.validite}</Text>
          </View>
        </View>

        <View style={s.adresses}>
          <View>
            <Text style={s.gras}>{SOCIETE.nom}</Text>
            {lignesSociete().map((l) => (
              <Text key={l}>{l}</Text>
            ))}
            <Text style={s.muted}>{SOCIETE.ide}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.gras}>{dest.titre || "Client à compléter"}</Text>
            {dest.lignes.map((l) => (
              <Text key={l}>{l}</Text>
            ))}
          </View>
        </View>

        <View style={s.objet}>
          <Text>
            <Text style={s.gras}>Objet</Text> : {objetDevis(devis)}
          </Text>
        </View>

        <View>
          <View style={s.thead} fixed>
            <Text style={s.colDesignation}>Désignation</Text>
            <Text style={s.colQte}>Qté</Text>
            <Text style={s.colVolume}>Volume</Text>
            <Text style={s.colMontant}>Montant</Text>
          </View>
          {sectionsDevis(lignes).map((section) => (
            <View key={section.section}>
              <Text style={s.section} minPresenceAhead={30}>
                {section.titre}
              </Text>
              {section.lignes.map((l, i) => (
                <View key={i} style={s.ligne} wrap={false}>
                  <View style={s.colDesignation}>
                    <Text style={l.avertissement ? { color: C.warn } : undefined}>
                      {l.designation}
                      {l.piece ? <Text style={s.piece}>{`  ${l.piece}`}</Text> : null}
                    </Text>
                    {l.detail ? <Text style={l.avertissement ? { ...s.detail, color: C.warn } : s.detail}>{l.detail}</Text> : null}
                  </View>
                  <Text style={s.colQte}>{l.quantite ?? ""}</Text>
                  <Text style={s.colVolume}>{colonneVolume(l)}</Text>
                  <Text style={s.colMontant}>{chf(l.montantCHF)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={s.totaux} wrap={false}>
          <View style={s.totalLigne}>
            <Text>Sous-total HT</Text>
            <Text>{chf(totaux.sousTotalHT)}</Text>
          </View>
          {totaux.minimumApplique ? (
            <View style={[s.totalLigne, { color: C.warn }]}>
              <Text>Minimum de facturation appliqué</Text>
              <Text>{chf(totaux.minimumHT)}</Text>
            </View>
          ) : null}
          <View style={s.totalLigne}>
            <Text>{libelleTva(totaux.tvaPct)}</Text>
            <Text>{chf(totaux.tva)}</Text>
          </View>
          <View style={s.totalTTC}>
            <Text>Total TTC</Text>
            <Text>{chf(totaux.totalTTC)}</Text>
          </View>
        </View>

        <View wrap={false}>
          <Text style={s.duree}>{texteDuree(totaux)}</Text>
          <Text style={s.conditions}>{CONDITIONS}</Text>
        </View>

        <View style={s.pied} fixed>
          <Text>
            {SOCIETE.nom} · {SOCIETE.telephone} · {SOCIETE.email}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Devis ${entete.numero} · page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderDevisPdf(devis: Devis): Promise<Buffer> {
  enregistrerPolices();
  return renderToBuffer(<DevisPdf devis={devis} />);
}
