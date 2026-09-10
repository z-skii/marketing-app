import { redirect } from "next/navigation";

/** Google checks moved to /business/google; growth moved to /business/social. */
export default function HealthPage() {
  redirect("/business/google");
}
