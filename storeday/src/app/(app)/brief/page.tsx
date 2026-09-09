import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildDailyBrief } from "@/lib/brief";
import { formatWeekdayDate } from "@/lib/utils/time";
import { PageHeader } from "@/components/ui/misc";
import { BriefView } from "@/components/dashboard/brief-view";
import { BriefDateNav } from "@/components/dashboard/brief-date-nav";

export const metadata = { title: "Daily Brief" };

export default async function BriefPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= ctx.today ? raw : ctx.today;
  const supabase = await createSupabaseServerClient();
  const brief = await buildDailyBrief(supabase, ctx, date);
  return (
    <>
      <PageHeader title="Daily Brief" description={`${formatWeekdayDate(date)}${date === ctx.today ? " · today" : ""}`} actions={<BriefDateNav date={date} max={ctx.today} />} />
      <BriefView brief={brief} currency={ctx.org.currency} isToday={date === ctx.today} />
    </>
  );
}
