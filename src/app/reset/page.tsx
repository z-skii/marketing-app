import { AuthShell } from "@/components/v2/AuthShell";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default function ResetPage() {
  return (
    <AuthShell>
      <h1 className="font-display text-[2rem] font-800 tracking-[-0.03em]">
        Reset password
      </h1>
      <p className="mt-2 text-[0.9375rem] text-ink-soft">
        Enter your email and we will send a link to choose a new password.
      </p>
      <ResetRequestForm />
    </AuthShell>
  );
}
