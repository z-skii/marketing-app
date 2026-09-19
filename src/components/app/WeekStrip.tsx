import { dayKeyOf, timeOf } from "@/app/(v2)/business/content/dates";
import { InstagramIcon, FacebookIcon, TiktokIcon, GoogleIcon, GlobeIcon } from "@/ds/icons";

/**
 * This week as seven columns: each real scheduled or published post as a
 * thumbnail with its platform and status, at its time. Days without a
 * post stay empty; nothing is staged.
 */
type Post = { id: string; platform: string; status: string; when: string | null; title: string; thumb: string | null };
const PLATFORM: Record<string, typeof InstagramIcon> = { instagram: InstagramIcon, facebook: FacebookIcon, tiktok: TiktokIcon, google_business: GoogleIcon };
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function WeekStrip({ posts, timeZone, todayKey }: { posts: Post[]; timeZone: string; todayKey: string }) {
  const today = new Date(`${todayKey}T12:00:00Z`);
  const dow = (today.getUTCDay() + 6) % 7; // Monday first
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setUTCDate(today.getUTCDate() - dow + i); return d.toISOString().slice(0, 10); });
  const byDay = new Map<string, Post[]>();
  for (const p of posts) { if (!p.when) continue; const k = dayKeyOf(p.when, timeZone); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k)!.push(p); }
  return (
    <div className="ap-week" role="list" aria-label="This week">
      {days.map((k) => {
        const list = byDay.get(k) ?? [];
        const d = new Date(`${k}T12:00:00Z`);
        return (
          <div key={k} role="listitem" className={`ap-day ${k === todayKey ? "is-today" : ""}`} aria-label={`${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(d)}, ${list.length} post${list.length === 1 ? "" : "s"}`}>
            <div className="ap-day-head">{new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(d)}<b>{d.getUTCDate()}</b></div>
            {list.slice(0, 3).map((p) => {
              const Icon = PLATFORM[p.platform] ?? GlobeIcon;
              return (
                <div key={p.id}>
                  <span className="ap-day-post" title={p.title}>
                    {p.thumb ? (VIDEO.test(p.thumb) ? <video src={p.thumb} muted playsInline preload="metadata" aria-hidden /> : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumb} alt="" loading="lazy" />
                    )) : null}
                    <span className="ap-day-plat" aria-hidden><Icon size={12} /></span>
                    <span className={`ap-day-status ${p.status === "published" ? "is-published" : p.status === "failed" ? "is-failed" : ""}`} aria-hidden />
                  </span>
                  {p.when && <span className="ap-day-time">{timeOf(p.when, timeZone)}</span>}
                </div>
              );
            })}
            {list.length > 3 && <span className="ap-day-time">+{list.length - 3}</span>}
          </div>
        );
      })}
    </div>
  );
}
