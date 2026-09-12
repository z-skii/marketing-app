import { redirect } from "next/navigation";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { getBusinessCampaign, getCarBookings, getCarProofs, getBookingMonthsPaid } from "@/lib/fs/business-campaigns";
import { loadFunding } from "@/lib/fs/funding";
import { BookingReview } from "@/components/fs/business/campaign/BookingReview";

export const dynamic = "force-dynamic";

/** One booked car: its stage, the driver's photos, and the one action the stage allows. */
export default async function BookingReviewPage({ params }: { params: Promise<{ id: string; bookingId: string }> }) {
  const { id, bookingId } = await params;
  const ctx = await requireBusinessContext(`/business/campaigns/${id}/cars/${bookingId}`);
  const campaign = await getBusinessCampaign(id);
  if (!campaign || campaign.business_id !== ctx.activeBusiness.id || campaign.kind !== "car_ads") redirect("/business/campaigns");
  try { await requireBusinessMember(ctx.user.id, campaign.business_id); } catch { redirect("/business/campaigns"); }
  const booking = (await getCarBookings(campaign.id)).find((b) => b.id === bookingId) ?? null;
  if (!booking) redirect(`/business/campaigns/${id}`);
  const [proofs, months, funding] = await Promise.all([getCarProofs([booking.id]), getBookingMonthsPaid([booking.id], campaign.business_id), loadFunding(campaign.business_id)]);
  return <BookingReview campaign={campaign} booking={booking} proofs={proofs} monthsPaid={months[booking.id] ?? 0} funding={funding} />;
}
