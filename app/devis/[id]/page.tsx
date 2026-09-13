import { EcranDevisLecture } from "@/components/ecrans/EcranDevisLecture";

export default async function DevisLecturePage({ params }: PageProps<"/devis/[id]">) {
  const { id } = await params;
  return <EcranDevisLecture id={decodeURIComponent(id)} />;
}
