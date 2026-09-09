import Link from "next/link";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/config/site";
import { getOrgContext, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/data/team";
import { BusinessStep, StoreStep, AccountingStep, EmployeesStep, ClockStep } from "./steps";

export const metadata = { title: "Set up your business" };

const STEPS = ["Account", "Business", "First store", "Accounting", "Employees", "Clock-in", "Done"];

export default async function OnboardingPage() {
  await requireUser();
  const ctx = await getOrgContext();
  if (ctx && ctx.org.onboarding_completed) redirect("/dashboard");
  if (ctx && !ctx.isOwner) redirect("/");

  let step = 2;
  let categories: Array<{ id: string; name: string }> = [];
  let employees: Array<{ id: string; full_name: string; role: string; hourly_rate: number | null }> = [];
  if (ctx) {
    step = Math.max(3, ctx.org.onboarding_step);
    if (step === 3 && ctx.locations.length > 0) step = 4;
    const supabase = await createSupabaseServerClient();
    if (step === 4) {
      const { data } = await supabase.from("expense_categories").select("id, name").eq("organization_id", ctx.org.id).order("sort_order");
      categories = data ?? [];
    }
    if (step === 5) employees = (await listEmployees(supabase, ctx.org.id)).map((e) => ({ id: e.id, full_name: e.full_name, role: e.role, hourly_rate: e.hourly_rate }));
  }

  return (
    <div className="min-h-dvh">
      <header className="h-14 flex items-center px-5 border-b border-border bg-surface">
        <Link href="/" className="font-semibold tracking-tight text-[15px]">{SITE_NAME}</Link>
        <span className="ml-3 text-[12.5px] text-text-3">Setup</span>
        <form action="/auth/sign-out" method="post" className="ml-auto"><button className="text-[12.5px] text-text-3 hover:text-text">Sign out</button></form>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        <ol className="flex items-center gap-1 mb-6 overflow-x-auto">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={s} className="flex items-center gap-1 shrink-0">
                <span className={`h-5 w-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${state === "done" ? "bg-success text-white" : state === "current" ? "bg-accent text-white" : "bg-surface-2 text-text-3"}`}>{state === "done" ? "✓" : n}</span>
                <span className={`text-[12px] ${state === "current" ? "text-text font-medium" : "text-text-3"}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="w-3 h-px bg-border mx-1" />}
              </li>
            );
          })}
        </ol>
        {step === 2 && <BusinessStep />}
        {step === 3 && ctx && <StoreStep orgTimezone={ctx.org.timezone} />}
        {step === 4 && ctx && <AccountingStep categories={categories} currency={ctx.settings.currency} />}
        {step === 5 && ctx && <EmployeesStep locations={ctx.locations.map((l) => ({ id: l.id, name: l.name }))} employees={employees} />}
        {step === 6 && ctx && <ClockStep />}
      </main>
    </div>
  );
}
