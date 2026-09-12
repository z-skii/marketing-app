import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import type { BusinessCampaign, CarBooking } from "@/lib/fs/business-campaigns";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";
import { InspectButton } from "@/components/fs/SourceInspector";

/**
 * The media a campaign is about, as it is. Recreate: the reference at
 * 9:16. Story: the supplied creative at 9:16. Car: the placement diagram,
 * the artwork as artwork, and the real cars once they are booked. Nothing
 * is ever composited onto a vehicle.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function CampaignSource({ campaign, bookings }: { campaign: BusinessCampaign; bookings: CarBooking[] }) {
  const d = campaign.details;
  if (campaign.kind === "car_ads") {
    const zones = d.placements ?? [];
    return (
      <div>
        <div style={{ border: "1px solid var(--fs-divider)", background: "#fff" }}><PlacementDiagram zones={zones} width={448} /></div>
        <p className="fs-t-meta" style={{ marginTop: 8 }}>{zones.length ? zones.map((z) => ZONE_LABELS[z] ?? z).join(", ") : "No placement recorded"} · on a diagram</p>
        {d.artwork_url ? (
          <div style={{ marginTop: 12 }}>
            <InspectButton src={d.artwork_url} alt="Campaign artwork" label="Inspect the artwork" className="fs-media" style={{ display: "block", width: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.artwork_url} alt="" style={{ width: 200, height: "auto", display: "block" }} />
            </InspectButton>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>Your artwork, shown as artwork</p>
          </div>
        ) : <p className="fs-t-meta" style={{ marginTop: 8 }}>No artwork yet. A car cannot be installed without it.</p>}
        {bookings.some((b) => b.photo_url) && (
          <ul className="fs-source-cars" aria-label="Booked cars">
            {bookings.filter((b) => b.photo_url).slice(0, 4).map((b) => (
              <li key={b.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.photo_url as string} alt={`${b.year} ${b.make} ${b.model}`} className="fs-media" loading="lazy" />
                <span className="fs-t-meta">{b.year} {b.make} {b.model}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  const url = campaign.kind === "instagram_story" ? d.creative_url ?? null : d.reference_media_url ?? null;
  const caption = campaign.kind === "instagram_story" ? "The creative people post as it is" : "The reference creators recreate";
  if (!url) {
    return (
      <div>
        <div className="fs-media fs-flow-story fs-flow-empty" aria-hidden><span className="fs-t-meta">{campaign.kind === "instagram_story" ? "No creative" : "No reference file"}</span></div>
        <p className="fs-t-meta" style={{ marginTop: 8 }}>{campaign.reference_url ? <>Linked reference · <a href={campaign.reference_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">open it</a></> : caption}</p>
      </div>
    );
  }
  return (
    <div>
      {VIDEO.test(url) ? (
        <video className="fs-media fs-flow-story" src={url} controls muted playsInline preload="metadata" aria-label={caption} />
      ) : (
        <InspectButton src={url} alt={caption} label={`Inspect ${campaign.kind === "instagram_story" ? "the creative" : "the reference"}`} className="fs-media fs-flow-story" style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </InspectButton>
      )}
      <p className="fs-t-meta" style={{ marginTop: 8 }}>{caption}</p>
    </div>
  );
}
