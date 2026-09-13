"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Entry = { href: string; label: string; match: (p: string) => boolean; icon: ReactNode };

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
    href: "/nouveau/client?reprise=1",
    label: "Nouveau devis",
    match: (p) => p.startsWith("/nouveau"),
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
  return (
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
  );
}
