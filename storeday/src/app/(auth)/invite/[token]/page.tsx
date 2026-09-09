import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SignUpForm } from "../../auth-form";
import { signUpAction } from "../../actions";
import { acceptInvitationAction } from "./actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Join your team" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("invitation_preview", { p_token: token });
  const inv = data?.[0];
  if (!inv) {
    return <div className="card p-5"><h1 className="text-[18px] font-semibold">Invitation not found</h1><p className="text-[13.5px] text-text-3 mt-1">This link is invalid. Ask your manager for a new one.</p></div>;
  }
  if (inv.status !== "pending") {
    return <div className="card p-5"><h1 className="text-[18px] font-semibold">Invitation {inv.status}</h1><p className="text-[13.5px] text-text-3 mt-1">Ask your manager to send a new invitation.</p><Link className="text-accent text-[13px] mt-3 inline-block" href="/sign-in">Sign in</Link></div>;
  }
  const user = await getCurrentUser();
  if (user) {
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      return (
        <div className="card p-5 space-y-3">
          <h1 className="text-[18px] font-semibold">Join {inv.organization_name}</h1>
          <p className="text-[13.5px] text-text-2">This invitation was sent to <b>{inv.email}</b>, but you are signed in as <b>{user.email}</b>.</p>
          <form action={acceptInvitationAction}><input type="hidden" name="token" value={token} /><Button type="submit" block>Join as {user.email} anyway</Button></form>
          <form action="/auth/sign-out" method="post"><Button variant="secondary" block type="submit">Sign out and use another account</Button></form>
        </div>
      );
    }
    return (
      <div className="card p-5 space-y-3">
        <h1 className="text-[18px] font-semibold">Join {inv.organization_name}</h1>
        <p className="text-[13.5px] text-text-2">You&apos;ve been invited as <b className="capitalize">{inv.role}</b>{inv.employee_name ? ` (${inv.employee_name})` : ""}.</p>
        <form action={acceptInvitationAction}><input type="hidden" name="token" value={token} /><Button type="submit" block size="lg">Accept invitation</Button></form>
      </div>
    );
  }
  const next = `/invite/${token}`;
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="text-[12px] uppercase tracking-wider text-text-3 font-semibold">You&apos;re invited</div>
        <div className="text-[16px] font-semibold mt-0.5">{inv.organization_name}</div>
        <div className="text-[13px] text-text-2">as <span className="capitalize">{inv.role}</span>{inv.employee_name ? ` · ${inv.employee_name}` : ""}</div>
      </div>
      <SignUpForm action={signUpAction} next={next} invitedEmail={inv.email} title="Create your account" subtitle="Use the email your invitation was sent to." />
    </div>
  );
}

export const dynamic = "force-dynamic";
