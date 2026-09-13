import { redirect } from "next/navigation";

export default function Home() {
  redirect("/nouveau/client?reprise=1");
}
