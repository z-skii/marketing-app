import { notFound, redirect } from "next/navigation";
import { sql, sqlOne } from "@/lib/db";
import { getV2Context } from "@/lib/v2/core";
import { getMyParticipation } from "@/lib/v2/campaigns";
import { getMyVehicles, getOpportunity } from "@/lib/v2/opportunities";
import { getInviteFor } from "@/lib/v2/requests";
import { storyVerification } from "@/lib/v2/instagram";
import { getSettings } from "@/lib/settings";
import { RecreateDetail } from "@/components/fs/work/RecreateDetail";
import { StoryDetail } from "@/components/fs/work/StoryDetail";
import { CarDetail, type Booking } from "@/components/fs/work/CarDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opportunity" };

/**
 * One opportunity, seen by the person who might take it, in Frame Shift.
 * Three kinds, three compositions, one screen. People who manage the
 * business behind it land on the campaign's business page instead.
 */
export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const o = await getOpportunity(id, ctx.user.id);
  if (!o) notFound();

  const manages = ctx.user.role === "admin" ||
    ctx.businesses.some((b) => b.id === o.business_id && ["owner", "manager"].includes(b.member_role));
  if (manages) redirect(`/business/campaigns/${id}`);

  const [row, invite, settings] = await Promise.all([
    sqlOne<{ status: string; rights_note: string }>(`select status::text as status, rights_note from campaigns where id = $1`, [id]),
    getInviteFor(id, ctx.user.id),
    getSettings(),
  ]);
  if (!row || row.status === "draft") notFound();
  const open = row.status === "open" && (!o.deadline || new Date(o.deadline) > new Date());
  const feePct = Number(settings.platform_fee_pct ?? "15");

  if (o.kind === "car_ads") {
    const [vehicles, application, booking] = await Promise.all([
      getMyVehicles(ctx.user.id),
      sqlOne<{ id: string; status: string; vehicle_id: string | null }>(
        `select id, status::text as status, vehicle_id from applications where campaign_id = $1 and applicant_id = $2`,
        [id, ctx.user.id],
      ),
      sqlOne<NonNullable<Booking>>(
        `select k.id, k.status::text as status, k.ends_on::text as ends_on, k.starts_on::text as starts_on, k.vehicle_id,
                k.zones::text[] as zones, k.monthly_cents::int as monthly_cents, k.artwork_url,
                (select count(*) from earnings e where e.profile_id = $2 and e.source = 'booking' and e.source_id = k.id)::int as months_paid
           from car_bookings k join vehicles v on v.id = k.vehicle_id
          where k.campaign_id = $1 and v.owner_id = $2
          order by k.created_at desc limit 1`,
        [id, ctx.user.id],
      ),
    ]);
    return <CarDetail o={o} ctx={ctx} open={open} vehicles={vehicles} application={application} booking={booking} invite={invite} feePct={feePct} />;
  }

  const mine = await getMyParticipation(id, ctx.user.id);
  const latest = mine.submissions[0] ?? null;
  const paid = latest && latest.status === "paid"
    ? await sqlOne<{ cents: number; fee: number }>(`select amount_cents::int as cents, fee_cents::int as fee from earnings where source = 'submission' and source_id = $1`, [latest.id])
    : null;
  void sql;

  if (o.kind === "instagram_story") {
    const verification = await storyVerification();
    return <StoryDetail o={o} ctx={ctx} open={open} mine={mine} invite={invite} verification={verification} paid={paid ?? null} feePct={feePct} />;
  }
  return <RecreateDetail o={o} ctx={ctx} open={open} rightsNote={row.rights_note} mine={mine} invite={invite} paid={paid ?? null} feePct={feePct} />;
}
