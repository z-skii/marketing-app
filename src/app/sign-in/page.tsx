import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  if (user) redirect(next ?? "/dashboard");

  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-14 md:py-24">
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-[0.95] font-800 tracking-[-0.04em] md:text-5xl">
            Sign in
          </h1>
          {verified === "1" ? (
            <p role="status" className="mt-4 font-mono text-sm text-rise">
              Email verified. Sign in below with your password.
            </p>
          ) : reset === "done" ? (
            <p role="status" className="mt-4 font-mono text-sm text-rise">
              Password updated. Sign in with your new password.
            </p>
          ) : (
            <p className="mt-4 text-ink-soft">
              You only need an account to own links, hold credit, or earn. Browsing is open to everyone.
            </p>
          )}
          <SignInForm next={next ?? "/dashboard"} />
        </div>
      </main>
      <Footer />
    </>
  );
}
