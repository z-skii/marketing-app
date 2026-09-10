import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The review queue is the Campaigns screen filtered to what needs you. */
export default function ReviewRedirect() {
  redirect("/business/campaigns?tab=review");
}
