import Link from "next/link";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, vehicleQualifies, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import { placementLabel } from "@/components/v2/EarnCards";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Money, formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { ApplyVehicleButton, BookingProofForm, WithdrawCarButton } from "./CarControls";
import { RequestDecision } from "./RequestDecision";
import { BusinessLine, DetailTop, Facts, GoLink, Plane, PlainList, Section, fmtLong } from "./DetailParts";

/**
 * Drive with a campaign, in Frame Shift: the campaign visual with its
 * inset monthly caption, the supplied artwork, the placement and duration
 * as facts, the person's real vehicles checked against them, and the
 * booking as it really stands. An application is never shown as a
 * booking, and a proof step is never shown as a payment.
 */
export type CarApplication = { id: string; status: string; vehicle_id: string | null } | null;
export type Booking = { id: string; status: string; ends_on: string | null; starts_on: string | null; vehicle_id: string; zones: string[]; monthly_cents: number; artwork_url: string | null; months_paid: number } | null;

const BOOKING: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral"; body: string }> = {
  creative_pending: { label: "Accepted", tone: "confirmed", body: "The business is preparing the artwork. Nothing is paid yet." },
  installation_pending: { label: "Installation next", tone: "waiting", body: "The business arranges a time and place with you. The first month is paid when it confirms installation." },
  active: { label: "Running", tone: "confirmed", body: "The business pays each month into your earnings. Send a photo of the decal when asked." },
  proof_required: { label: "Photo needed", tone: "waiting", body: "The business wants to see the decal is still on. One clear photo is enough. This confirms the booking; it does not by itself pay a month." },
  completed: { label: "Completed", tone: "confirmed", body: "This campaign is done." },
  cancelled: { label: "Cancelled", tone: "neutral", body: "This booking was cancelled." },
  disputed: { label: "Under review", tone: "problem", body: "TapMart is looking into this booking." },
};

