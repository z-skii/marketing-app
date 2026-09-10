/**
 * Labels for the Content screens. Nothing here shows a raw enum value, and
 * every label describes something that exists (a booked shoot, a delivered
 * file, a scheduled post).
 */

export type ChipTone = "ink" | "faint" | "rise" | "alert" | "signal";

const SHOOT_STATUS_LABEL: Record<string, string> = {
  planned: "Being scheduled",
  scheduled: "Booked",
  done: "Done",
  cancelled: "Cancelled",
};

export function shootStatusLabel(status: string): string {
  return SHOOT_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

export function shootStatusTone(status: string): ChipTone {
  return status === "done" ? "rise" : status === "cancelled" ? "faint" : "ink";
}

/** "Content on its way" / "Content delivered": the delivery side of a shoot. */
export function deliveryLabel(delivery: string): string | null {
  return delivery === "processing" ? "Content on its way" : delivery === "delivered" ? "Content delivered" : null;
}

const DELIVERABLE_STATUS_LABEL: Record<string, string> = {
  new: "New",
  approved: "Ready",
  rejected: "Not used",
  scheduled: "Scheduled",
  published: "Published",
};

export function deliverableStatusLabel(status: string, editNote?: string | null): string {
  if (status === "new" && editNote) return "Edit requested";
  return DELIVERABLE_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

export function deliverableStatusTone(status: string, editNote?: string | null): ChipTone {
  if (status === "new" && editNote) return "alert";
  switch (status) {
    case "new": return "signal";
    case "approved": case "scheduled": case "published": return "rise";
    case "rejected": return "faint";
    default: return "ink";
  }
}

/** "Instagram Reel", "Instagram", "Story": the platform and format of a scheduled post. */
export function postKindLabel(platform: string, format: string | null): string {
  const name = PLATFORM_LABEL[platform] ?? platform.replaceAll("_", " ");
  if (format === "story") return `${name} Story`;
  if (format === "reel") return `${name} Reel`;
  return name;
}

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google_business: "Google", other: "Other",
};

export const FORMAT_LABEL: Record<string, string> = { reel: "Reel", photo: "Photo", story: "Story", post: "Post" };

/** A scheduled or published post built from a real deliverable. */
export type ScheduledPost = {
  id: string;
  deliverable_id: string;
  platform: string;
  status: "scheduled" | "published";
  title: string;
  caption: string | null;
  format: string | null;
  kind: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  /** ISO instant. */
  when: string;
};
