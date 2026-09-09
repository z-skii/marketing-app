"use server";

import { redirect } from "next/navigation";
import { requireV2, setActiveBusiness } from "@/lib/v2/core";

/**
 * Identity switching. One account: "personal" is the earning marketplace,
 * a business id is the marketing command center for that business. The
 * choice is stored on the profile and the person lands on that mode's home.
 */
export async function switchContext(target: "personal" | string) {
  const ctx = await requireV2();
  if (target === "personal") {
    await setActiveBusiness(ctx.user.id, null);
    redirect("/home");
  }
  if (!ctx.businesses.some((b) => b.id === target)) redirect("/me");
  await setActiveBusiness(ctx.user.id, target);
  redirect("/business");
}
