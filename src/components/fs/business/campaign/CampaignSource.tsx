import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import type { BusinessCampaign } from "@/lib/fs/business-campaigns";
import { Money } from "@/components/fs/parts";
import { Img } from "@/components/fs/Img";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";
import { InspectButton } from "@/components/fs/SourceInspector";
import { KIND_WORD, payUnit } from "./parts";

/**
 * The campaign's source and its commitment, joined. Recreate and Story:
 * the reference or the supplied creative in a graphite housing, with the
 * commitment plane starting one shift lower (graphite facts, cobalt pay),
 * the same joint the approved opportunity detail uses. Car: the placement
 * diagram and the artwork as artwork, with a white commitment plane one
 * shift lower carrying the monthly pay. Nothing is composited onto a car.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function CampaignSource({ campaign }: { campaign: BusinessCampaign }) {
  const d = campaign.details;
  const story = campaign.kind === "instagram_story";
  const audience = campaign.audience === "direct" ? "Direct request" : "Public";
  if (campaign.kind === "car_ads") {
    const zones = d.placements ?? [];
    return (
      <div>
        <div style={{ border: "1px solid var(--fs-divider)", background: "#fff" }}><PlacementDiagram zones={zones} width={448} /></div>
        <p className="fs-t-meta" style={{ marginTop: 8 }}>{zones.length ? zones.map((z) => ZONE_LABELS[z] ?? z).join(", ") : "No placement recorded"} · on a diagram</p>
        {d.artwork_url ? (
          <div style={{ marginTop: 12 }}>
            <Img src={d.artwork_url} alt="Campaign artwork" className="fs-media" style={{ width: 200, height: "auto", display: "block" }} />
            <p className="fs-t-meta" style={{ marginTop: 4 }}>Your artwork, shown as artwork</p>
            <InspectButton src={d.artwork_url} alt="Campaign artwork" label="View artwork" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} />
          </div>
        ) : <p className="fs-t-meta" style={{ marginTop: 8 }}>No artwork yet. A car cannot be installed without it.</p>}
        <div className="fs-source-commit">
          <p className="fs-t-meta">{KIND_WORD[campaign.kind]} · {audience}</p>
          <Money cents={campaign.pay_cents} per={payUnit(campaign.kind)} className="fs-money-detail" />
          <p className="fs-t-meta" style={{ marginTop: 8 }}>Paid when you confirm an installation, then each month you confirm.</p>
        </div>
      </div>
    );
  }
  const url = story ? d.creative_url ?? null : d.reference_media_url ?? null;
  const video = Boolean(url && VIDEO.test(url));
  const caption = story ? "Creative · posted as it is" : video ? "Reference · Reel" : "Reference · still";
  return (
    <div>
      <div className="fs-op-recreate is-detail">
        <div className={`fs-media fs-contain${story ? " fs-sheet-source" : ""}`} style={{ width: 184, height: 327 }}>
          {url ? (
            video ? <video src={url} controls playsInline preload="metadata" className="fs-ref-media" aria-label={story ? "The supplied creative" : "The reference Reel"} />
              : <Img src={url} alt={story ? "The supplied creative" : "The reference"} className="fs-ref-media" />
          ) : (
            <div className="fs-video-fallback">{story ? "No creative" : "No reference file"}<span className="fs-video-note">{campaign.reference_url ? "Linked reference below" : "None was uploaded"}</span></div>
          )}
          {url && <span className="fs-media-caption">{caption}</span>}
        </div>
        <div className="fs-joint fs-recreate-commitment">
          <div className="fs-on-dark" style={{ minHeight: 327, display: "flex", flexDirection: "column", color: "var(--fs-on-dark)" }}>
            <div style={{ padding: 12, flex: 1, background: "var(--fs-graphite)" }}>
              <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)" }}>{KIND_WORD[campaign.kind]} · {audience}</p>
              <p className="fs-t-task" style={{ color: "var(--fs-on-dark)", marginTop: 4 }}>{campaign.title}</p>
              {campaign.city && <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)", marginTop: 4 }}>{campaign.city}</p>}
              <p className="fs-t-meta" style={{ color: "var(--fs-on-dark)", marginTop: 8 }}>{story ? "Paid when you approve a proof." : "Paid when you approve a video."}</p>
            </div>
            <div style={{ background: "var(--fs-accent)", padding: 12, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Money cents={campaign.pay_cents} per={payUnit(campaign.kind)} className="fs-money-detail" dark />
            </div>
          </div>
        </div>
      </div>
      <div className="fs-source-actions" style={{ marginTop: 8 }}>
        {url && !video && <InspectButton src={url} alt={story ? "The supplied creative" : "The reference"} label={story ? "Open creative" : "Open reference"} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} />}
        {campaign.reference_url && <a href={campaign.reference_url} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} target="_blank" rel="noreferrer">Open the linked Reel</a>}
      </div>
    </div>
  );
}
