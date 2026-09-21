import Link from "next/link";
import { Car, CurrencyDollar, CalendarBlank, MapPin, Wrench, Path, Camera, PaperPlaneTilt, Palette } from "@phosphor-icons/react/dist/ssr";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, vehicleQualifies, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import { placementLabel } from "@/components/v2/EarnCards";
import { formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { CarStage, type Zone } from "@/ds/car/CarStage";
import { ApplyVehicleButton, BookingProofForm, WithdrawCarButton } from "./CarControls";
import { RequestDecision } from "./RequestDecision";
import { DetailTop, fmtLong } from "./DetailParts";
import { Accordion, ActionCard, BizCard, Checks, DSection, Facts, Hero, Steps, Timeline } from "./DetailKit";
import { StickyAction } from "./StickyAction";

/**
 * Drive with a campaign: the car on the premium stage with the placement
 * drawn on it (and the artwork when the business supplied one) is the
 * hero; monthly pay on it; four facts; then the action the person's real
 * state allows (add a car, apply with a car, the application, the
 * booking). Place, drive, verify, get paid as the steps.
 */
export type CarApplication = { id: string; status: string; vehicle_id: string | null } | null;
export type Booking = { id: string; status: string; ends_on: string | null; starts_on: string | null; vehicle_id: string; zones: string[]; monthly_cents: number; artwork_url: string | null; months_paid: number } | null;

const BOOKING: Record<string, { label: string; tone: "success" | "warning" | "alert" | "neutral"; body: string }> = {
  creative_pending: { label: "Accepted", tone: "success", body: "Artwork in progress. Nothing paid yet." },
  installation_pending: { label: "Install next", tone: "warning", body: "The business arranges the install with you. Month one is paid once it confirms." },
  active: { label: "Running", tone: "success", body: "Paid monthly into your earnings." },
  proof_required: { label: "Photo needed", tone: "warning", body: "One clear photo of the decal keeps the booking running." },
  completed: { label: "Completed", tone: "success", body: "This campaign is done." },
  cancelled: { label: "Cancelled", tone: "neutral", body: "This booking was cancelled." },
  disputed: { label: "Under review", tone: "alert", body: "TapMart is looking into this booking." },
};
const STAGES = ["Apply", "Accepted", "Install", "Drive", "Verify", "Paid"];

/** Product placement zones mapped onto the stage's four drawable areas. */
export function stageZone(zones: readonly string[]): Zone | null {
  for (const z of zones) {
    if (z === "driver_door" || z === "passenger_door" || z === "hood") return "front_door";
    if (z === "driver_rear_door" || z === "passenger_rear_door" || z === "rear_panel") return "rear_door";
    if (z === "rear_window") return "rear_window";
    if (z === "full_side" || z === "partial_wrap" || z === "full_wrap") return "full_side";
  }
  return null;
}

export function CarDetail({ o, ctx, open, vehicles, application, booking, invite, feePct, businessCategory = null }: {
  o: Opportunity; ctx: V2Context; open: boolean; vehicles: VehicleSummary[]; application: CarApplication; booking: Booking; invite: Invite | null; feePct: number; businessCategory?: string | null;
}) {
  void ctx;
  const visual = o.details.media_url ?? o.business_cover ?? null;
  const art = o.details.artwork_url ?? null;
  const duration = o.details.duration_days ?? 30;
  const prefs = o.details.vehicle_prefs ?? {};
  const zones = o.details.placements ?? [];
  const placements = zones.map(placementLabel);
  const requestOpen = invite?.status === "sent";
  const declined = invite?.status === "declined";
  const live = application && application.status !== "withdrawn" ? application : booking ? { id: booking.id, status: "accepted", vehicle_id: booking.vehicle_id } : null;
  const checks = vehicles.map((v) => ({ v, q: vehicleQualifies(v, o) }));
  const firstMatch = checks.find((c) => c.q.ok);
  const appliedWith = live ? vehicles.find((v) => v.id === live.vehicle_id) ?? null : null;
  const invitedVehicle = invite?.vehicle_id ? vehicles.find((v) => v.id === invite.vehicle_id) ?? null : null;
  const fee = Math.floor((o.pay_cents * feePct) / 100);
  const net = o.pay_cents - fee;
  const deadline = fmtLong(o.deadline);
  const deadlineShort = o.deadline ? fmtDate(o.deadline) : null;
  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const returnTo = encodeURIComponent(`/o/${o.id}`);
  const bizSub = [businessCategory, o.city].filter(Boolean).join(" · ") || "Business";
  const bookingWord = booking ? BOOKING[booking.status] ?? { label: booking.status.replaceAll("_", " "), tone: "neutral" as const, body: "" } : null;
  const car = prefs.body_types?.some((b) => /wagon|suv|estate/i.test(b)) ? "wagon" : prefs.body_types?.some((b) => /hatch|compact/i.test(b)) ? "hatch" : "sedan";

  const now = booking
    ? (booking.status === "completed" ? 6 : booking.status === "active" ? 3 : booking.status === "proof_required" || booking.status === "disputed" ? 4 : booking.status === "installation_pending" ? 2 : 1)
    : live?.status === "accepted" ? 1 : live?.status === "applied" ? 0 : requestOpen ? 0 : -1;
  const canApply = !live && !requestOpen && !declined && open && Boolean(firstMatch);
  const stickyLabel = booking?.status === "proof_required" ? "Send photo" : canApply ? "Apply" : !live && vehicles.length === 0 ? "Add my car" : requestOpen ? "Answer request" : "See status";

  const status = requestOpen ? <span className="badge is-warning">Request for you</span>
    : declined ? <span className="badge">Declined</span>
    : bookingWord ? <span className={`badge is-${bookingWord.tone}`}>{bookingWord.label}</span>
    : live?.status === "applied" ? <span className="badge is-info">Applied</span>
    : live?.status === "accepted" ? <span className="badge is-success">Accepted</span>
    : live?.status === "declined" ? <span className="badge">Not selected</span>
    : !open ? <span className="badge">Closed</span>
    : spotsLeft === 0 ? <span className="badge">Full</span>
    : firstMatch ? <span className="badge is-success">Your car fits</span>
    : vehicles.length === 0 ? <span className="badge is-warning">Car needed</span>
    : <span className="badge is-warning">Check fit</span>;

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="dt-page">
        <div className="dt-main-top">
          <Hero kind="car" chip={<><Car size={16} aria-hidden />Car ad</>} business={{ name: o.business_name, logo: o.business_logo, verified: o.business_verified }} title={o.title} pay={o.pay_cents} per="a month">
            <div className="dt-hero-media">
              <CarStage car={car} zone={stageZone(zones)} artwork={art} artworkLabel={`${o.business_name} artwork`} floor="dark" tilt={6} scrollTurn={4} priority label={`A ${car} on the stage with the ${placements[0]?.toLowerCase() ?? "agreed"} placement marked`} />
            </div>
          </Hero>
          <Facts items={[
            { icon: <CurrencyDollar size={20} aria-hidden />, value: `${formatMoney(o.pay_cents).replace(/\.00$/, "")}/mo`, label: "Pay" },
            { icon: <CalendarBlank size={20} aria-hidden />, value: `${duration} days`, label: "Term" },
            { icon: <MapPin size={20} aria-hidden />, value: o.city ?? "Local", label: "Area" },
            { icon: <Car size={20} aria-hidden />, value: placements[0] ?? "To agree", label: placements.length > 1 ? `Placement +${placements.length - 1}` : "Placement" },
          ]} />
        </div>

        <aside className="dt-rail">
          <ActionCard pay={o.pay_cents} per="a month" net={net} feePct={feePct} status={status}
            facts={[{ v: `${duration} days`, l: "Term" }, { v: spotsLeft > 0 ? `${spotsLeft} left` : "Full", l: "Spots" }, { v: deadlineShort ?? "No date", l: invite ? "Deadline" : "Apply by" }]}>
            {requestOpen && invite && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>{o.business_name} wants to advertise on your {invitedVehicle ? `${invitedVehicle.year} ${invitedVehicle.make} ${invitedVehicle.model}` : "car"}.</p>
                <p className="t-meta" style={{ marginTop: 4 }}>{formatMoney(invite.pay_cents)} a month. Paid once the decal is installed.</p>
                {invite.message && <p className="t-meta" style={{ marginTop: 6 }}>{invite.message}</p>}
                <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="car_ads" />
              </div>
            )}
            {declined && <p className="t-meta" style={{ marginTop: 12 }}>You declined this request.</p>}

            {live?.status === "applied" && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>Waiting for the business to pick drivers.</p>
                <p className="t-meta" style={{ marginTop: 4 }}>{appliedWith ? `With your ${appliedWith.year} ${appliedWith.make} ${appliedWith.model}. ` : ""}Nothing is booked until they accept.</p>
                <div style={{ marginTop: 10 }}><WithdrawCarButton campaignId={o.id} /></div>
              </div>
            )}
            {live?.status === "declined" && (
              <p className="t-meta" style={{ marginTop: 12 }}>The business went with other drivers. Your car stays listed. <Link href="/home?k=cars" className="link-accent">Other car campaigns</Link></p>
            )}
            {live?.status === "accepted" && booking && bookingWord && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>{bookingWord.body}</p>
                <dl className="dt-kv">
                  <dt>Car</dt><dd>{appliedWith ? `${appliedWith.year} ${appliedWith.make} ${appliedWith.model}` : "Your car"}</dd>
                  <dt>Placement</dt><dd>{booking.zones.length ? booking.zones.map(placementLabel).join(", ") : "To be agreed"}</dd>
                  <dt>Paid so far</dt><dd>{booking.months_paid > 0 ? `${booking.months_paid} month${booking.months_paid === 1 ? "" : "s"}` : "Nothing yet"}</dd>
                  {booking.starts_on && <><dt>Since</dt><dd>{fmtDate(booking.starts_on)}</dd></>}
                  {booking.ends_on && <><dt>Until</dt><dd>{fmtDate(booking.ends_on)}</dd></>}
                </dl>
                {booking.status === "proof_required" && <BookingProofForm bookingId={booking.id} />}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {booking.status === "active" && <Link href="/earnings" className="btn btn-sm">Earnings</Link>}
                  {appliedWith && <Link href={`/me/vehicles/${appliedWith.id}`} className="btn btn-sm">My car</Link>}
                </div>
              </div>
            )}
            {live?.status === "accepted" && !booking && <p className="t-body" style={{ marginTop: 12, fontWeight: 600 }}>The business picked your car and is setting things up.</p>}

            {!live && !requestOpen && !declined && (
              vehicles.length === 0 ? (
                <>
                  <Link href={`/me/vehicles/new?return=${returnTo}`} className="fs-btn fs-btn-primary"><Car size={20} aria-hidden /> Add my car</Link>
                  <p className="dt-action-note">Four photos, about five minutes, once.</p>
                </>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {checks.map(({ v, q }) => (
                    <div key={v.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ width: 88, aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--tm-surface2)", flexShrink: 0 }}>
                        {v.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={v.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                          : <span className="fs-video-fallback" style={{ fontSize: 12, background: "var(--tm-surface2)", color: "var(--tm-muted)" }}>No photo</span>}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="t-body" style={{ fontWeight: 600 }}>{v.year} {v.make} {v.model}</p>
                        {q.ok ? <p className="t-meta" style={{ color: "var(--tm-success)", fontWeight: 500 }}>Fits this campaign</p>
                          : <p className="t-meta">{q.reasons.join(" · ")}</p>}
                        {!q.ok && v.status !== "listed" && <Link href={`/me/vehicles/${v.id}`} className="btn btn-sm" style={{ marginTop: 6 }}>Finish my car</Link>}
                        {q.ok && open && <ApplyVehicleButton campaignId={o.id} vehicleId={v.id} first={firstMatch?.v.id === v.id} />}
                        {q.ok && !open && <p className="t-meta" style={{ marginTop: 4 }}>This campaign is closed.</p>}
                      </div>
                    </div>
                  ))}
                  <p className="dt-action-note" style={{ marginTop: 0 }}>The business picks drivers. Paid once the decal is on.</p>
                </div>
              )
            )}
          </ActionCard>
        </aside>

        <div className="dt-main-rest">
          <DSection title="What to do" id="steps">
            <Steps steps={[
              { text: "Apply with your car", sub: "The business picks drivers", icon: <Car size={20} aria-hidden /> },
              { text: "Get the decal installed", sub: `On the ${placements[0]?.toLowerCase() ?? "agreed placement"}`, icon: <Wrench size={20} aria-hidden /> },
              { text: "Drive like normal", sub: `${duration} days${o.city ? ` around ${o.city}` : ""}`, icon: <Path size={20} aria-hidden /> },
              { text: "Send a photo when asked", sub: "Paid monthly into Earnings", icon: <Camera size={20} aria-hidden /> },
            ]} />
          </DSection>

          <DSection title="Requirements" id="requirements">
            <Checks items={[
              ...(placements.length ? [`Placement: ${placements.join(", ")}`] : []),
              ...(prefs.colors?.length ? [`Colour: ${prefs.colors.join(" or ")}`] : []),
              ...(prefs.body_types?.length ? [`Body: ${prefs.body_types.join(" or ")}`] : []),
              ...(o.city ? [`Drive around ${o.city}`] : []),
              ...o.requirements,
            ]} />
            {(o.brief || art || visual) && (
              <div style={{ marginTop: 8 }}>
                <Accordion title="Artwork and campaign">
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {art && (
                      <div>
                        <span style={{ display: "block", width: 140, aspectRatio: "3 / 2", borderRadius: 12, overflow: "hidden", background: "var(--tm-surface2)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={art} alt="The artwork that goes on the car" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} loading="lazy" />
                        </span>
                        <InspectButton src={art} alt={`The artwork from ${o.business_name}, at its original ratio`} label="Zoom artwork" className="btn btn-sm" style={{ marginTop: 6 }} />
                      </div>
                    )}
                    {visual && visual !== art && (
                      <div>
                        <span style={{ display: "block", width: 140, aspectRatio: "3 / 2", borderRadius: 12, overflow: "hidden", background: "var(--tm-surface2)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={visual} alt="Campaign visual" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                        </span>
                        <InspectButton src={visual} alt={`Campaign visual for ${o.title}`} label="Zoom visual" className="btn btn-sm" style={{ marginTop: 6 }} />
                      </div>
                    )}
                  </div>
                  {!art && <p className="t-meta" style={{ marginTop: 8 }}><Palette size={16} aria-hidden style={{ verticalAlign: "-3px" }} /> Artwork follows after drivers are accepted.</p>}
                  {o.brief && <p className="t-body" style={{ marginTop: 12, color: "var(--tm-text2)" }}>{o.brief}</p>}
                </Accordion>
              </div>
            )}
          </DSection>

          <DSection title="Business" id="business">
            <BizCard name={o.business_name} logo={o.business_logo} sub={bizSub} href={`/b/${o.business_slug}`} verified={o.business_verified} />
          </DSection>

          <DSection title="Timeline" id="timeline">
            <Timeline stages={STAGES} now={now} warn={booking?.status === "proof_required" || booking?.status === "disputed"} />
          </DSection>

          <div style={{ marginTop: 28 }}>
            <Accordion title="Payment details">
              <dl className="dt-kv" style={{ marginTop: 0 }}>
                <dt>Pay</dt><dd>{formatMoney(o.pay_cents)} a month per car</dd>
                <dt>Fee</dt><dd>{formatMoney(fee)} ({feePct}%)</dd>
                <dt>You keep</dt><dd>{formatMoney(net)} a month</dd>
                <dt>When</dt><dd>Month one once the install is confirmed, then each month</dd>
                {deadline && <><dt>Apply by</dt><dd>{deadline}</dd></>}
              </dl>
            </Accordion>
          </div>
          <p className="fs-sr"><PaperPlaneTilt size={1} aria-hidden />{formatMoney(o.pay_cents)} a month before the fee</p>
        </div>
      </div>
      <StickyAction pay={`${formatMoney(o.pay_cents).replace(/\.00$/, "")}/mo`} per="a month" label={stickyLabel} tone={canApply || requestOpen || booking?.status === "proof_required" || (!live && vehicles.length === 0) ? "primary" : "quiet"} />
    </main>
  );
}
