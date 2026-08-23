import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default function ResetPage() {
  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-14 md:py-24">
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-[0.95] font-800 tracking-[-0.04em] md:text-5xl">
            Reset password
          </h1>
          <p className="mt-4 text-ink-soft">
            Enter your account email and we&apos;ll send a link to choose a new
            password.
          </p>
          <ResetRequestForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
