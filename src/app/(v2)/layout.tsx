import { redirect } from "next/navigation";
import { AppShell } from "@/components/v2/AppShell";
import { getV2Context } from "@/lib/v2/core";

/**
 * Everything inside this group is the signed-in TapMart app. The shell
 * adapts to the identity the person is acting as: themselves (earning
 * marketplace) or one of their businesses (marketing command center).
 * Fresh accounts finish onboarding before they land here.
 */
export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/home");
  if (ctx.user.suspended) redirect("/");
  if (!ctx.onboarded) redirect("/onboarding");

  const identity = ctx.activeBusiness
    ? { name: ctx.activeBusiness.name, sub: "Business", logo: ctx.activeBusiness.logo_url }
    : { name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl };

  return (
    <AppShell
      mode={ctx.mode}
      identity={identity}
      unreadNotifications={ctx.unreadNotifications}
      unreadMessages={ctx.unreadMessages}
    >
      {children}
    </AppShell>
  );
}
