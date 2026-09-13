"use client";

import type { ReactNode } from "react";
import { chf, dureeHumaine, nombre, ordinal } from "@/lib/format";
import { libelleDe, STATIONNEMENTS, TYPES_NETTOYAGE } from "@/lib/libelles";
import { arrondi, montantDeplacement, montantNettoyage, pctMajorationEtage, tranchesPortage } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { Devis, Grille } from "@/lib/types";
import { LIEU_DEPART, type EtatTrajet } from "@/lib/useTrajetAuto";
import { Button } from "./Button";
import { SaisieNombre } from "./inputs";

function Ligne({ titre, sous, valeur, children }: { titre: string; sous?: ReactNode; valeur: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-line-soft py-2.5 text-[13.5px]">
      <div className="flex justify-between gap-3">
        <span>
          {titre}
          {sous ? <small className="block text-[12px] font-normal text-muted">{sous}</small> : null}
        </span>
        <span className="montant text-right font-semibold">{valeur}</span>
      </div>
      {children}
    </div>
  );
}

type CalculPanelProps = {
  draft: Devis;
  grille: Grille;
  trajet: EtatTrajet & { relancer: () => void };
};

export function CalculPanel({ draft, grille, trajet: etatTrajet }: CalculPanelProps) {
  const setTrajet = useStore((s) => s.setTrajet);
  const { lieu, prestation, trajet } = draft;
  const p = grille.params;

  const pct = pctMajorationEtage(draft, grille);
  const tranches = tranchesPortage(lieu.portageM, grille);
  const portage = arrondi(tranches * p.portageSuppCHF);
  const stationnement = p.stationnement[lieu.stationnement];
  const deplacement = montantDeplacement(draft, grille);
  const avecNettoyage = prestation.type !== "debarras";
  const typeNettoyage = prestation.typeNettoyage ?? "fin_de_bail";
  const nettoyage = montantNettoyage(draft, grille);
  const adresseComplete = Boolean(lieu.rue.trim() && /^\d{4}$/.test(lieu.npa.trim()) && lieu.localite.trim());
  const saisieManuelle = trajet.source === "manuel" && (Boolean(trajet.adresse) || trajet.kmAller > 0 || trajet.minAller > 0);

  const majTrajet = (patch: { kmAller?: number; minAller?: number }) => {
    const courant = useStore.getState().draft.trajet;
    setTrajet({
      ...courant,
      ...patch,
      source: "manuel",
      libelle: courant.libelle || `${LIEU_DEPART} – ${useStore.getState().draft.lieu.localite.trim()}`,
    });
  };

  let valeurTrajet: ReactNode = "À calculer";
  let sousTrajet: ReactNode = "Renseignez rue, NPA et localité pour calculer le trajet";
  if (etatTrajet.etat === "calcul") {
    valeurTrajet = (
      <span className="inline-flex items-center gap-2 font-medium text-muted">
        <span className="ps-spinner inline-block h-3.5 w-3.5 rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
        Calcul du trajet…
      </span>
    );
    sousTrajet = `${LIEU_DEPART} – ${lieu.localite}`;
  } else if (trajet.source === "calcule") {
    valeurTrajet = `${nombre(trajet.kmAller, 0)} km, ${nombre(trajet.minAller, 0)} min`;
    sousTrajet = `${trajet.libelle}, calculé sur l'adresse`;
  } else if (saisieManuelle) {
    valeurTrajet = `${nombre(trajet.kmAller, 0)} km, ${nombre(trajet.minAller, 0)} min`;
    sousTrajet = `${trajet.libelle || LIEU_DEPART}, saisi à la main`;
  } else if (adresseComplete) {
    sousTrajet = "Le calcul démarre dans un instant";
  }

  return (
    <aside className="w-[320px] shrink-0 overflow-auto border-l border-line bg-surface-2 px-[22px] pt-[22px] pb-[30px]" aria-label="Ce que le calcul prendra en compte">
      <h3 className="mb-1.5 text-[13px] font-medium text-muted">Ce que le calcul prendra en compte</h3>

      <div aria-live="polite">
        <Ligne titre="Déplacement" sous={sousTrajet} valeur={valeurTrajet}>
          {trajet.kmAller > 0 || trajet.minAller > 0 ? (
            <p className="mt-1 text-[12px] text-muted">
              Aller-retour {nombre(2 * trajet.kmAller, 0)} km, {dureeHumaine(2 * trajet.minAller)} : <span className="montant">{chf(deplacement)}</span>
            </p>
          ) : null}
          {etatTrajet.etat === "echec" && etatTrajet.message ? (
            <p className="mt-2 rounded-rs bg-warn-soft px-2.5 py-2 text-[12.5px] text-ink" role="alert">
              {etatTrajet.message}
            </p>
          ) : null}
          {saisieManuelle && etatTrajet.etat !== "calcul" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[12px] text-muted" htmlFor="trajet-km">
                Km aller
                <SaisieNombre id="trajet-km" value={trajet.kmAller} onCommit={(n) => majTrajet({ kmAller: n ?? 0 })} entier min={0} max={400} suffixe="km" />
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-muted" htmlFor="trajet-min">
                Minutes aller
                <SaisieNombre id="trajet-min" value={trajet.minAller} onCommit={(n) => majTrajet({ minAller: n ?? 0 })} entier min={0} max={600} suffixe="min" />
              </label>
            </div>
          ) : null}
          {adresseComplete && etatTrajet.etat !== "calcul" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {trajet.source === "manuel" && trajet.adresse ? (
                <Button className="h-12 px-3 text-[13px]" onClick={etatTrajet.relancer}>
                  Relancer le calcul
                </Button>
              ) : null}
              {trajet.source === "calcule" ? (
                <Button className="h-12 px-3 text-[13px]" onClick={() => majTrajet({})}>
                  Corriger à la main
                </Button>
              ) : null}
            </div>
          ) : null}
          {!adresseComplete && !saisieManuelle ? (
            <Button className="mt-2 h-12 px-3 text-[13px]" onClick={() => majTrajet({})}>
              Saisir le trajet à la main
            </Button>
          ) : null}
        </Ligne>
      </div>

      <Ligne
        titre="Accès"
        sous={lieu.etage === 0 ? "Rez-de-chaussée" : `${ordinal(lieu.etage)} étage ${lieu.ascenseur ? "avec" : "sans"} ascenseur`}
        valeur={pct > 0 ? `+${nombre(pct, 0)} % manutention` : "Aucune majoration"}
      />
      <Ligne
        titre="Portage"
        sous={
          lieu.portageM > p.portageInclusM
            ? `${nombre(lieu.portageM, 0)} m, au-delà des ${nombre(p.portageInclusM, 0)} m inclus`
            : `${nombre(lieu.portageM, 0)} m, ${nombre(p.portageInclusM, 0)} m inclus`
        }
        valeur={tranches > 0 ? chf(portage) : "Inclus"}
      />
      <Ligne titre="Stationnement" sous={libelleDe(STATIONNEMENTS, lieu.stationnement)} valeur={stationnement > 0 ? chf(stationnement) : "Aucun forfait"} />
      {avecNettoyage ? (
        <Ligne
          titre={`Nettoyage ${libelleDe(TYPES_NETTOYAGE, typeNettoyage).toLocaleLowerCase("fr-CH")}`}
          sous={lieu.surfaceM2 ? `${nombre(lieu.surfaceM2, 0)} m² × ${chf(p.nettoyageM2[typeNettoyage])}` : "Renseignez la surface pour chiffrer"}
          valeur={lieu.surfaceM2 ? chf(nettoyage) : "À préciser"}
        />
      ) : (
        <Ligne titre="Nettoyage" sous="Non demandé dans la prestation" valeur="Non compris" />
      )}

      <p className="mt-3.5 text-[12.5px] leading-normal text-muted">
        Les prix viennent de la grille Pro Space (version {grille.version}). Les photos servent uniquement à compter et classer les objets.
      </p>
    </aside>
  );
}
