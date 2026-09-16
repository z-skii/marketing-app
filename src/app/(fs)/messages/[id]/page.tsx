import Link from "next/link";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getThread, threadContext } from "@/lib/fs/inbox";
import { markConversationRead } from "@/app/(v2)/messages/[id]/actions";
import { Avatar } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Composer } from "@/components/fs/inbox/Composer";

export const dynamic = "force-dynamic";

/**
 * One thread: who, what it is about (one quiet line, linked when the
 * viewer can open it), the messages as bubbles, system lines centred,
 * and the composer pinned above the tab bar.
 */
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const membership = await sqlOne(`select 1 as x from conversation_members where conversation_id = $1 and profile_id = $2`, [id, ctx.user.id]);
  if (!membership) notFound();
  const [messages, thread] = await Promise.all([
    sql<{ id: string; sender_id: string | null; kind: string; body: string; created_at: string }>(
      `select m.id, m.sender_id, m.kind, m.body, m.created_at from messages m where m.conversation_id = $1 order by m.created_at limit 500`,
      [id],
    ),
    getThread(ctx.user.id, id),
  ]);
  await markConversationRead(id);
  const name = thread?.other_name ?? (thread?.other_username ? `@${thread.other_username}` : "Conversation");
  const context = thread ? threadContext(thread, ctx.mode, ctx.activeBusiness?.id ?? null) : null;
  const personHref = thread?.other_username ? (ctx.mode === "business" ? `/business/people/${thread.other_username}` : `/u/${thread.other_username}`) : null;
  const dayLines = new Map<string, string>();
  for (const m of messages) { const day = new Date(m.created_at).toDateString(); if (![...dayLines.values()].includes(day)) dayLines.set(m.id, day); }

  return (
    <main className="fs-phone-main fs-utility fs-thread" id="main">
      <header className="fs-thread-head">
        <BackLink fallback="/messages" label="Messages" />
        <Avatar src={thread?.other_avatar} name={name} size={40} />
        <span style={{ minWidth: 0 }}>
          {personHref ? <Link href={personHref} className="fs-t-body fs-link-ink" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</Link> : <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{name}</span>}
          {context && (context.href
            ? <Link href={context.href} className="fs-t-meta fs-link-ul" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{context.label}</Link>
            : <span className="fs-t-meta" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{context.label}</span>)}
        </span>
      </header>

      <div className="fs-thread-body">
        {messages.length === 0 && <p className="fs-t-meta" style={{ textAlign: "center" }}>No messages yet.</p>}
        <ol className="fs-bubbles" aria-label="Messages">
          {messages.map((m) => {
            const dayLine = dayLines.has(m.id) ? new Date(m.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : null;
            const mine = m.sender_id === ctx.user.id;
            const time = new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            return (
              <li key={m.id} className={m.kind === "system" ? "is-system" : mine ? "is-mine" : "is-theirs"} style={{ flexDirection: "column", alignItems: m.kind === "system" ? "center" : mine ? "flex-end" : "flex-start" }}>
                {dayLine && <span className="fs-t-meta" style={{ alignSelf: "center", margin: "8px 0" }}>{dayLine}</span>}
                {m.kind === "system"
                  ? <span className="fs-t-meta" style={{ textAlign: "center", padding: "0 24px" }}>{m.body}</span>
                  : <span className={`fs-bubble ${mine ? "is-mine" : "is-theirs"}`}>{m.body}<span className="fs-bubble-time">{mine ? `You · ${time}` : time}</span></span>}
              </li>
            );
          })}
        </ol>
      </div>

      <Composer conversationId={id} />
    </main>
  );
}
