"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chf } from "@/lib/format";
import type { Categorie, Piece } from "@/lib/types";
import { Button } from "./Button";
import { inputClass } from "./Field";
import { Choix } from "./inputs";

type AjoutObjetDialogProps = {
  catalogue: Categorie[];
  pieces: Piece[];
  pieceParDefaut?: string;
  onAjouter: (objet: { categoryId: string; label: string; pieceId: string; quantite: number }) => void;
  onFermer: () => void;
};

function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function AjoutObjetDialog({ catalogue, pieces, pieceParDefaut, onAjouter, onFermer }: AjoutObjetDialogProps) {
  const [recherche, setRecherche] = useState("");
  const [choix, setChoix] = useState<string | null>(null);
  const [pieceId, setPieceId] = useState(pieceParDefaut ?? pieces[0]?.id ?? "");
  const [quantite, setQuantite] = useState(1);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    champ.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFermer]);

  const resultats = useMemo(() => {
    const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
    if (mots.length === 0) return catalogue;
    return catalogue.filter((c) => {
      const texte = normaliser(`${c.label} ${c.exemples ?? ""} ${c.groupe} ${c.id.replace(/_/g, " ")}`);
      return mots.every((m) => texte.includes(m));
    });
  }, [catalogue, recherche]);

  const categorie = catalogue.find((c) => c.id === choix);
  const optionsPieces = pieces.map((p) => ({ value: p.id, label: p.nom }));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-scrim p-6" onClick={onFermer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-ajout-objet"
        className="flex max-h-full w-full max-w-[560px] flex-col rounded-2xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titre-ajout-objet" className="mb-3 text-[18px] font-semibold">
          Ajouter un objet non détecté
        </h2>
        <label htmlFor="recherche-objet" className="mb-1 text-[12.5px] font-medium text-muted">
          Rechercher dans le catalogue
        </label>
        <input
          ref={champ}
          id="recherche-objet"
          type="search"
          className={inputClass}
          placeholder="Ex. frigo, armoire, pneu"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <ul className="mt-3 min-h-[120px] flex-1 list-none overflow-auto rounded-rs border border-line-soft p-0" aria-label="Catégories">
          {resultats.length === 0 ? (
            <li className="p-4 text-muted">
              Aucune catégorie ne correspond. Essayez un autre mot, ou choisissez « Objet volumineux non listé » ou « Petit objet non listé ».
            </li>
          ) : null}
          {resultats.map((c) => {
            const actif = c.id === choix;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setChoix(c.id)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 border-b border-line-soft px-3 py-1.5 text-left ${actif ? "bg-brand-soft text-brand" : ""}`}
                >
                  <span className="min-w-0">
                    <span className={`block ${actif ? "font-semibold" : "font-medium"}`}>{c.label}</span>
                    {c.exemples ? <span className="block truncate text-[12px] text-muted">{c.exemples}</span> : null}
                  </span>
                  <span className="montant shrink-0 text-[12.5px] text-muted">{chf(c.prixCHF)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="piece-objet" className="text-[12.5px] font-medium text-muted">
              Pièce
            </label>
            {pieces.length > 0 ? (
              <Choix id="piece-objet" value={pieceId} options={optionsPieces} onChange={setPieceId} />
            ) : (
              <p className="text-danger">Aucune pièce : ajoutez une pièce à l&apos;étape Photos.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12.5px] font-medium text-muted" id="quantite-objet">
              Quantité
            </span>
            <div className="flex h-12 items-center rounded-rs border border-line" role="group" aria-labelledby="quantite-objet">
              <button type="button" className="h-full w-12 text-[20px] text-brand disabled:opacity-40" onClick={() => setQuantite((q) => Math.max(1, q - 1))} disabled={quantite <= 1} aria-label="Diminuer la quantité">
                −
              </button>
              <span className="montant min-w-8 text-center font-semibold" aria-live="polite">
                {quantite}
              </span>
              <button type="button" className="h-full w-12 text-[20px] text-brand" onClick={() => setQuantite((q) => Math.min(999, q + 1))} aria-label="Augmenter la quantité">
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onFermer}>Annuler</Button>
          <Button
            variant="brand"
            disabled={!categorie || !pieceId}
            onClick={() => {
              if (!categorie || !pieceId) return;
              onAjouter({ categoryId: categorie.id, label: categorie.label, pieceId, quantite });
            }}
          >
            {categorie ? `Ajouter ${quantite} × ${categorie.label}` : "Choisissez une catégorie"}
          </Button>
        </div>
      </div>
    </div>
  );
}
