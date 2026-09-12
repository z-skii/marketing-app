import { redirect } from "next/navigation";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import { BusinessShell } from "@/components/v2/BusinessShell";
import { FrameShiftUserShell } from "@/components/fs/Shell";
import { getV2Context } from "@/lib/v2/core";

/**
 * Screens migrated to Frame Shift, the approved production design system.
 * Same URLs, same auth and identity rules as the rest of the signed-in app;
 * only the shell and the screens inside it changed. Business mode keeps
 * its existing shell until that stage is migrated. The fonts load here so
 * the rest of the product stays untouched.
 */
const display = Archivo({ subsets: ["latin"], weight: "variable", variable: "--font-fs-display", display: "swap" });
const ui = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-fs-ui", display: "swap" });

export default async function FrameShiftLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/home");
  if (ctx.user.suspended) redirect("/");
  if (!ctx.onboarded) redirect("/onboarding");

  if (ctx.mode === "business" && ctx.activeBusiness) {
    return (
      <BusinessShell business={{ id: ctx.activeBusiness.id, name: ctx.activeBusiness.name, logo: ctx.activeBusiness.logo_url }} unreadNotifications={ctx.unreadNotifications} unreadMessages={ctx.unreadMessages}>
        {/* Home, Activity, Earnings and Profile redirect business mode away; an opportunity opened in business mode renders in Frame Shift inside the business shell. */}
        <div className={`${display.variable} ${ui.variable} fs`} style={{ minHeight: 0 }}>{children}</div>
      </BusinessShell>
    );
  }
  return (
    <div className={`${display.variable} ${ui.variable}`} style={{ display: "contents" }}>
      <FrameShiftUserShell identity={{ name: ctx.user.displayName ?? `@${ctx.user.username}`, avatar: ctx.avatarUrl, mode: "Personal" }} unreadNotifications={ctx.unreadNotifications} unreadMessages={ctx.unreadMessages}>
        {children}
      </FrameShiftUserShell>
    </div>
  );
}
