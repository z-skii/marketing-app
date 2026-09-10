import { redirect } from "next/navigation";

/** The original link board lives on at /board; /legacy is the door to it. */
export default function LegacyPage() {
  redirect("/board");
}
