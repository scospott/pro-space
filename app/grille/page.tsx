import { BottomBar } from "@/components/BottomBar";

export default function GrillePage() {
  return (
    <>
      <div className="flex-1 overflow-auto p-7">
        <p className="text-muted">Grille tarifaire, en construction.</p>
      </div>
      <BottomBar left="Une modification s'applique aux futurs devis, pas à ceux déjà envoyés." />
    </>
  );
}
