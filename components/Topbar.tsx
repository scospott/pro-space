"use client";

import { usePathname } from "next/navigation";
import { dateCH, heureCH } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { etape3Accessible } from "@/lib/validation";
import { Stepper, type StepState } from "./Stepper";

function titreDepuisChemin(pathname: string): string {
  if (pathname.startsWith("/nouveau")) return "Nouveau devis";
  if (pathname.startsWith("/devis/")) return "Devis";
  if (pathname.startsWith("/devis")) return "Mes devis";
  if (pathname.startsWith("/grille")) return "Grille tarifaire";
  return "Pro Space Devis";
}

function etapeCourante(pathname: string): 1 | 2 | 3 {
  if (pathname.startsWith("/nouveau/photos")) return 2;
  if (pathname.startsWith("/nouveau/devis")) return 3;
  return 1;
}

export function Topbar() {
  const pathname = usePathname() ?? "";
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const enregistreAt = useStore((s) => s.ui.brouillonEnregistreAt);
  const dansParcours = pathname.startsWith("/nouveau");
  const courante = etapeCourante(pathname);
  const envoye = draft.statut === "envoye";

  const steps: StepState[] = [
    { numero: 1, label: "Client et lieu", href: "/nouveau/client", enabled: hydrated },
    // Navigation libre entre les étapes 1 et 2 : le dossier n'est validé qu'au clic sur « Générer le devis ».
    { numero: 2, label: "Photos", href: "/nouveau/photos", enabled: hydrated },
    { numero: 3, label: "Devis", href: "/nouveau/devis", enabled: hydrated && etape3Accessible(draft) },
  ];

  let statut: string | null = null;
  if (hydrated && dansParcours) {
    const sentAt = draft.snapshot?.sentAt;
    if (envoye && sentAt) statut = `Envoyé le ${dateCH(sentAt)} à ${heureCH(sentAt)}`;
    else if (enregistreAt) statut = `Brouillon enregistré à ${heureCH(enregistreAt)}`;
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-[22px] border-b border-line bg-surface px-6">
      <h1 className="text-[18px] font-semibold whitespace-nowrap">{titreDepuisChemin(pathname)}</h1>
      {dansParcours ? <Stepper steps={steps} current={courante} /> : null}
      {statut ? (
        <p className="ml-auto truncate text-[13px] text-muted" aria-live="polite">
          {statut}
        </p>
      ) : null}
    </header>
  );
}
