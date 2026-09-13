"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { dateCH, heureCH } from "@/lib/format";
import { CIVILITES, DESTINATIONS, PRESTATIONS, STATIONNEMENTS, TYPES_LOGEMENT, TYPES_NETTOYAGE } from "@/lib/libelles";
import { deletePhotos } from "@/lib/photos";
import { flushSaisies } from "@/lib/saisie";
import { brouillonNonVide, useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useTrajetAuto } from "@/lib/useTrajetAuto";
import { erreursEtape1, NOM_COURT_CHAMP, ORDRE_CHAMPS, type ChampEtape1 } from "@/lib/validation";
import { BottomBar } from "../BottomBar";
import { Button } from "../Button";
import { CalculPanel } from "../CalculPanel";
import { Chargement } from "../Chargement";
import { ConfirmDialog } from "../ConfirmDialog";
import { DevisEnvoyeNotice } from "../DevisEnvoyeNotice";
import { Field } from "../Field";
import { Choix, SaisieNombre, SaisieTexte, SaisieZone } from "../inputs";
import { Segmented } from "../Segmented";

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="mb-[26px]" aria-labelledby={`groupe-${titre}`}>
      <h2 id={`groupe-${titre}`} className="mb-3 border-b border-line-soft pb-2 text-[15px] font-semibold">
        {titre}
      </h2>
      <div className="grid grid-cols-12 gap-x-3.5 gap-y-3">{children}</div>
    </section>
  );
}

const OUI_NON = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
] as const;