export function CarDetail({ o, ctx, open, vehicles, application, booking, invite, feePct }: {
  o: Opportunity; ctx: V2Context; open: boolean; vehicles: VehicleSummary[]; application: CarApplication; booking: Booking; invite: Invite | null; feePct: number;
}) {
  const visual = o.details.media_url ?? o.business_cover ?? null;
  const art = o.details.artwork_url ?? null;
  const duration = o.details.duration_days ?? 30;
  const prefs = o.details.vehicle_prefs ?? {};
  const placements = (o.details.placements ?? []).map(placementLabel);
  const requestOpen = invite?.status === "sent";
  const declined = invite?.status === "declined";
  const live = application && application.status !== "withdrawn" ? application : booking ? { id: booking.id, status: "accepted", vehicle_id: booking.vehicle_id } : null;
  const checks = vehicles.map((v) => ({ v, q: vehicleQualifies(v, o) }));
  const firstMatch = checks.find((c) => c.q.ok);
  const appliedWith = live ? vehicles.find((v) => v.id === live.vehicle_id) ?? null : null;
  const invitedVehicle = invite?.vehicle_id ? vehicles.find((v) => v.id === invite.vehicle_id) ?? null : null;
  const net = o.pay_cents - Math.floor((o.pay_cents * feePct) / 100);
  const deadline = fmtLong(o.deadline);
  const returnTo = encodeURIComponent(`/o/${o.id}`);
  void ctx;

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="fs-detail">
        <div className="fs-detail-source">
          <div className="fs-media" style={{ width: "100%", aspectRatio: "358 / 239" }}>
            {visual ? <MediaPreview src={visual} alt={`Campaign visual for ${o.title}`} className="fs-car-media" priority sizes="(min-width: 1024px) 448px, 100vw" />
              : <div className="fs-video-fallback">Campaign visual not uploaded yet</div>}
          </div>
          <div className="fs-car-caption is-detail">
            <Money cents={o.pay_cents} per="per month" className="fs-money-detail" />
            <div>
              <p className="fs-t-meta">{invite ? "Direct request · Car ad" : "Car ad"}</p>
              <h1 className="fs-t-task fs-car-title">{o.title}</h1>
              <BusinessLine o={o} />
            </div>
          </div>
          <p className="fs-t-meta" style={{ marginTop: 12 }}>Campaign visual{art ? " · Artwork supplied" : " · Artwork to follow"}</p>
          {art && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
              <span className="fs-media fs-contain fs-thumb" style={{ display: "block", width: 120, height: 80 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art} alt="The artwork that goes on the car" loading="lazy" />
              </span>
              <InspectButton src={art} alt={`The artwork from ${o.business_name}, at its original ratio`} label="Inspect artwork" style={{ paddingLeft: 0, minHeight: 44 }} />
            </div>
          )}
          <Facts rows={[
            ["Placement", placements.length ? placements.join(", ") : "To be agreed"],
            ["Duration", `${duration} days`],
            ["Monthly pay", `${formatMoney(o.pay_cents)} · ${formatMoney(net)} to you after the ${feePct}% fee`],
            ...(o.city ? [["City", o.city] as [string, React.ReactNode]] : []),
            ...(prefs.colors?.length ? [["Colour wanted", prefs.colors.join(" or ")] as [string, React.ReactNode]] : []),
            ...(prefs.body_types?.length ? [["Body wanted", prefs.body_types.join(" or ")] as [string, React.ReactNode]] : []),
            [`Spots`, `${Math.max(o.slots - o.approved_count, 0)} of ${o.slots}${deadline ? ` · Apply by ${deadline}` : ""}`],
          ]} />
        </div>

        <div style={{ minWidth: 0 }}>
          {requestOpen && invite && (
            <Plane decision style={{ marginTop: 24 }}>
              <p className="fs-t-meta">Request for you</p>
              <p className="fs-t-task" style={{ marginTop: 4 }}>{o.business_name} wants to advertise on your {invitedVehicle ? `${invitedVehicle.year} ${invitedVehicle.make} ${invitedVehicle.model}` : "car"}.</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{formatMoney(invite.pay_cents)} per month. Accepting creates the booking; nothing is paid until the decal is installed.</p>
              {invite.message && <p className="fs-t-body fs-note" style={{ marginTop: 12 }}>{invite.message}</p>}
              <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="car_ads" />
            </Plane>
          )}
          {declined && <Plane style={{ marginTop: 24 }}><p className="fs-t-label"><span className="fs-status is-neutral">Declined</span> · You declined this request.</p></Plane>}

          {live?.status === "applied" && (
            <Section title="Your application" id="work">
              <Plane>
                <p className="fs-t-label"><span className="fs-status is-waiting">Applied</span> · Waiting for the business to pick drivers</p>
                <p className="fs-t-meta" style={{ marginTop: 4 }}>{appliedWith ? `With your ${appliedWith.year} ${appliedWith.make} ${appliedWith.model}. ` : ""}Nothing is booked or paid until the business accepts.</p>
                <div style={{ marginTop: 12 }}><WithdrawCarButton campaignId={o.id} /></div>
              </Plane>
            </Section>
          )}
          {live?.status === "declined" && (
            <Section title="Your application" id="work">
              <Plane><p className="fs-t-label"><span className="fs-status is-neutral">Not selected</span> · The business went with other drivers.</p><p className="fs-t-meta" style={{ marginTop: 4 }}>Your car stays listed for the next campaign.</p><GoLink href="/home?k=cars">Other car campaigns</GoLink></Plane>
            </Section>
          )}
          {live?.status === "accepted" && (
            <Section title="Your booking" id="work">
              {booking ? <BookingPlane booking={booking} vehicle={appliedWith} pay={o.pay_cents} net={net} /> : (
                <Plane><p className="fs-t-label"><span className="fs-status is-confirmed">Accepted</span> · The business picked your car and is setting things up.</p></Plane>
              )}
            </Section>
          )}

          {!live && !requestOpen && !declined && (
            <Section title={vehicles.length === 0 ? "Add your vehicle to apply" : `Your ${vehicles.length === 1 ? "car" : "cars"}`} id="work">
              {vehicles.length === 0 ? (
                <Plane>
                  <p className="fs-t-body">Year, make, model, four photos and the areas you would let a business use. About five minutes, once.</p>
                  <Link href={`/me/vehicles/new?return=${returnTo}`} className="fs-btn fs-btn-primary" style={{ marginTop: 12 }}>Add my car</Link>
                </Plane>
              ) : (
                <ul className="fs-plain-list">
                  {checks.map(({ v, q }) => (
                    <li key={v.id}>
                      <div className="fs-vehicle-row">
                        <span className="fs-media fs-contain fs-thumb" style={{ display: "block", width: 104, height: 70 }}>
                          {v.photo_url ? <MediaPreview src={v.photo_url} alt="" className="fs-ref-media" sizes="104px" /> : <span className="fs-video-fallback" style={{ background: "var(--fs-underlay)", color: "var(--fs-muted)" }}>No photo</span>}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p className="fs-t-label">{v.year} {v.make} {v.model}</p>
                          {q.ok ? <p className="fs-status is-confirmed">Qualifies for this campaign</p> : (
                            <ul className="fs-plain-list fs-t-meta">{q.reasons.map((r) => <li key={r}><span className="fs-status is-waiting">Does not fit</span> · {r}</li>)}</ul>
                          )}
                          {!q.ok && v.status !== "listed" && <Link href={`/me/vehicles/${v.id}`} className="fs-btn fs-btn-secondary fs-btn-sm" style={{ marginTop: 8 }}>Finish my car</Link>}
                          {q.ok && open && <ApplyVehicleButton campaignId={o.id} vehicleId={v.id} first={firstMatch?.v.id === v.id} />}
                          {q.ok && !open && <p className="fs-t-meta" style={{ marginTop: 4 }}>This campaign is closed.</p>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="fs-t-meta" style={{ marginTop: 12 }}>Applying is not a booking. The business picks drivers; the first month is paid once the decal is installed.</p>
            </Section>
          )}

          {o.requirements.length > 0 && (
            <Section title="What the business asks" id="requirements">
              <PlainList items={o.requirements} />
            </Section>
          )}
          {o.brief && (
            <Section title="About the campaign" id="brief">
              <p className="fs-t-body" style={{ marginTop: 4 }}>{o.brief}</p>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

function BookingPlane({ booking, vehicle, pay, net }: { booking: NonNullable<Booking>; vehicle: VehicleSummary | null; pay: number; net: number }) {
  const copy = BOOKING[booking.status] ?? { label: booking.status.replaceAll("_", " "), tone: "neutral" as const, body: "" };
  return (
    <Plane decision={booking.status === "proof_required"}>
      <p className="fs-t-label"><span className={`fs-status is-${copy.tone}`}>{copy.label}</span>{vehicle ? ` · Your ${vehicle.year} ${vehicle.make} ${vehicle.model}` : ""}</p>
      <p className="fs-t-body" style={{ marginTop: 4 }}>{copy.body}</p>
      <Facts rows={[
        ["Placement", booking.zones.length ? booking.zones.map(placementLabel).join(", ") : "To be agreed"],
        ["Monthly", `${formatMoney(booking.monthly_cents)} · ${formatMoney(net)} to you after the fee`],
        ["Paid so far", booking.months_paid > 0 ? `${booking.months_paid} month${booking.months_paid === 1 ? "" : "s"}` : "Nothing yet"],
        ...(booking.starts_on ? [["Since", fmtDate(booking.starts_on)] as [string, React.ReactNode]] : []),
        ...(booking.ends_on ? [["Until", fmtDate(booking.ends_on)] as [string, React.ReactNode]] : []),
      ]} />
      {booking.artwork_url && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <span className="fs-media fs-contain fs-thumb" style={{ display: "block", width: 120, height: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={booking.artwork_url} alt="The artwork for this booking" loading="lazy" />
          </span>
          <span className="fs-t-meta">Artwork for this booking</span>
        </div>
      )}
      {booking.status === "proof_required" && <BookingProofForm bookingId={booking.id} />}
      {booking.status === "active" && <GoLink href="/earnings">Open Earnings</GoLink>}
      {vehicle && <GoLink href={`/me/vehicles/${vehicle.id}`}>View vehicle</GoLink>}
      <span className="fs-sr">{formatMoney(pay)} per month before the fee</span>
    </Plane>
  );
}
