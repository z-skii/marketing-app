import { redirect } from "next/navigation";
import { AuthShell } from "@/components/v2/AuthShell";
import { SignInForm } from "./SignInForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  const { next, verified, reset } = await searchParams;
  if (user) redirect(next ?? "/home");

  return (
    <AuthShell>
        <h1 className="font-display text-[1.5rem] font-700 tracking-[-0.02em]">
          Welcome back
        </h1>
        {verified === "1" ? (
          <p role="status" className="mt-2 text-[0.9375rem] text-rise">
            Email verified. Sign in with your password.
          </p>
        ) : reset === "done" ? (
          <p role="status" className="mt-2 text-[0.9375rem] text-rise">
            Password updated. Sign in with your new password.
          </p>
        ) : (
          <p className="mt-2 text-[0.9375rem] text-ink-soft">
            Sign in to see paid work near you.
          </p>
        )}
        <SignInForm next={next ?? ""} />
    </AuthShell>
  );
}
