import { redirect } from "next/navigation";
import { AuthShell } from "@/components/v2/AuthShell";
import { SignUpForm } from "./SignUpForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <AuthShell>
      <h1 className="font-display text-[2rem] font-800 tracking-[-0.03em]">
        Make money near you
      </h1>
      <p className="mt-2 text-[0.9375rem] text-ink-soft">
        Recreate a Reel, post a Story, or drive with an ad. One account, also for your business.
      </p>
      <SignUpForm />
    </AuthShell>
  );
}
