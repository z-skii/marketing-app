import { redirect } from "next/navigation";
import { FrameShiftUserShell } from "@/components/fs/Shell";
import { FrameShiftBusinessShell } from "@/components/fs/BusinessShell";
import { getV2Context } from "@/lib/v2/core";
import "../frame-shift.css";
import "@/v3/v3.css";
import "@/v3/prod.css";

/**
 * The signed in product screens. Same URLs, same auth and identity rules
 * as the rest of the app; the shells and the screens inside them render
 * in the V3 material (frame-shift.css retokened to V3, v3.css for the V3
 * compositions on Home, Profile and Business Home). Both stylesheets load
 * here, not at the root, so the public homepage and the older screens do
 * not pay for them. The typeface is the root DM Sans; no other font loads.
 */
export default async function FrameShiftLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/home");
  if (ctx.user.suspended) redirect("/");
  if (!ctx.onboarded) redirect("/onboarding");

  if (ctx.mode === "business" && ctx.activeBusiness) {
    return (
      <FrameShiftBusinessShell business={{ id: ctx.activeBusiness.id, name: ctx.activeBusiness.name, logo: ctx.activeBusiness.logo_url }} unreadNotifications={ctx.unreadNotifications} unreadMessages={ctx.unreadMessages}>
        {children}
      </FrameShiftBusinessShell>
    );
  }
  return (
    <FrameShiftUserShell identity={{ name: ctx.user.displayName ?? `@${ctx.user.username}`, avatar: ctx.avatarUrl, mode: "Personal" }} unreadNotifications={ctx.unreadNotifications} unreadMessages={ctx.unreadMessages}>
      {children}
    </FrameShiftUserShell>
  );
}
