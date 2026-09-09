import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Welcome", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/onboarding");
  if (ctx.onboarded) redirect("/home");
  return <OnboardingFlow />;
}
