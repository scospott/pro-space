import { BottomBar } from "@/components/BottomBar";
import { ButtonLink } from "@/components/Button";

export default async function DevisLecturePage({ params }: PageProps<"/devis/[id]">) {
  const { id } = await params;
  return (
    <>
      <div className="flex-1 overflow-auto bg-canvas p-6">
        <p className="text-muted">Devis {id}, lecture seule, en construction.</p>
      </div>
      <BottomBar>
        <ButtonLink href="/devis">Retour à la liste</ButtonLink>
      </BottomBar>
    </>
  );
}
