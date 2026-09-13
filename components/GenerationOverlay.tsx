"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyserPiece } from "@/lib/generation";
import { useStore } from "@/lib/store";
import { Button } from "./Button";

type Statut = "attente" | "cours" | "ok" | "echec";
type EtatLigne = { statut: Statut; message?: string };

type GenerationOverlayProps = {
  /** Pièces à analyser (une requête par pièce, en parallèle). */
  pieceIds: string[];
  /** Pièces sans photo dont l'analyse précédente est à oublier. */
  oublier: string[];
  onTermine: () => void;
  onFermer: () => void;
};

function Pastille({ statut }: { statut: Statut }) {
  if (statut === "cours") {
    return (
      <i
        className="ps-spinner inline-flex h-[22px] w-[22px] shrink-0 rounded-full border-[1.5px] border-brand border-t-transparent"
        aria-hidden="true"
      />
    );
  }
  if (statut === "ok") {
    return (
      <i className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ok text-[12px] text-white not-italic" aria-hidden="true">
        ✓
      </i>
    );
  }
  if (statut === "echec") {
    return (
      <i className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-danger text-[12px] font-semibold text-white not-italic" aria-hidden="true">
        !
      </i>
    );
  }
  return <i className="inline-flex h-[22px] w-[22px] shrink-0 rounded-full border-[1.5px] border-line" aria-hidden="true" />;
}

const LIBELLE_STATUT: Record<Statut, string> = { attente: "en attente", cours: "en cours", ok: "terminé", echec: "échec" };

export function GenerationOverlay({ pieceIds, oublier, onTermine, onFermer }: GenerationOverlayProps) {
  const pieces = useStore((s) => s.draft.pieces);
  const photos = useStore((s) => s.draft.photos);
  const inventaireVide = useStore((s) => s.draft.inventaire.length === 0);
  const setInventaire = useStore((s) => s.setInventaire);
  const setAnalyseErreur = useStore((s) => s.setAnalyseErreur);
  const oublierAnalyse = useStore((s) => s.oublierAnalyse);

  const [etats, setEtats] = useState<Record<string, EtatLigne>>(() =>
    Object.fromEntries(pieceIds.map((id) => [id, { statut: "cours" as Statut }])),
  );
  const [calcul, setCalcul] = useState<Statut>("attente");
  const [secondes, setSecondes] = useState(0);
  const lance = useRef(false);
  const termineRef = useRef(onTermine);
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    termineRef.current = onTermine;
  }, [onTermine]);

  const analyser = useCallback(
    async (pieceId: string) => {
      try {
        const { items, remarques } = await analyserPiece(pieceId);
        setInventaire(pieceId, items, remarques);
        setEtats((e) => ({ ...e, [pieceId]: { statut: "ok" } }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inattendue pendant l'analyse.";
        setAnalyseErreur(pieceId, message);
        setEtats((e) => ({ ...e, [pieceId]: { statut: "echec", message } }));
      }
    },
    [setInventaire, setAnalyseErreur],
  );

  // Lancement unique (le double montage du mode strict ne relance pas les requêtes).
  useEffect(() => {
    if (lance.current) return;
    lance.current = true;
    for (const id of oublier) oublierAnalyse(id);
    void Promise.allSettled(pieceIds.map((id) => analyser(id)));
    panneau.current?.focus();
  }, [analyser, oublier, oublierAnalyse, pieceIds]);

  const toutesOk = pieceIds.every((id) => etats[id]?.statut === "ok");
  const enCours = pieceIds.some((id) => etats[id]?.statut === "cours");
  const echecs = pieceIds.filter((id) => etats[id]?.statut === "echec");

  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  // Toutes les pièces sont analysées : étape de calcul (instantanée, le moteur est local), puis devis.
  useEffect(() => {
    if (!toutesOk) return;
    const t1 = setTimeout(() => setCalcul("cours"), 200);
    const t2 = setTimeout(() => setCalcul("ok"), 700);
    const t3 = setTimeout(() => termineRef.current(), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [toutesOk]);

  const relancer = (pieceId: string) => {
    setSecondes(0);
    setEtats((e) => ({ ...e, [pieceId]: { statut: "cours" } }));
    void analyser(pieceId);
  };

  const nom = (id: string) => pieces.find((p) => p.id === id)?.nom ?? "Pièce";
  const nbPhotos = (id: string) => photos.filter((p) => p.pieceId === id).length;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-scrim p-6">
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-generation"
        tabIndex={-1}
        className="max-h-full w-full max-w-[480px] overflow-auto rounded-2xl bg-surface px-[30px] py-7 shadow-xl"
      >
        <h2 id="titre-generation" className="mb-1 text-[18px] font-semibold">
          Génération du devis
        </h2>
        <p className="mb-4 text-muted" aria-live="polite">
          {enCours
            ? secondes >= 25
              ? `L'analyse prend plus de temps que d'habitude (${secondes} s). Elle continue, gardez cette page ouverte.`
              : `Une trentaine de secondes, selon le nombre de photos${secondes > 0 ? ` (${secondes} s)` : ""}.`
            : echecs.length > 0
              ? "Certaines pièces n'ont pas pu être analysées. Les autres sont enregistrées."
              : "Analyse terminée."}
        </p>

        <ul className="m-0 list-none p-0" aria-live="polite">
          {pieceIds.map((id) => {
            const etat = etats[id] ?? { statut: "attente" };
            const actif = etat.statut !== "attente";
            return (
              <li key={id} className="border-b border-line-soft py-2" data-testid="ligne-generation">
                <div className={`flex min-h-10 items-center gap-3 ${actif ? "text-ink" : "text-muted"}`}>
                  <Pastille statut={etat.statut} />
                  <span className="min-w-0 flex-1">
                    Analyse des photos, {nom(id).toLocaleLowerCase("fr-CH")} ({nbPhotos(id)})
                    <span className="sr-only"> : {LIBELLE_STATUT[etat.statut]}</span>
                  </span>
                  {etat.statut === "echec" ? (
                    <Button className="h-12 px-4" onClick={() => relancer(id)}>
                      Relancer
                    </Button>
                  ) : null}
                </div>
                {etat.statut === "echec" ? (
                  <p className="mt-1 mb-1 ml-[34px] text-[12.5px] text-danger" role="alert">
                    L&apos;analyse de la pièce « {nom(id)} » a échoué. {etat.message}
                  </p>
                ) : null}
              </li>
            );
          })}
          <li className={`flex min-h-10 items-center gap-3 border-b border-line-soft py-2 ${calcul === "attente" ? "text-muted" : "text-ink"}`}>
            <Pastille statut={calcul} />
            Calcul du devis selon la grille Pro Space
          </li>
        </ul>

        {!enCours && echecs.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button onClick={onFermer}>Retour aux photos</Button>
            {!inventaireVide ? (
              <Button variant="brand" onClick={onTermine}>
                Voir le devis sans ces pièces
              </Button>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-[12px] leading-normal text-muted">
          Les photos servent à reconnaître et compter les objets. Le prix est calculé par la grille Pro Space, pas par l&apos;IA.
        </p>
      </div>
    </div>
  );
}
