import { BottomBar } from "@/components/BottomBar";
import { ButtonLink } from "@/components/Button";

export default function DevisBrouillonPage() {
  return (
    <>
      <div className="flex-1 overflow-auto bg-canvas p-6">
        <p className="text-muted">Devis et corrections, en construction.</p>
      </div>
      <BottomBar left="Rien n'est envoyé tant que vous n'avez pas validé.">
        <ButtonLink href="/nouveau/client">Modifier</ButtonLink>
      </BottomBar>
    </>
  );
}
