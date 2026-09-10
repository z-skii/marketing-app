import { redirect } from "next/navigation";
import { UserShell } from "@/components/v2/UserShell";
import { BusinessShell } from "@/components/v2/BusinessShell";
import { getV2Context } from "@/lib/v2/core";

/**
 * Everything inside this group is the signed-in TapMart app. Two shells,
 * chosen by the identity the person is acting as:
 *
 *   Personal  UserShell     Home · Activity · Earnings · Profile
 *   Business  BusinessShell Overview · Content · Create · Campaigns · Business
 *
 * They share auth, the account, notifications, messages and the design
 * tokens, and nothing else. Fresh accounts finish onboarding first.
 */
export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getV2Context();
  if (!ctx) redirect("/sign-in?next=/home");
  if (ctx.user.suspended) redirect("/");
  if (!ctx.onboarded) redirect("/onboarding");

  if (ctx.mode === "business" && ctx.activeBusiness) {
    return (
      <BusinessShell
        business={{ id: ctx.activeBusiness.id, name: ctx.activeBusiness.name, logo: ctx.activeBusiness.logo_url }}
        unreadNotifications={ctx.unreadNotifications}
        unreadMessages={ctx.unreadMessages}
      >
        {children}
      </BusinessShell>
    );
  }

  return (
    <UserShell
      identity={{ name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl }}
      unreadNotifications={ctx.unreadNotifications}
      unreadMessages={ctx.unreadMessages}
    >
      {children}
    </UserShell>
  );
}
