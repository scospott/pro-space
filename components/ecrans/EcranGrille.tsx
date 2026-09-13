"use client";

import { useMemo, useState } from "react";
import { dateCH } from "@/lib/format";
import {
  SECTIONS_PARAMS,
  cleErreurCategorie,
  cleErreurParam,
  depuisFormulaire,
  nouvelleLigne,
  versFormulaire,
  type ChampCategorie,
  type FormulaireGrille,
  type LigneCategorie,
} from "@/lib/grilleForm";
import { FILIERES_DEFAUT, GROUPES } from "@/lib/libelles";
import { useStore } from "@/lib/store";
import type { Grille } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";
import { BottomBar } from "../BottomBar";
import { Button } from "../Button";
import { Chargement } from "../Chargement";
import { ConfirmDialog } from "../ConfirmDialog";
import { inputClass } from "../Field";
import { Choix } from "../inputs";
import { useToast } from "../Toast";

const petitInput = `${inputClass} montant px-2 text-right`;

type Ajout = { groupe: string; label: string; exemples: string } | null;

function Formulaire({ grille, onAnnuler }: { grille: Grille; onAnnuler: () => void }) {
  const saveGrille = useStore((s) => s.saveGrille);
  const resetGrille = useStore((s) => s.resetGrille);
  const inventaire = useStore((s) => s.draft.inventaire);
  const toast = useToast((s) => s.show);
  const initial = useMemo(() => versFormulaire(grille), [grille]);
  const [form, setForm] = useState<FormulaireGrille>(initial);
  const [ajout, setAjout] = useState<Ajout>(null);
  const [aSupprimer, setASupprimer] = useState<LigneCategorie | null>(null);
  const [reinitialiser, setReinitialiser] = useState(false);

  const { grille: valide, erreurs } = depuisFormulaire(form, grille);
  const nbErreurs = Object.keys(erreurs).length;
  const modifie = JSON.stringify(form) !== JSON.stringify(initial);

  const groupes = [...GROUPES, ...[...new Set(form.catalogue.map((c) => c.groupe))].filter((g) => !GROUPES.some((x) => x === g))];

  const majParam = (cle: keyof FormulaireGrille["params"], valeur: string) => setForm((f) => ({ ...f, params: { ...f.params, [cle]: valeur } }));
  const majLigne = (id: string, patch: Partial<LigneCategorie>) =>
    setForm((f) => ({ ...f, catalogue: f.catalogue.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const enregistrer = () => {
    if (!valide || !modifie) return;
    const version = saveGrille(valide);
    toast(`Grille enregistrée (version ${version})`);
  };

  const demanderSuppression = (ligne: LigneCategorie) => {
    const utilisees = inventaire.filter((it) => it.categoryId === ligne.id).length;
    if (utilisees > 0) {
      toast(`« ${ligne.label} » est utilisée dans le devis en cours (${utilisees} ligne${utilisees > 1 ? "s" : ""}) : retirez ces lignes avant de la supprimer.`);
      return;
    }
    setASupprimer(ligne);
  };

  const champCategorie = (ligne: LigneCategorie, champ: Exclude<ChampCategorie, "label">, libelle: string, disabled = false) => {
    const erreur = erreurs[cleErreurCategorie(ligne.id, champ)];
    return (
      <td className="border-b border-line-soft py-1.5 pr-2 align-top">
        <input
          id={`cat-${ligne.id}-${champ}`}
          inputMode="decimal"
          className={petitInput}
          value={disabled ? "" : ligne[champ]}
          placeholder={disabled ? "—" : undefined}
          disabled={disabled}
          aria-label={`${libelle}, ${ligne.label || "nouvelle catégorie"}`}
          aria-invalid={Boolean(erreur) || undefined}
          onChange={(e) => majLigne(ligne.id, { [champ]: e.target.value })}
        />
        {erreur ? <span className="mt-0.5 block text-[11.5px] leading-tight text-danger">{erreur}</span> : null}
      </td>
    );
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto px-7 py-[22px]">
        <p className="mb-5 rounded-rs bg-brand-soft px-3.5 py-2.5 text-brand-ink">
          Une modification s&apos;applique aux futurs devis, pas à ceux déjà envoyés. Ces valeurs sont celles du calcul : l&apos;IA ne voit jamais les prix.
        </p>

        <section aria-labelledby="titre-parametres" className="mb-8">
          <h2 id="titre-parametres" className="mb-2 border-b border-line-soft pb-2 text-[15px] font-semibold">
            Paramètres
          </h2>
          <div className="grid grid-cols-2 gap-x-8">
            {SECTIONS_PARAMS.map((section) => (
              <div key={section.titre} className="mb-3 break-inside-avoid">
                <h3 className="mt-3 mb-1 text-[13px] font-medium text-muted">{section.titre}</h3>
                {section.params.map((def) => {
                  const erreur = erreurs[cleErreurParam(def.cle)];
                  const id = `param-${def.cle.replace(".", "-")}`;
                  return (
                    <div key={def.cle} className="flex items-center justify-between gap-3 border-b border-line-soft py-2">
                      <label htmlFor={id} className="min-w-0 text-[13.5px]">
                        <span className="block">{def.libelle}</span>
                        <small className="block text-[12px] text-muted">{def.aide}</small>
                        {erreur ? (
                          <small id={`${id}-erreur`} className="block text-[12px] text-danger">
                            {erreur}
                          </small>
                        ) : null}
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          id={id}
                          inputMode="decimal"
                          className={`${petitInput} w-[96px]!`}
                          value={form.params[def.cle]}
                          aria-invalid={Boolean(erreur) || undefined}
                          aria-describedby={erreur ? `${id}-erreur` : undefined}
                          onChange={(e) => majParam(def.cle, e.target.value)}
                        />
                        <span className="w-[76px] text-[12.5px] whitespace-nowrap text-muted">{def.unite}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="titre-catalogue">
          <h2 id="titre-catalogue" className="mb-2 border-b border-line-soft pb-2 text-[15px] font-semibold">
            Catalogue d&apos;objets
          </h2>
          <p className="mb-2 text-[12.5px] text-muted">
            Volume de transport, poids estimé, minutes de manutention à deux, prix HT par unité et filière par défaut. La taxe unitaire ne s&apos;applique qu&apos;à la filière
            « Taxe spéciale ».
          </p>
          {groupes.map((groupe) => {
            const lignes = form.catalogue.filter((l) => l.groupe === groupe);
            return (
              <div key={groupe} className="mb-5">
                <h3 className="mt-4 mb-1 text-[13px] font-semibold text-brand-ink">{groupe}</h3>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col />
                    <col className="w-[74px]" />
                    <col className="w-[70px]" />
                    <col className="w-[70px]" />
                    <col className="w-[84px]" />
                    <col className="w-[176px]" />
                    <col className="w-[74px]" />
                    <col className="w-[52px]" />
                  </colgroup>
                  <thead>
                    <tr className="text-left text-[12px] text-muted">
                      <th className="border-b border-line pr-2 pb-1.5 font-medium">Catégorie</th>
                      <th className="border-b border-line pr-2 pb-1.5 text-right font-medium">m³</th>
                      <th className="border-b border-line pr-2 pb-1.5 text-right font-medium">kg</th>
                      <th className="border-b border-line pr-2 pb-1.5 text-right font-medium">min</th>
                      <th className="border-b border-line pr-2 pb-1.5 text-right font-medium">CHF</th>
                      <th className="border-b border-line pr-2 pb-1.5 font-medium">Filière par défaut</th>
                      <th className="border-b border-line pr-2 pb-1.5 text-right font-medium">Taxe CHF</th>
                      <th className="border-b border-line pb-1.5">
                        <span className="sr-only">Supprimer</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((ligne) => {
                      const erreurLibelle = erreurs[cleErreurCategorie(ligne.id, "label")];
                      return (
                        <tr key={ligne.id} data-testid={`categorie-${ligne.id}`}>
                          <td className="border-b border-line-soft py-1.5 pr-2 align-top">
                            <input
                              id={`cat-${ligne.id}-label`}
                              className={`${inputClass} px-2 font-medium`}
                              value={ligne.label}
                              aria-label={`Libellé de la catégorie ${ligne.id}`}
                              aria-invalid={Boolean(erreurLibelle) || undefined}
                              onChange={(e) => majLigne(ligne.id, { label: e.target.value })}
                            />
                            {erreurLibelle ? <span className="mt-0.5 block text-[11.5px] text-danger">{erreurLibelle}</span> : null}
                          </td>
                          {champCategorie(ligne, "volumeM3", "Volume m³")}
                          {champCategorie(ligne, "poidsKg", "Poids kg")}
                          {champCategorie(ligne, "manutentionMin", "Manutention en minutes")}
                          {champCategorie(ligne, "prixCHF", "Prix CHF")}
                          <td className="border-b border-line-soft py-1.5 pr-2 align-top">
                            <Choix
                              ariaLabel={`Filière par défaut, ${ligne.label}`}
                              value={ligne.filiereDefaut}
                              options={FILIERES_DEFAUT}
                              onChange={(v) => majLigne(ligne.id, { filiereDefaut: v })}
                            />
                          </td>
                          {champCategorie(ligne, "taxeUnitaireCHF", "Taxe unitaire CHF", ligne.filiereDefaut !== "special")}
                          <td className="border-b border-line-soft py-1.5 text-right align-top">
                            <button
                              type="button"
                              className="h-12 w-12 rounded-full text-[18px] text-muted"
                              aria-label={`Supprimer la catégorie ${ligne.label}`}
                              onClick={() => demanderSuppression(ligne)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="mt-1 flex h-12 items-center gap-2 rounded-rs px-1 font-semibold text-brand" onClick={() => setAjout({ groupe, label: "", exemples: "" })}>
                  <span aria-hidden="true">+</span> Ajouter une catégorie à « {groupe} »
                </button>
              </div>
            );
          })}
        </section>
      </div>

      <BottomBar
        left={
          nbErreurs > 0 ? (
            <span className="text-danger">
              {nbErreurs > 1 ? `${nbErreurs} valeurs à corriger` : "1 valeur à corriger"} avant d&apos;enregistrer
            </span>
          ) : modifie ? (
            "Modifications non enregistrées"
          ) : (
            `Version ${grille.version}, modifiée le ${dateCH(grille.updatedAt)}`
          )
        }
      >
        <Button onClick={() => setReinitialiser(true)}>Réinitialiser aux valeurs par défaut</Button>
        <Button onClick={onAnnuler} disabled={!modifie}>
          Annuler
        </Button>
        <Button variant="brand" onClick={enregistrer} disabled={!modifie || nbErreurs > 0}>
          Enregistrer la grille
        </Button>
      </BottomBar>

      <ConfirmDialog
        open={ajout !== null}
        title={`Nouvelle catégorie dans « ${ajout?.groupe ?? ""} »`}
        confirmLabel="Ajouter la catégorie"
        confirmDisabled={!ajout?.label.trim()}
        onCancel={() => setAjout(null)}
        onConfirm={() => {
          if (!ajout?.label.trim()) return;
          const ligne = nouvelleLigne(ajout.label, ajout.groupe, ajout.exemples, form.catalogue.map((c) => c.id));
          setForm((f) => ({ ...f, catalogue: [...f.catalogue, ligne] }));
          setAjout(null);
          toast(`Catégorie « ${ligne.label} » ajoutée (identifiant ${ligne.id}) : complétez ses valeurs puis enregistrez`);
        }}
      >
        {ajout ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="ajout-libelle" className="text-[12.5px] font-medium">
              Libellé
            </label>
            <input id="ajout-libelle" className={inputClass} value={ajout.label} maxLength={80} onChange={(e) => setAjout({ ...ajout, label: e.target.value })} />
            <label htmlFor="ajout-exemples" className="mt-1 text-[12.5px] font-medium">
              Exemples, pour aider la reconnaissance
            </label>
            <input
              id="ajout-exemples"
              className={inputClass}
              placeholder="spa gonflable, piscine hors-sol"
              value={ajout.exemples}
              maxLength={200}
              onChange={(e) => setAjout({ ...ajout, exemples: e.target.value })}
            />
            <p className="text-[12.5px]">Valeurs de départ : 0.1 m³, 5 kg, 2 min, CHF 5.00, déchetterie. Ajustez-les dans le tableau.</p>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={aSupprimer !== null}
        title={`Supprimer « ${aSupprimer?.label ?? ""} » ?`}
        confirmLabel="Supprimer la catégorie"
        confirmVariant="danger"
        onCancel={() => setASupprimer(null)}
        onConfirm={() => {
          if (aSupprimer) setForm((f) => ({ ...f, catalogue: f.catalogue.filter((l) => l.id !== aSupprimer.id) }));
          setASupprimer(null);
        }}
      >
        <p>L&apos;analyse ne pourra plus classer d&apos;objet dans cette catégorie. La suppression sera effective à l&apos;enregistrement de la grille.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={reinitialiser}
        title="Réinitialiser la grille ?"
        confirmLabel="Réinitialiser"
        confirmVariant="danger"
        onCancel={() => setReinitialiser(false)}
        onConfirm={() => {
          const version = resetGrille();
          setReinitialiser(false);
          toast(`Grille réinitialisée aux valeurs par défaut (version ${version})`);
        }}
      >
        <p>Tous les paramètres et le catalogue reprennent les valeurs d&apos;origine, catégories ajoutées comprises. Les devis déjà envoyés ne changent pas.</p>
      </ConfirmDialog>
    </>
  );
}

export function EcranGrille() {
  const hydrated = useHydrated();
  const grille = useStore((s) => s.grille);
  const [annulations, setAnnulations] = useState(0);
  if (!hydrated) return <Chargement texte="Chargement de la grille…" />;
  return <Formulaire key={`${grille.version}-${grille.updatedAt}-${annulations}`} grille={grille} onAnnuler={() => setAnnulations((n) => n + 1)} />;
}
