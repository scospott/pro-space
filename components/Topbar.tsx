"use client";

import { usePathname } from "next/navigation";
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
  const dansParcours = pathname.startsWith("/nouveau");
  const steps: StepState[] = [
    { numero: 1, label: "Client et lieu", href: "/nouveau/client", enabled: true },
    { numero: 2, label: "Photos", href: "/nouveau/photos", enabled: true },
    { numero: 3, label: "Devis", href: "/nouveau/devis", enabled: true },
  ];
  return (
    <header className="flex h-16 shrink-0 items-center gap-[22px] border-b border-line bg-surface px-6">
      <h1 className="text-[18px] font-semibold whitespace-nowrap">{titreDepuisChemin(pathname)}</h1>
      {dansParcours ? <Stepper steps={steps} current={etapeCourante(pathname)} /> : null}
    </header>
  );
}
