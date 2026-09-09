import { redirect } from "next/navigation";
import { requireManagerContext } from "@/lib/auth";

/** /settings → first tab the person can use. */
export default async function SettingsIndex() {
  const ctx = await requireManagerContext();
  redirect(ctx.isOwner ? "/settings/business" : "/settings/notifications");
}
