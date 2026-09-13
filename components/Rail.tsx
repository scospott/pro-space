"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { dateCH, heureCH } from "@/lib/format";
import { deletePhotos } from "@/lib/photos";
import { brouillonNonVide, useStore } from "@/lib/store";
import { ConfirmDialog } from "./ConfirmDialog";

type Entry = { href: string; label: string; match: (p: string) => boolean; icon: ReactNode; nouveauDevis?: boolean };

type Reprise = { nom: string; localite: string; enregistreAt?: string };

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-[22px] w-[22px] fill-none stroke-current",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const entries: Entry[] = [
  {
    href: "/nouveau/client?nouveau=1",
    label: "Nouveau devis",
    match: (p) => p.startsWith("/nouveau"),
    nouveauDevis: true,
    icon: (
      <svg {...iconProps}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/devis",
    label: "Mes devis",
    match: (p) => p.startsWith("/devis"),
    icon: (
      <svg {...iconProps}>
        <path d="M6 4h9l5 5v11H6z" />
        <path d="M14 4v6h6M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    href: "/grille",
    label: "Grille tarifaire",
    match: (p) => p.startsWith("/grille"),
    icon: (
      <svg {...iconProps}>
        <path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="18" cy="17" r="2" />
      </svg>
    ),
  },
];

export function Rail() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [reprise, setReprise] = useState<Reprise | null>(null);

  // Seul endroit où la reprise est proposée : au chargement et entre les étapes, le brouillon reprend en silence.
  const nouveauDevis = (e: MouseEvent<HTMLAnchorElement>) => {
    const { draft, ui } = useStore.getState();
    if (!brouillonNonVide(draft)) return;
    e.preventDefault();
    setReprise({
      nom: [draft.client.prenom, draft.client.nom].filter(Boolean).join(" "),
      localite: draft.lieu.localite,
      enregistreAt: ui.brouillonEnregistreAt,
    });
  };

  const reprendre = () => {
    setReprise(null);
    router.push("/nouveau/client");
  };

  const repartirDeZero = () => {
    const { draft, resetDraft } = useStore.getState();
    void deletePhotos(draft.photos.map((p) => p.blobKey)).catch(() => undefined);
    resetDraft();
    setReprise(null);
    router.push("/nouveau/client");
  };

  return (
    <>
      <aside className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 bg-brand py-3.5 text-white">
        <Link href="/nouveau/client" aria-label="Pro Space Devis, accueil" className="mb-3 flex h-12 w-12 items-center justify-center">
          <span
            aria-hidden="true"
            className="block h-10 w-10 bg-white"
            style={{
              maskImage: "url(/logo-mark.png)",
              WebkitMaskImage: "url(/logo-mark.png)",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </Link>
        <nav className="flex flex-col gap-1.5" aria-label="Navigation principale">
          {entries.map((e) => {
            const on = e.match(pathname);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={on ? "page" : undefined}
                onClick={e.nouveauDevis ? nouveauDevis : undefined}
                className={`flex h-[62px] w-[64px] flex-col items-center justify-center gap-[5px] rounded-xl px-1 text-center text-[10.5px] leading-tight font-medium ${
                  on ? "bg-white/15 text-white" : "text-white/75"
                }`}
              >
                {e.icon}
                {e.label}
              </Link>
            );
          })}
        </nav>
        <div
          className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent font-semibold"
          role="img"
          aria-label="Ethan"
        >
          E
        </div>
      </aside>

      <ConfirmDialog
        open={reprise !== null}
        title="Reprendre le brouillon ?"
        confirmLabel="Reprendre le brouillon"
        cancelLabel="Repartir de zéro"
        onConfirm={reprendre}
        onCancel={repartirDeZero}
        onDismiss={() => setReprise(null)}
      >
        {reprise ? (
          <>
            <p>
              Un devis pour {reprise.nom || "un client sans nom"}
              {reprise.localite ? ` à ${reprise.localite}` : ""} est en cours
              {reprise.enregistreAt ? `, enregistré le ${dateCH(reprise.enregistreAt)} à ${heureCH(reprise.enregistreAt)}` : ""}.
            </p>
            <p className="mt-2">Repartir de zéro efface ce brouillon, ses photos et son inventaire.</p>
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
