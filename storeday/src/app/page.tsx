import { redirect } from "next/navigation";
import { getCurrentUser, getOrgContext } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const ctx = await getOrgContext();
  if (!ctx) redirect("/onboarding");
  redirect(ctx.isManager ? "/dashboard" : "/clock");
}
