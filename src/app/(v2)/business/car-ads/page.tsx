import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Car campaigns are managed with every other campaign now. */
export default function CarAdsRedirect() {
  redirect("/business/campaigns");
}
