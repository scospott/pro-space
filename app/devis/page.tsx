import { BottomBar } from "@/components/BottomBar";
import { ButtonLink } from "@/components/Button";

export default function MesDevisPage() {
  return (
    <>
      <div className="flex-1 overflow-auto p-7">
        <p className="text-muted">Aucun devis pour le moment.</p>
      </div>
      <BottomBar>
        <ButtonLink href="/nouveau/client" variant="brand">
          Nouveau devis
        </ButtonLink>
      </BottomBar>
    </>
  );
}