export function EcranClient({ reprise }: { reprise: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const grille = useStore((s) => s.grille);
  const enregistreAt = useStore((s) => s.ui.brouillonEnregistreAt);
  const setClient = useStore((s) => s.setClient);
  const setLieu = useStore((s) => s.setLieu);
  const setPrestation = useStore((s) => s.setPrestation);
  const resetDraft = useStore((s) => s.resetDraft);
  const [afficherErreurs, setAfficherErreurs] = useState(false);
  const [repriseTraitee, setRepriseTraitee] = useState(false);
  const trajet = useTrajetAuto(hydrated);

  const nonVide = brouillonNonVide(draft);
  const envoye = draft.statut === "envoye";

  // « Nouveau devis » depuis le rail : un devis envoyé laisse place à un brouillon neuf ; un brouillon vide ne demande rien.
  useEffect(() => {
    if (!hydrated || !reprise) return;
    if (envoye) {
      resetDraft();
      router.replace("/nouveau/client");
    } else if (!nonVide) {
      router.replace("/nouveau/client");
    }
  }, [hydrated, reprise, envoye, nonVide, resetDraft, router]);

  if (!hydrated) return <Chargement />;
  if (envoye && !reprise) return <DevisEnvoyeNotice />;

  const { client, lieu, prestation } = draft;
  const societe = client.civilite === "societe";
  const erreurs = erreursEtape1(draft);
  const champsEnErreur = ORDRE_CHAMPS.filter((k) => erreurs[k]);
  const err = (k: ChampEtape1) => (afficherErreurs ? erreurs[k] : undefined);
  const id = (k: string) => `champ-${k}`;

  const continuer = () => {
    flushSaisies();
    const e = erreursEtape1(useStore.getState().draft);
    const premier = ORDRE_CHAMPS.find((k) => e[k]);
    if (premier) {
      setAfficherErreurs(true);
      document.getElementById(id(premier))?.focus();
      return;
    }
    router.push("/nouveau/photos");
  };

  const reprendre = () => {
    setRepriseTraitee(true);
    router.replace("/nouveau/client");
  };

  const repartirDeZero = () => {
    const cles = useStore.getState().draft.photos.map((p) => p.blobKey);
    void deletePhotos(cles).catch(() => undefined);
    resetDraft();
    setAfficherErreurs(false);
    setRepriseTraitee(true);
    router.replace("/nouveau/client");
  };

  const nomBrouillon = [client.prenom, client.nom].filter(Boolean).join(" ") || "un client sans nom";

  let messageBas: ReactNode = "Les champs marqués * sont obligatoires. Le brouillon s'enregistre à chaque saisie.";
  if (champsEnErreur.length === 0) {
    messageBas = "Tous les champs obligatoires sont remplis";
  } else if (afficherErreurs) {
    const n = champsEnErreur.length;
    messageBas = (
      <span className="text-danger">
        {n > 1 ? `${n} champs à compléter` : "1 champ à compléter"} : {champsEnErreur.map((k) => NOM_COURT_CHAMP[k]).join(", ")}
      </span>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1" key={draft.id}>
        <form
          className="min-w-0 flex-1 overflow-auto px-7 pt-6 pb-8"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            continuer();
          }}
        >
          <Groupe titre="Client">
            <Field label="Civilité" htmlFor={id("civilite")} className="col-span-3">
              <Choix id={id("civilite")} value={client.civilite} options={CIVILITES} onChange={(v) => setClient({ civilite: v })} />
            </Field>
            <Field label={societe ? "Prénom du contact" : "Prénom"} htmlFor={id("prenom")} required={!societe} error={err("prenom")} className="col-span-4">
              <SaisieTexte id={id("prenom")} value={client.prenom} onCommit={(v) => setClient({ prenom: v })} autoComplete="off" invalid={Boolean(err("prenom"))} />
            </Field>
            <Field label={societe ? "Raison sociale" : "Nom"} htmlFor={id("nom")} required error={err("nom")} className="col-span-5">
              <SaisieTexte id={id("nom")} value={client.nom} onCommit={(v) => setClient({ nom: v })} autoComplete="off" invalid={Boolean(err("nom"))} />
            </Field>
            <Field label="E-mail" htmlFor={id("email")} required error={err("email")} className="col-span-7">
              <SaisieTexte
                id={id("email")}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={client.email}
                onCommit={(v) => setClient({ email: v.trim() })}
                invalid={Boolean(err("email"))}
              />
            </Field>
            <Field label="Téléphone" htmlFor={id("telephone")} error={err("telephone")} className="col-span-5">
              <SaisieTexte id={id("telephone")} type="tel" inputMode="tel" value={client.telephone} onCommit={(v) => setClient({ telephone: v })} invalid={Boolean(err("telephone"))} />
            </Field>
          </Groupe>

          <Groupe titre="Lieu de l'intervention">
            <Field label="Rue et numéro" htmlFor={id("rue")} required error={err("rue")} className="col-span-7">
              <SaisieTexte id={id("rue")} value={lieu.rue} onCommit={(v) => setLieu({ rue: v })} autoComplete="off" invalid={Boolean(err("rue"))} />
            </Field>
            <Field label="NPA" htmlFor={id("npa")} required error={err("npa")} className="col-span-2">
              <SaisieTexte id={id("npa")} inputMode="numeric" maxLength={4} value={lieu.npa} onCommit={(v) => setLieu({ npa: v.trim() })} invalid={Boolean(err("npa"))} />
            </Field>
            <Field label="Localité" htmlFor={id("localite")} required error={err("localite")} className="col-span-3">
              <SaisieTexte id={id("localite")} value={lieu.localite} onCommit={(v) => setLieu({ localite: v })} autoComplete="off" invalid={Boolean(err("localite"))} />
            </Field>
            <Field label="Type" htmlFor={id("type")} className="col-span-4">
              <Choix id={id("type")} value={lieu.type} options={TYPES_LOGEMENT} onChange={(v) => setLieu({ type: v })} />
            </Field>
            <Field label="Pièces" htmlFor={id("pieces")} className="col-span-2">
              <SaisieTexte id={id("pieces")} inputMode="decimal" placeholder="3,5" value={lieu.pieces ?? ""} onCommit={(v) => setLieu({ pieces: v.trim() })} />
            </Field>
            <Field label="Surface" htmlFor={id("surfaceM2")} error={err("surfaceM2")} className="col-span-3">
              <SaisieNombre id={id("surfaceM2")} value={lieu.surfaceM2} onCommit={(n) => setLieu({ surfaceM2: n })} videPermis min={1} max={5000} suffixe="m²" invalid={Boolean(err("surfaceM2"))} />
            </Field>
            <Field label="Étage (0 = rez)" htmlFor={id("etage")} required error={err("etage")} className="col-span-3">
              <SaisieNombre id={id("etage")} value={lieu.etage} onCommit={(n) => setLieu({ etage: n ?? 0 })} entier min={0} max={40} invalid={Boolean(err("etage"))} />
            </Field>
            <Field label="Ascenseur" htmlFor={id("ascenseur")} required className="col-span-4">
              <Segmented id={id("ascenseur")} ariaLabel="Ascenseur" options={OUI_NON} value={lieu.ascenseur ? "oui" : "non"} onChange={(v) => setLieu({ ascenseur: v === "oui" })} />
            </Field>
            <Field label="Portage entre le camion et l'entrée" htmlFor={id("portageM")} error={err("portageM")} className="col-span-8">
              <SaisieNombre id={id("portageM")} value={lieu.portageM} onCommit={(n) => setLieu({ portageM: n ?? 0 })} min={0} max={500} suffixe="m" invalid={Boolean(err("portageM"))} />
            </Field>
            <Field label="Stationnement" htmlFor={id("stationnement")} required className="col-span-12">
              <Choix id={id("stationnement")} value={lieu.stationnement} options={STATIONNEMENTS} onChange={(v) => setLieu({ stationnement: v })} />
            </Field>
          </Groupe>

          <Groupe titre="Prestation">
            <Field label="Type" htmlFor={id("prestation")} required className="col-span-12">
              <Segmented id={id("prestation")} ariaLabel="Type de prestation" options={PRESTATIONS} value={prestation.type} onChange={(v) => setPrestation({ type: v })} />
            </Field>
            <Field label="Destination des objets" htmlFor={id("destination")} required className="col-span-12">
              <Segmented id={id("destination")} ariaLabel="Destination des objets" options={DESTINATIONS} value={prestation.destination} onChange={(v) => setPrestation({ destination: v })} />
            </Field>
            {prestation.type !== "debarras" ? (
              <Field label="Type de nettoyage" htmlFor={id("typeNettoyage")} className="col-span-12">
                <Segmented
                  id={id("typeNettoyage")}
                  ariaLabel="Type de nettoyage"
                  options={TYPES_NETTOYAGE}
                  value={prestation.typeNettoyage ?? "fin_de_bail"}
                  onChange={(v) => setPrestation({ typeNettoyage: v })}
                />
              </Field>
            ) : null}
            <Field label="Date souhaitée" htmlFor={id("date")} className="col-span-5">
              <SaisieTexte id={id("date")} placeholder="Semaine du 21.09.2026" value={prestation.dateSouhaitee ?? ""} onCommit={(v) => setPrestation({ dateSouhaitee: v })} />
            </Field>
            <Field label="Remarques pour le devis" htmlFor={id("remarques")} hint="Transmises à l'analyse des photos, par exemple : conserver le piano." className="col-span-12">
              <SaisieZone id={id("remarques")} value={prestation.remarques ?? ""} onCommit={(v) => setPrestation({ remarques: v })} />
            </Field>
          </Groupe>
          {/* Touche Entrée ou « OK » du clavier de la tablette : même effet que le bouton de la barre basse. */}
          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
            Valider
          </button>
        </form>
        <CalculPanel draft={draft} grille={grille} trajet={trajet} />
      </div>
      <BottomBar left={messageBas}>
        <Button variant="brand" onClick={continuer}>
          Continuer vers les photos
        </Button>
      </BottomBar>

      <ConfirmDialog
        open={reprise && !repriseTraitee && nonVide}
        title="Reprendre le brouillon ?"
        confirmLabel="Reprendre le brouillon"
        cancelLabel="Repartir de zéro"
        onConfirm={reprendre}
        onCancel={repartirDeZero}
        onDismiss={reprendre}
      >
        <p>
          Un devis pour {nomBrouillon}
          {lieu.localite ? ` à ${lieu.localite}` : ""} est en cours
          {enregistreAt ? `, enregistré le ${dateCH(enregistreAt)} à ${heureCH(enregistreAt)}` : ""}.
        </p>
        <p className="mt-2">Repartir de zéro efface ce brouillon, ses photos et son inventaire.</p>
      </ConfirmDialog>
    </>
  );
}
