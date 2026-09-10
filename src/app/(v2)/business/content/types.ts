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
  scheduled_for: string | null;
  recommended_time: string | null;
  published_at: string | null;
  created_at: string;
};
