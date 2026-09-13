"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nomClient } from "@/lib/document";
import { anneeCH, chf, dateCH } from "@/lib/format";
import { calculerDevis } from "@/lib/pricing";
import { brouillonNonVide, useStore } from "@/lib/store";
import type { Devis } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";
import { BottomBar } from "../BottomBar";
import { Button, ButtonLink } from "../Button";
import { Chargement } from "../Chargement";
import { inputClass } from "../Field";
import { useActionsDevis } from "../useActionsDevis";

function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function moisCH(iso: string): string {
  const [, mois, annee] = dateCH(iso).split(".");
  return `${annee}-${mois}`;
}

/** Nom court pour le tableau : sans civilité, raison sociale pour une société. */
function nomListe(d: Devis): string {
  if (d.client.civilite === "societe") return d.client.nom;
  return [d.client.prenom, d.client.nom].filter(Boolean).join(" ");
}

const badge = "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap";

export function EcranMesDevis() {
  const hydrated = useHydrated();
  const devis = useStore((s) => s.devis);
  const draft = useStore((s) => s.draft);
  const grille = useStore((s) => s.grille);
  const actions = useActionsDevis();
  const [recherche, setRecherche] = useState("");

  const brouillon = brouillonNonVide(draft) ? draft : null;
  const totalBrouillon = useMemo(() => (brouillon ? calculerDevis(brouillon, grille).totaux.totalTTC : 0), [brouillon, grille]);

  if (!hydrated) return <Chargement texte="Chargement des devis…" />;

  const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
  const correspond = (d: Devis) => {
    const texte = normaliser(`${d.numero} ${nomClient(d)} ${d.client.email} ${d.lieu.rue} ${d.lieu.npa} ${d.lieu.localite}`);
    return mots.every((m) => texte.includes(m));
  };
  const envoyes = [...devis].sort((a, b) => (b.snapshot?.sentAt ?? b.createdAt).localeCompare(a.snapshot?.sentAt ?? a.createdAt)).filter(correspond);
  const brouillonVisible = brouillon && correspond(brouillon) ? brouillon : null;

  const moisCourant = moisCH(new Date().toISOString());
  const duMois = devis.filter((d) => d.snapshot?.sentAt && moisCH(d.snapshot.sentAt) === moisCourant);
  const totalMois = duMois.reduce((t, d) => t + (d.snapshot?.totaux.totalTTC ?? 0), 0);
  const aucunDevis = devis.length === 0 && !brouillon;

  const cellule = "border-b border-line-soft py-2 pr-2.5 align-middle";

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-[22px]">
        {aucunDevis ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-[17px] font-semibold">Aucun devis pour le moment</h2>
            <p className="max-w-[440px] text-muted">
              Créez votre premier devis : le client et le lieu, quelques photos par pièce, et le prix est calculé par la grille Pro Space.
            </p>
            <ButtonLink href="/nouveau/client?reprise=1" variant="brand">
              Créer un devis
            </ButtonLink>
          </div>
        ) : (
          <>
            <label htmlFor="recherche-devis" className="sr-only">
              Rechercher un devis
            </label>
            <input
              id="recherche-devis"
              type="search"
              className={`${inputClass} mb-4 max-w-[360px]`}
              placeholder="Rechercher un client, une adresse, un numéro"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {envoyes.length === 0 && !brouillonVisible ? (
              <p className="text-muted">
                Aucun devis ne correspond à « {recherche} ». Vérifiez l&apos;orthographe ou cherchez par numéro, par exemple 0412.
              </p>
            ) : (
              <table className="w-full table-fixed border-collapse tabular-nums">
                <colgroup>
                  <col className="w-[88px]" />
                  <col />
                  <col className="w-[112px]" />
                  <col className="w-[88px]" />
                  <col className="w-[108px]" />
                  <col className="w-[84px]" />
                  <col className="w-[276px]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-[12.5px] text-muted">
                    <th className="border-b border-line pr-2.5 pb-2.5 font-medium">Numéro</th>
                    <th className="border-b border-line pr-2.5 pb-2.5 font-medium">Client</th>
                    <th className="border-b border-line pr-2.5 pb-2.5 font-medium">Lieu</th>
                    <th className="border-b border-line pr-2.5 pb-2.5 font-medium">Date</th>
                    <th className="border-b border-line pr-2.5 pb-2.5 text-right font-medium">Total TTC</th>
                    <th className="border-b border-line pr-2.5 pb-2.5 font-medium">Statut</th>
                    <th className="border-b border-line pb-2.5 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {brouillonVisible ? (
                    <tr data-testid="ligne-devis">
                      <td className={`${cellule} text-muted`}>À attribuer</td>
                      <td className={`${cellule} truncate`}>{nomClient(brouillonVisible) || "Client à compléter"}</td>
                      <td className={`${cellule} truncate`}>{brouillonVisible.lieu.localite}</td>
                      <td className={cellule}>{dateCH(brouillonVisible.createdAt)}</td>
                      <td className={`${cellule} montant text-right`}>{chf(totalBrouillon)}</td>
                      <td className={cellule}>
                        <span className={`${badge} bg-warn-soft text-warn`}>Brouillon</span>
                      </td>
                      <td className="border-b border-line-soft py-2 text-right">
                        <ButtonLink href="/nouveau/devis" className="px-3.5">
                          Reprendre
                        </ButtonLink>
                      </td>
                    </tr>
                  ) : null}
                  {envoyes.map((d) => (
                    <tr key={d.id} data-testid="ligne-devis">
                      <td className={`${cellule} font-medium`}>
                        <Link href={`/devis/${d.id}`} className="inline-flex h-12 items-center">
                          {d.numero}
                        </Link>
                      </td>
                      <td className={`${cellule} truncate`} title={nomClient(d)}>
                        {nomListe(d)}
                      </td>
                      <td className={`${cellule} truncate`}>{d.lieu.localite}</td>
                      <td className={cellule}>{d.snapshot?.sentAt ? dateCH(d.snapshot.sentAt) : dateCH(d.createdAt)}</td>
                      <td className={`${cellule} montant text-right`}>{chf(d.snapshot?.totaux.totalTTC ?? 0)}</td>
                      <td className={cellule}>
                        <span className="flex flex-col items-start gap-1">
                          <span className={`${badge} bg-ok-soft text-ok`}>Envoyé</span>
                          {d.exemple ? <span className={`${badge} bg-surface-2 text-muted`}>Exemple</span> : null}
                        </span>
                      </td>
                      <td className="border-b border-line-soft py-2 text-right whitespace-nowrap">
                        <span className="inline-flex gap-1">
                          <ButtonLink href={`/devis/${d.id}`} className="px-2.5">
                            Ouvrir
                          </ButtonLink>
                          <Button className="px-2.5" onClick={() => actions.renvoyer(d)}>
                            Renvoyer
                          </Button>
                          <Button className="px-2.5" onClick={() => actions.dupliquer(d)} aria-label={`Dupliquer pour corriger le devis ${d.numero}`}>
                            Dupliquer
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      <BottomBar
        left={
          duMois.length > 0
            ? `${duMois.length} devis envoyé${duMois.length > 1 ? "s" : ""} ce mois, ${chf(totalMois)} TTC`
            : `Aucun devis envoyé ce mois-ci (${anneeCH(new Date())})`
        }
      >
        <ButtonLink href="/nouveau/client?reprise=1" variant="brand">
          Nouveau devis
        </ButtonLink>
      </BottomBar>
      {actions.dialogues}
    </>
  );
}
