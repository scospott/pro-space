"use client";

import { useState } from "react";
import { photosParPiece } from "@/lib/analyse";
import { chf, nombre } from "@/lib/format";
import { FILIERES_CHOIX, libelleDe, TYPES_NETTOYAGE } from "@/lib/libelles";
import { filiereEffective } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { Devis, Grille, InventaireItem } from "@/lib/types";
import { AjoutObjetDialog } from "./AjoutObjetDialog";
import { Choix, SaisieNombre } from "./inputs";
import { Segmented } from "./Segmented";
import { useToast } from "./Toast";
import { Toggle } from "./Toggle";

function Confiance({ confiance }: { confiance: number | null }) {
  const point = "h-[7px] w-[7px] shrink-0 rounded-full";
  if (confiance === null) {
    return (
      <span className="inline-flex items-center gap-[5px] text-[11.5px] text-muted">
        <span className={`${point} bg-muted`} aria-hidden="true" />
        Ajouté à la main
      </span>
    );
  }
  const pct = Math.round(confiance * 100);
  const sur = confiance >= 0.85;
  return (
    <span className={`inline-flex items-center gap-[5px] text-[11.5px] ${sur ? "text-ok" : "text-warn"}`}>
      <span className={`${point} ${sur ? "bg-ok" : "bg-warn"}`} aria-hidden="true" />
      {sur ? "Sûr" : "À vérifier"}, {pct} %
    </span>
  );
}

const OPTIONS_REMISE = [
  { value: "pct", label: "%" },
  { value: "chf", label: "CHF" },
] as const;

type InventoryPanelProps = { draft: Devis; grille: Grille };

