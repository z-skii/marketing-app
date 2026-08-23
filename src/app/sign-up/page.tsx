import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignUpForm } from "./SignUpForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-14 md:py-24">
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-[0.95] font-800 tracking-[-0.04em] md:text-5xl">
            Create account
          </h1>
          <p className="mt-4 text-ink-soft">
            An account lets you own links, hold credit, and earn. Browsing never
            needs one.
          </p>
          <SignUpForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
