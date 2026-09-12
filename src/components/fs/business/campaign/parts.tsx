import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";
import { Img } from "@/components/fs/Img";

/**
 * Words and small pieces shared by the campaign list, detail and review
 * screens. Every label maps to a real backend state or a real next action;
 * a word never claims more than the record does.
 */
export const KIND_WORD: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad", ugc: "UGC", photography: "Photography", videography: "Video", content: "Content", general: "Campaign" };

export function payUnit(kind: string): string {
  return kind === "recreate_reel" ? "per approved video" : kind === "instagram_story" ? "per approved Story" : kind === "car_ads" ? "per car, per month" : "per approval";
}

export function STATUS_WORD(r: { status: string; audience?: string; invite_status?: string | null }): { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" } {
  if (r.audience === "direct" && r.invite_status === "declined") return { label: "Declined", tone: "problem" };
  if (r.audience === "direct" && r.invite_status === "cancelled") return { label: "Withdrawn", tone: "neutral" };
  switch (r.status) {
    case "draft": return { label: "Draft", tone: "neutral" };
    case "open": return r.audience === "direct" && r.invite_status === "sent" ? { label: "Request sent", tone: "waiting" } : { label: "Open", tone: "confirmed" };
    case "paused": return { label: "Paused", tone: "waiting" };
    case "completed": return { label: "Completed", tone: "confirmed" };
    case "closed": return { label: "Closed", tone: "neutral" };
    case "cancelled": return { label: "Cancelled", tone: "neutral" };
    default: return { label: r.status.replaceAll("_", " "), tone: "neutral" };
  }
}

/** The one thing waiting on the business, or the honest reason nothing is. */
export function nextAction(r: { kind: string; status: string; audience: string; invite_status: string | null; waiting: number; applications: number; artwork: number; needs_artwork?: number; needs_install?: number; approved: number; slots: number }): { label: string; needs: boolean } {
  if (r.status === "draft") return { label: "Publish when ready", needs: true };
  if (r.waiting > 0) return r.kind === "instagram_story" ? { label: `Check ${r.waiting} proof${r.waiting === 1 ? "" : "s"}`, needs: true } : { label: `Review ${r.waiting} video${r.waiting === 1 ? "" : "s"}`, needs: true };
  if (r.applications > 0) return r.kind === "car_ads" ? { label: `Review ${r.applications} driver${r.applications === 1 ? "" : "s"}`, needs: true } : { label: `Review ${r.applications} applicant${r.applications === 1 ? "" : "s"}`, needs: true };
  if ((r.needs_install ?? 0) > 0) return { label: `Confirm ${r.needs_install} installation${r.needs_install === 1 ? "" : "s"}`, needs: true };
  if ((r.needs_artwork ?? 0) > 0) return { label: `Send artwork for ${r.needs_artwork} car${r.needs_artwork === 1 ? "" : "s"}`, needs: true };
  if (r.artwork > 0) return { label: `${r.artwork} car${r.artwork === 1 ? "" : "s"} waiting on you`, needs: true };
  if (r.audience === "direct") {
    if (r.invite_status === "sent") return { label: "Waiting for an answer", needs: false };
    if (r.invite_status === "accepted") return { label: "Accepted. Waiting for their work", needs: false };
    if (r.invite_status === "declined") return { label: "They declined", needs: false };
  }
  if (["closed", "completed", "cancelled"].includes(r.status)) return { label: "Finished", needs: false };
  if (r.approved >= r.slots) return { label: "Every spot approved", needs: false };
  return { label: "Nothing waiting on you", needs: false };
}

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/** The campaign's own media at a small size: the reference or creative at 9:16, the vehicle photo, or the placement diagram. Never a stock image. */
export function CampaignThumb({ kind, media, vehicle, placements }: { kind: string; media: string | null; vehicle: string | null; placements: string[] }) {
  if (kind === "car_ads") {
    if (vehicle) {
      return <span className="fs-campaign-thumb is-car"><Img src={vehicle} alt="" loading="lazy" /></span>;
    }
    return <span className="fs-campaign-thumb is-car is-diagram"><PlacementDiagram zones={placements} width={84} /></span>;
  }
  const sheet = kind === "instagram_story" ? " is-story" : "";
  if (!media) return <span className={`fs-campaign-thumb is-tall fs-flow-empty${sheet}`} aria-hidden><span className="fs-t-meta" style={{ fontSize: 11, lineHeight: "14px", textAlign: "center" }}>No media</span></span>;
  if (VIDEO.test(media)) return <span className={`fs-campaign-thumb is-tall${sheet}`}><video src={media} muted playsInline preload="metadata" aria-hidden /></span>;
  return <span className={`fs-campaign-thumb is-tall${sheet}`}><Img src={media} alt="" loading="lazy" /></span>;
}

export function fmtDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export const SUBMISSION_WORD: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  submitted: { label: "Submitted", tone: "waiting" },
  under_review: { label: "In review", tone: "waiting" },
  revision_requested: { label: "Changes requested", tone: "waiting" },
  approved: { label: "Approved", tone: "confirmed" },
  paid: { label: "Approved and paid", tone: "confirmed" },
  rejected: { label: "Rejected", tone: "problem" },
};

export const BOOKING_WORD: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral"; next: string | null }> = {
  creative_pending: { label: "Waiting on your artwork", tone: "waiting", next: "Send artwork" },
  installation_pending: { label: "Ready to install", tone: "waiting", next: "Confirm installation" },
  active: { label: "On the road", tone: "confirmed", next: "Pay this month" },
  proof_required: { label: "Driver owes a photo", tone: "waiting", next: null },
  completed: { label: "Completed", tone: "confirmed", next: null },
  cancelled: { label: "Cancelled", tone: "neutral", next: null },
  disputed: { label: "Under review", tone: "problem", next: null },
};
