import { EcranClient } from "@/components/ecrans/EcranClient";

export default async function ClientPage({ searchParams }: PageProps<"/nouveau/client">) {
  const params = await searchParams;
  return <EcranClient nouveau={params.nouveau === "1"} />;
}
