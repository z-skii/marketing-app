import { redirect } from "next/navigation";
import { AppShell } from "@/components/v2/AppShell";
import { getV2Context } from "@/lib/v2/core";

/**
 * Everything inside this group is the signed-in TapMart app: five
 * destinations, one Create action, the same shell on phone and desktop.
 * Fresh accounts finish onboarding before they land here.
 */
export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/home");
  if (ctx.user.suspended) redirect("/");
  if (!ctx.onboarded) redirect("/onboarding");

  return (
    <AppShell
      username={ctx.user.username}
      displayName={ctx.user.displayName}
      hasBusiness={ctx.businesses.length > 0}
      wantsBusiness={ctx.wantsBusiness}
      unreadNotifications={ctx.unreadNotifications}
      unreadMessages={ctx.unreadMessages}
    >
      {children}
    </AppShell>
  );
}
