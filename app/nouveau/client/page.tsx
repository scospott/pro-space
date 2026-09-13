import { BottomBar } from "@/components/BottomBar";
import { ButtonLink } from "@/components/Button";

export default function ClientPage() {
  return (
    <>
      <div className="flex-1 overflow-auto p-7">
        <p className="text-muted">Formulaire client et lieu, en construction.</p>
      </div>
      <BottomBar>
        <ButtonLink href="/nouveau/photos" variant="brand">
          Continuer vers les photos
        </ButtonLink>
      </BottomBar>
    </>
  );
}
