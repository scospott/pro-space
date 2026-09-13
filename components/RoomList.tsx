"use client";

import type { Piece } from "@/lib/types";

type RoomListProps = {
  pieces: Piece[];
  actifId: string | undefined;
  compteurs: Map<string, number>;
  onChoisir: (pieceId: string) => void;
  onAjouter: () => void;
  disabled?: boolean;
};

export function RoomList({ pieces, actifId, compteurs, onChoisir, onAjouter, disabled }: RoomListProps) {
  return (
    <nav aria-label="Pièces" className="w-[250px] shrink-0 overflow-auto border-r border-line px-3.5 py-[18px]">
      <h2 className="mx-3 mb-2.5 text-[13px] font-medium text-muted">Pièces</h2>
      {pieces.length === 0 ? <p className="mx-3 mb-2 text-[13px] text-muted">Aucune pièce. Ajoutez-en une pour prendre des photos.</p> : null}
      <ul className="m-0 list-none p-0">
        {pieces.map((p) => {
          const actif = p.id === actifId;
          const n = compteurs.get(p.id) ?? 0;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChoisir(p.id)}
                aria-current={actif ? "true" : undefined}
                className={`flex h-12 w-full items-center justify-between gap-2 rounded-rs px-3 text-left ${
                  actif ? "bg-brand-soft font-semibold text-brand" : "font-medium"
                }`}
              >
                <span className="truncate">{p.nom}</span>
                <span className="montant font-medium text-muted" aria-label={`${n} photo${n > 1 ? "s" : ""}`}>
                  {n}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onAjouter}
        disabled={disabled}
        className="mt-2 flex h-12 w-full items-center gap-2 rounded-rs px-3 font-semibold text-brand disabled:opacity-45"
      >
        <span aria-hidden="true">+</span>
        Ajouter une pièce
      </button>
    </nav>
  );
}
