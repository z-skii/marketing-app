export type PostFormat = "reel" | "photo" | "story" | "post";

export type CalendarPost = {
  id: string;
  platform: string;
  status: string;
  title: string;
  copy: string | null;
  caption: string | null;
  format: PostFormat | null;
  source: "manual" | "ai" | "template";
  thumbnail_url: string | null;
  media_urls: string[];
  scheduled_for: string | null;
  recommended_time: string | null;
  published_at: string | null;
  created_at: string;
};

/** Plain labels for calendar_post_status values. Nothing on the Content tab shows the raw enum. */
const CONTENT_STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  draft: "Draft",
  needs_approval: "Needs approval",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

export function contentStatusLabel(status: string): string {
  return CONTENT_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

/** Chip tone for a post status: rise for done states, alert for failure, quiet for the rest. */
export function contentStatusTone(status: string): "ink" | "faint" | "rise" | "alert" {
  switch (status) {
    case "approved":
    case "published":
      return "rise";
    case "failed":
      return "alert";
    case "idea":
    case "draft":
      return "faint";
    default:
      return "ink";
  }
}

const SHOOT_STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  scheduled: "Booked",
  done: "Done",
  cancelled: "Cancelled",
};

export function shootStatusLabel(status: string): string {
  return SHOOT_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

export function shootStatusTone(status: string): "ink" | "faint" | "rise" | "alert" {
  return status === "done" ? "rise" : status === "cancelled" ? "faint" : "ink";
}

/** Video by file extension; everything else is treated as a photo. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

/** One tile in the content library. `postStatus` is set only for calendar post media. */
export type LibraryItem = {
  url: string;
  kind: "photo" | "video";
  /** "From the Sep 18 shoot", "Post: Behind the counter", "Campaign: Employee POV", "Brand cover". */
  source: string;
  postStatus: string | null;
};
