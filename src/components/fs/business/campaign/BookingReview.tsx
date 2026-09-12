"use client";

import Link from "next/link";
import { useState } from "react";
import { advanceBooking, payBookingMonth } from "@/app/(v2)/cars/actions";
import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import type { BusinessCampaign, CarBooking, CarProof } from "@/lib/fs/business-campaigns";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Facts } from "@/components/fs/work/DetailParts";
import { FsUploader } from "@/components/fs/work/Uploader";
import { InspectButton } from "@/components/fs/SourceInspector";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";
import { BOOKING_WORD, fmtDay } from "./parts";
import { useAction, ErrorLine } from "./Controls";
import type { FundingFacts } from "@/components/fs/business/flows/FundingPlane";

/**
 * One booked car. The stages are kept apart on purpose: the application
 * was accepted, the booking exists, the artwork is sent, the installation
 * is confirmed (which pays the first month), each further month is paid
 * on its own, the driver's photos are proof the business looks at. There
 * is no "approve proof" action in the product, so none is drawn.
 */
export function BookingReview({ campaign, booking: b, proofs, monthsPaid, funding }: { campaign: BusinessCampaign; booking: CarBooking; proofs: CarProof[]; monthsPaid: number; funding: FundingFacts }) {
  const word = BOOKING_WORD[b.status] ?? { label: b.status, tone: "neutral" as const, next: null };
  const [artwork, setArtwork] = useState("");
  const { pending, error, run } = useAction();
  const name = b.display_name ?? b.username;
  const covered = funding.walletCents >= b.monthly_cents;
  const campaignArtwork = campaign.details.artwork_url ?? null;
  const installation = proofs.find((p) => p.kind === "installation") ?? null;
  const later = proofs.filter((p) => p.kind !== "installation");

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback={`/business/campaigns/${campaign.id}`} label="Campaign" />
        <span className={`fs-status is-${word.tone}`}>{word.label}</span>
      </div>
      <h1 className="fs-t-page" style={{ marginTop: 8 }}>{b.year} {b.make} {b.model}</h1>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>{b.zones.map((z) => ZONE_LABELS[z] ?? z).join(", ")} · {formatMoney(b.monthly_cents)} per month</p>

      <div className="fs-detail" style={{ marginTop: 12 }}>
        <div className="fs-detail-source">
          {b.photo_url ? (
            <InspectButton src={b.photo_url} alt={`${b.year} ${b.make} ${b.model}`} label="Inspect the car photo" className="fs-media" style={{ display: "block", width: "100%", aspectRatio: "3 / 2" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </InspectButton>
          ) : <div className="fs-media fs-flow-empty" style={{ aspectRatio: "3 / 2" }} aria-hidden><span className="fs-t-meta">No car photo</span></div>}
          <p className="fs-t-meta" style={{ marginTop: 8 }}>The driver&apos;s photo of the car, as uploaded</p>
          <div style={{ marginTop: 12, border: "1px solid var(--fs-divider)", background: "#fff" }}><PlacementDiagram zones={b.zones} width={448} /></div>
          <p className="fs-t-meta" style={{ marginTop: 8 }}>Booked placement on a diagram. No ad is drawn onto the car.</p>
          {(b.artwork_url || campaignArtwork) && (
            <div style={{ marginTop: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(b.artwork_url ?? campaignArtwork) as string} alt="Artwork" className="fs-media" style={{ width: 200, height: "auto", display: "block" }} />
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{b.artwork_url ? "Artwork sent to the driver" : "Campaign artwork, not sent to this driver yet"}</p>
            </div>
          )}
        </div>

        <div className="fs-joint">
          <div className="fs-person-line">
            <Avatar src={b.avatar_url} name={name} size={48} />
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-task" style={{ display: "block" }}>{name} <span className="fs-t-meta">@{b.username}</span></span>
              <span className="fs-t-meta" style={{ display: "block" }}>Driver · booked {fmtDay(b.created_at)}</span>
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            <Facts rows={[
              ["Booking", word.label],
              ["Months paid", `${monthsPaid} · ${formatMoney(monthsPaid * b.monthly_cents)}`],
              ["On the road since", b.starts_on ? fmtDay(b.starts_on) ?? "" : "Not yet"],
              ["Installation photo", installation ? `Received ${fmtDay(installation.created_at)}` : "None yet"],
              ["Credit now", formatMoney(funding.walletCents)],
            ]} />
          </div>

          <div className="fs-plane is-decision" style={{ marginTop: 16 }} aria-label="Next step">
            {b.status === "creative_pending" && (
              <>
                <p className="fs-t-label">Send the artwork</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>The driver needs the file to get it printed. Nothing is paid at this step.</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
                  <FsUploader id={`fs-art-${b.id}`} folder="campaigns" accept="image/*" label={artwork ? "Replace artwork" : "Upload artwork"} onUploaded={(u) => setArtwork(u[0])} />
                  {campaignArtwork && !artwork && <button type="button" className="fs-btn fs-btn-secondary" onClick={() => setArtwork(campaignArtwork)}>Use the campaign artwork</button>}
                </div>
                {artwork && (
                  <div style={{ marginTop: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={artwork} alt="Artwork to send" className="fs-media" style={{ width: 160, height: "auto", display: "block" }} />
                    <button type="button" className="fs-btn fs-btn-primary" style={{ marginTop: 8 }} disabled={pending} onClick={() => run(() => advanceBooking(b.id, artwork))}>{pending ? "Sending" : "Send artwork"}</button>
                  </div>
                )}
              </>
            )}
            {b.status === "installation_pending" && (
              <>
                <p className="fs-t-label">Confirm the installation</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>Arrange the install with the driver. {installation ? "Their installation photo is below." : "They have not sent an installation photo yet."} Confirming pays the first month, <b className="fs-tnum">{formatMoney(b.monthly_cents)}</b>, from your credit now.</p>
                <button type="button" className="fs-btn fs-btn-primary" style={{ marginTop: 12 }} disabled={pending || !covered} onClick={() => run(() => advanceBooking(b.id))}>{pending ? "Paying" : `Confirm installation and pay ${formatMoney(b.monthly_cents)}`}</button>
                {!covered && <p className="fs-t-meta" style={{ marginTop: 8 }}>Your credit does not cover the first month. <Link href="/business/billing" className="fs-link-ink fs-link-ul">Add credit</Link> first.</p>}
              </>
            )}
            {b.status === "active" && (
              <>
                <p className="fs-t-label">On the road</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>Each month you confirm pays <b className="fs-tnum">{formatMoney(b.monthly_cents)}</b> to the driver from your credit. Look at their photos first. When the campaign is over, mark it completed; nothing is paid for that.</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button type="button" className="fs-btn fs-btn-primary" disabled={pending || !covered} onClick={() => run(() => payBookingMonth(b.id))}>{pending ? "Paying" : `Pay this month, ${formatMoney(b.monthly_cents)}`}</button>
                  <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" disabled={pending} onClick={() => run(() => advanceBooking(b.id))}>Mark completed</button>
                </div>
                {!covered && <p className="fs-t-meta" style={{ marginTop: 8 }}>Your credit does not cover a month. <Link href="/business/billing" className="fs-link-ink fs-link-ul">Add credit</Link> first.</p>}
              </>
            )}
            {b.status === "proof_required" && (<><p className="fs-t-label">Waiting on the driver</p><p className="fs-t-body" style={{ marginTop: 4 }}>They owe a photo before anything else happens. Nothing for you to do yet.</p></>)}
            {b.status === "completed" && (<><p className="fs-t-label">Completed</p><p className="fs-t-body" style={{ marginTop: 4 }}>{monthsPaid} month{monthsPaid === 1 ? "" : "s"} paid, {formatMoney(monthsPaid * b.monthly_cents)} in total.</p></>)}
            {b.status === "cancelled" && (<><p className="fs-t-label">Cancelled</p><p className="fs-t-body" style={{ marginTop: 4 }}>This booking ended. Nothing further is paid.</p></>)}
            {b.status === "disputed" && (<><p className="fs-t-label">Under review</p><p className="fs-t-body" style={{ marginTop: 4 }}>TapMart is looking at this booking. Payments are paused until it is settled.</p></>)}
            <ErrorLine error={error} />
          </div>

          <div style={{ marginTop: 24 }}>
            <p className="fs-t-section">Photos from the driver</p>
            {proofs.length === 0 ? <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>None yet. Drivers send an installation photo, then one each week.</p> : (
              <ul className="fs-proof-grid" style={{ marginTop: 8 }}>
                {[installation, ...later].filter(Boolean).map((p) => (
                  <li key={(p as CarProof).id}>
                    {(p as CarProof).media_url ? (
                      <InspectButton src={(p as CarProof).media_url as string} alt={`${(p as CarProof).kind} photo`} label="Inspect" className="fs-media fs-proof" icon={false}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={(p as CarProof).media_url as string} alt="" />
                      </InspectButton>
                    ) : <span className="fs-media fs-proof fs-flow-empty" aria-hidden><span className="fs-t-meta">No image</span></span>}
                    <span className="fs-t-meta" style={{ display: "block", marginTop: 4 }}>{(p as CarProof).kind === "installation" ? "Installation" : (p as CarProof).kind === "odometer" ? `Odometer · ${(p as CarProof).odometer_miles?.toLocaleString() ?? "?"} miles` : "Weekly photo"} · {fmtDay((p as CarProof).created_at)}</span>
                    {(p as CarProof).note && <span className="fs-t-meta" style={{ display: "block" }}>{(p as CarProof).note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
