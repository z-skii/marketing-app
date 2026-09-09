import { redirect } from "next/navigation";

/** Jobs became Activity: what I am doing, not what is on offer. */
export default function LegacyJobsPage() {
  redirect("/activity");
}