export function InventoryPanel({ draft, grille }: InventoryPanelProps) {
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const addItem = useStore((s) => s.addItem);
  const setNettoyageInclus = useStore((s) => s.setNettoyageInclus);
  const setRemise = useStore((s) => s.setRemise);
  const setLieu = useStore((s) => s.setLieu);
  const toast = useToast((s) => s.show);
  const [ajout, setAjout] = useState(false);

  const categories = new Map(grille.catalogue.map((c) => [c.id, c]));
  const compteurs = photosParPiece(draft);
  const destination = draft.prestation.destination;
  const pieces = draft.pieces.filter((p) => draft.inventaire.some((it) => it.pieceId === p.id) || p.analyse?.status === "ok");
  const typeNettoyage = draft.prestation.typeNettoyage ?? "fin_de_bail";
  const surface = draft.lieu.surfaceM2;
  const remise = draft.remise;

  const ligne = (item: InventaireItem, nomPiece: string) => {
    const categorie = categories.get(item.categoryId);
    const titre = categorie?.label ?? item.label;
    const special = categorie?.filiereDefaut === "special";
    const filiere = filiereEffective(item, categorie, destination);
    return (
      <li key={item.id} className="border-b border-line-soft py-2 pr-2 pl-5" data-testid="ligne-inventaire">
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1 pt-1">
            <b className="block truncate font-medium">{titre}</b>
            <Confiance confiance={item.confiance} />
            {categorie && item.label !== categorie.label && item.label !== item.categoryId ? <span className="block truncate text-[12px] text-muted">{item.label}</span> : null}
            {!categorie ? <span className="block text-[12px] text-warn">Catégorie supprimée de la grille : retirez cette ligne.</span> : null}
            {item.note ? <span className="block text-[12px] text-warn">{item.note}</span> : null}
          </div>
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] text-muted"
            aria-label={`Retirer ${titre} (${nomPiece})`}
            onClick={() => removeItem(item.id)}
          >
            ×
          </button>
        </div>
        <div className="mt-1 flex items-center gap-2 pr-3">
          <div className="flex h-12 shrink-0 items-center rounded-rs border border-line" role="group" aria-label={`Quantité de ${titre}`}>
            <button
              type="button"
              className="h-full w-12 text-[20px] text-brand disabled:opacity-35"
              disabled={item.quantite <= 1}
              onClick={() => updateItem(item.id, { quantite: item.quantite - 1 })}
              aria-label={`Diminuer la quantité de ${titre}`}
            >
              −
            </button>
            <span className="montant min-w-7 text-center font-semibold" data-testid="quantite">
              {item.quantite}
            </span>
            <button
              type="button"
              className="h-full w-12 text-[20px] text-brand"
              onClick={() => updateItem(item.id, { quantite: item.quantite + 1 })}
              aria-label={`Augmenter la quantité de ${titre}`}
            >
              +
            </button>
          </div>
          {special ? (
            <span className="text-[12.5px] leading-tight text-muted">Taxe spéciale, {chf(categorie?.taxeUnitaireCHF ?? 0)} / unité</span>
          ) : (
            <div className="min-w-0 flex-1">
              <Choix
                ariaLabel={`Filière de ${titre}`}
                value={filiere === "special" ? "dechetterie" : filiere}
                options={FILIERES_CHOIX}
                onChange={(v) => updateItem(item.id, { filiere: v, filiereManuelle: true })}
              />
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-surface" aria-label="Inventaire détecté">
      <div className="border-b border-line-soft px-5 pt-[18px] pb-3">
        <h2 className="m-0 text-[15px] font-semibold">Inventaire détecté</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {draft.inventaire.length > 0
            ? `${draft.inventaire.length} ligne${draft.inventaire.length > 1 ? "s" : ""} sur ${draft.photos.length} photo${draft.photos.length > 1 ? "s" : ""}. Corrigez, le devis se recalcule.`
            : "Aucun objet pour le moment. Générez le devis depuis les photos ou ajoutez un objet à la main."}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pt-1 pb-4">
        {pieces.map((piece) => {
          const items = draft.inventaire.filter((it) => it.pieceId === piece.id);
          const n = compteurs.get(piece.id) ?? 0;
          return (
            <section key={piece.id} aria-label={piece.nom}>
              <h3 className="mx-5 mt-3.5 mb-1 flex justify-between text-[12.5px] font-medium text-muted">
                <span>{piece.nom}</span>
                <span>{n > 0 ? `${n} photo${n > 1 ? "s" : ""}` : ""}</span>
              </h3>
              {items.length === 0 ? <p className="mx-5 py-2 text-[12.5px] text-muted">Aucun objet détecté dans cette pièce.</p> : null}
              <ul className="m-0 list-none p-0">{items.map((it) => ligne(it, piece.nom))}</ul>
            </section>
          );
        })}
        <button type="button" className="mx-3 mt-3 flex h-12 items-center gap-2 rounded-rs px-2 font-semibold text-brand" onClick={() => setAjout(true)}>
          <span aria-hidden="true">+</span> Ajouter un objet non détecté
        </button>
      </div>

      <div className="border-t border-line-soft px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="option-nettoyage" className="flex flex-col font-medium">
            Nettoyage {libelleDe(TYPES_NETTOYAGE, typeNettoyage).toLocaleLowerCase("fr-CH")}
            <small className="text-[12px] font-normal text-muted">
              {surface ? `${nombre(surface, 0)} m² × ${chf(grille.params.nettoyageM2[typeNettoyage])}` : "Surface à renseigner pour chiffrer"}
            </small>
          </label>
          <Toggle id="option-nettoyage" checked={draft.nettoyageInclus} onChange={setNettoyageInclus} label="Inclure le nettoyage" />
        </div>
        {draft.nettoyageInclus && !surface ? (
          <div className="mt-1 flex items-center gap-2">
            <label htmlFor="surface-panneau" className="text-[12.5px] text-muted">
              Surface
            </label>
            <div className="w-[130px]">
              <SaisieNombre id="surface-panneau" value={surface} onCommit={(n) => setLieu({ surfaceM2: n })} videPermis min={1} max={5000} suffixe="m²" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-5 py-2.5">
        <label htmlFor="remise-valeur" className="font-medium">
          Remise
        </label>
        <div className="flex items-center gap-2">
          <div className="w-[104px]">
            <Segmented
              size="sm"
              ariaLabel="Type de remise"
              options={OPTIONS_REMISE}
              value={remise?.type ?? "pct"}
              onChange={(t) => setRemise({ type: t, valeur: remise?.valeur ?? 0 })}
            />
          </div>
          <div className="w-[104px]">
            <SaisieNombre
              id="remise-valeur"
              value={remise && remise.valeur > 0 ? remise.valeur : undefined}
              onCommit={(n) => setRemise({ type: useStore.getState().draft.remise?.type ?? "pct", valeur: n ?? 0 })}
              videPermis
              min={0}
              max={remise?.type === "chf" ? 100000 : 100}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {ajout ? (
        <AjoutObjetDialog
          catalogue={grille.catalogue}
          pieces={draft.pieces}
          pieceParDefaut={pieces[0]?.id}
          onFermer={() => setAjout(false)}
          onAjouter={(objet) => {
            addItem(objet);
            setAjout(false);
            toast(`${objet.quantite} × ${objet.label} ajouté${objet.quantite > 1 ? "s" : ""}`);
          }}
        />
      ) : null}
    </aside>
  );
}
