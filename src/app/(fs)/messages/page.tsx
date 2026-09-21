import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { fmtWhen, listThreads, threadContext } from "@/lib/fs/inbox";
import { Avatar } from "@/components/fs/parts";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

/**
 * The inbox: one row per conversation, unread first. The person, what the
 * thread is about, the last line, when. Unread is weight, not colour.
 */
export default async function MessagesPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const rows = await listThreads(ctx.user.id);
  const unread = rows.filter((r) => r.unread).length;
  const now = new Date().getTime();
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Messages</h1>
        {unread > 0 && <span className="fs-status is-waiting">{unread} unread</span>}
      </div>
      {rows.length === 0 ? (
        <div style={{ marginTop: 24, maxWidth: 480 }}>
          <p className="fs-t-task">No conversations yet.</p>
          <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Threads start from campaigns and requests.</p>
          <Link href={ctx.mode === "business" ? "/business" : "/home"} className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>{ctx.mode === "business" ? "Find people and cars" : "Find work"}</Link>
        </div>
      ) : (
        <ul className="fs-thread-list" aria-label="Conversations">
          {rows.map((t) => {
            const name = t.other_name ?? (t.other_username ? `@${t.other_username}` : "Conversation");
            const context = threadContext(t, ctx.mode, ctx.activeBusiness?.id ?? null);
            return (
              <li key={t.id}>
                <Link href={`/messages/${t.id}`} className={`fs-thread-row${t.unread ? " is-unread" : ""}`} aria-label={`${name}${context ? `, ${context.label}` : ""}${t.unread ? ", unread" : ""}`}>
                  <Avatar src={t.other_avatar} name={name} size={48} />
                  <span style={{ minWidth: 0 }}>
                    <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{name}</span>
                    {context && <span className="fs-t-meta" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{context.label}</span>}
                    <span className="fs-t-body fs-thread-last">{t.last_body}</span>
                  </span>
                  <span className="fs-thread-end fs-t-meta fs-tnum" style={{ whiteSpace: "nowrap" }}>{t.last_at ? fmtWhen(t.last_at, now) : ""}{t.unread ? " · New" : ""}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
