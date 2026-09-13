import { redirect } from "next/navigation";

export default function Home() {
  redirect("/nouveau/client?nouveau=1");
}
