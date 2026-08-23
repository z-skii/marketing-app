import { Header } from "@/components/Header";
import { ResetClient } from "./ResetClient";

export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AuthResetPage() {
  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-14 md:py-24">
        <h1 className="font-display text-4xl leading-[0.95] font-800 tracking-[-0.04em]">
          Choose a new password
        </h1>
        <ResetClient />
      </main>
    </>
  );
}
