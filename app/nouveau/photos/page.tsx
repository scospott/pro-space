import { BottomBar } from "@/components/BottomBar";
import { ButtonLink } from "@/components/Button";

export default function PhotosPage() {
  return (
    <>
      <div className="flex-1 overflow-auto p-7">
        <p className="text-muted">Photos par pièce, en construction.</p>
      </div>
      <BottomBar>
        <ButtonLink href="/nouveau/client">Retour</ButtonLink>
        <ButtonLink href="/nouveau/devis" variant="primary">
          Générer le devis
        </ButtonLink>
      </BottomBar>
    </>
  );
}
