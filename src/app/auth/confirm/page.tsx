import { ConfirmClient } from "./ConfirmClient";
import { Header } from "@/components/Header";

export const metadata = { title: "Signing in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AuthConfirmPage() {
  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-14 md:py-24">
        <h1 className="font-display text-4xl leading-[0.95] font-800 tracking-[-0.04em]">
          One moment
        </h1>
        <ConfirmClient />
      </main>
    </>
  );
}
