import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { Rail } from "@/components/Rail";
import { Topbar } from "@/components/Topbar";
import { Toast } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Pro Space Devis",
  description: "Devis de débarras et de nettoyage à partir de photos, calculés par la grille Pro Space.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003664",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full overflow-hidden">
        <div className="mx-auto flex h-dvh max-w-[1280px] bg-surface shadow-[0_0_0_1px_var(--color-line)]">
          <Rail />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
        </div>
        <Toast />
      </body>
    </html>
  );
}
