import { notFound, redirect } from "next/navigation";
import { sqlOne } from "@/lib/db";
import { getV2Context } from "@/lib/v2/core";
import { getOpportunity } from "@/lib/v2/opportunities";
import { getInviteFor, KIND_VERB } from "@/lib/v2/requests";
import { formatCredit } from "@/lib/money";
import { InviteBanner } from "./InviteBanner";
import { RecreateView } from "./RecreateView";
import { StoryView } from "./StoryView";
import { CarView } from "./CarView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opportunity" };

/**
 * One opportunity, seen by the person who might take it. Three kinds, three
 * layouts, one screen. People who manage the business behind it land on
 * the campaign's business page instead.
 */
export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null; // the layout redirects

  const o = await getOpportunity(id, ctx.user.id);
  if (!o) notFound();

  const manages = ctx.user.role === "admin" ||
    ctx.businesses.some((b) => b.id === o.business_id && ["owner", "manager"].includes(b.member_role));
  if (manages) redirect(`/business/campaigns/${id}`);

  const row = await sqlOne<{ status: string; rights_note: string }>(
    `select status::text as status, rights_note from campaigns where id = $1`,
    [id],
  );
  if (!row || row.status === "draft") notFound();
  const open = row.status === "open" && (!o.deadline || new Date(o.deadline) > new Date());

  // A direct request: the person answers first, then the normal flow applies.
  const invite = await getInviteFor(id, ctx.user.id);
  const banner = invite && invite.status === "sent" ? (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 md:px-8 md:pt-8">
      <InviteBanner
        inviteId={invite.id} businessName={o.business_name} verb={KIND_VERB[invite.kind]} kind={invite.kind}
        pay={`${formatCredit(invite.pay_cents)}${invite.kind === "car_ads" ? " a month" : ""}`} message={invite.message}
      />
    </div>
  ) : null;

  const view = (() => {
    switch (o.kind) {
      case "recreate_reel": return <RecreateView o={o} ctx={ctx} open={open} rightsNote={row.rights_note} />;
      case "instagram_story": return <StoryView o={o} ctx={ctx} open={open} />;
      case "car_ads": return <CarView o={o} ctx={ctx} open={open} />;
    }
  })();
  return <>{banner}{view}</>;
}
