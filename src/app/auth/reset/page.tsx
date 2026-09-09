import { AuthShell } from "@/components/v2/AuthShell";
import { ResetClient } from "./ResetClient";

export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AuthResetPage() {
  return (
    <AuthShell>
      <h1 className="font-display text-[2rem] font-800 tracking-[-0.03em]">
        Choose a new password
      </h1>
      <ResetClient />
    </AuthShell>
  );
}
