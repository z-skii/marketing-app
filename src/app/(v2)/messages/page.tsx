import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { Avatar, EmptyState, SectionTitle } from "@/components/v2/ui";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

/** The inbox: one row per conversation, unread first. */
export default async function MessagesPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const rows = await sql<{
    id: string; topic_type: string | null;
    other_name: string | null; other_username: string | null; other_avatar: string | null;
    last_body: string | null; last_at: string | null; unread: boolean;
  }>(
    `select c.id, c.topic_type,
            p.display_name as other_name, p.username as other_username, p.avatar_url as other_avatar,
            lm.body as last_body, lm.created_at as last_at,
            (lm.created_at > m.last_read_at and lm.sender_id is distinct from $1) as unread
       from conversation_members m
       join conversations c on c.id = m.conversation_id
       left join lateral (
         select body, created_at, sender_id from messages msg
          where msg.conversation_id = c.id order by created_at desc limit 1
       ) lm on true
       left join lateral (
         select p2.display_name, p2.username, p2.avatar_url from conversation_members m2
           join profiles p2 on p2.id = m2.profile_id
          where m2.conversation_id = c.id and m2.profile_id <> $1 limit 1
       ) p on true
      where m.profile_id = $1 and lm.created_at is not null
      order by unread desc nulls last, lm.created_at desc
      limit 100`,
    [ctx.user.id],
  );

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Messages</h1>
      <section className="mt-4">
        <SectionTitle count={rows.length}>Conversations</SectionTitle>
        {rows.length === 0 && (
          <div className="mt-3">
            <EmptyState
              title="No conversations yet"
              body="Threads start automatically around jobs, submissions and car ad offers."
            />
          </div>
        )}
        <ul className="mt-3 flex flex-col">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 border-b border-rule py-3 hover:bg-signal/5">
                <Avatar src={c.other_avatar} name={c.other_name ?? c.other_username ?? "?"} size={40} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${c.unread ? "font-700" : ""}`}>
                    {c.other_name ?? (c.other_username ? `@${c.other_username}` : "Conversation")}
                    {c.topic_type && (
                      <span className="ml-2 font-mono text-[0.625rem] text-ink-faint uppercase">{c.topic_type}</span>
                    )}
                  </span>
                  <span className={`block truncate text-xs ${c.unread ? "text-ink" : "text-ink-faint"}`}>
                    {c.last_body}
                  </span>
                </span>
                {c.last_at && (
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {new Date(c.last_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                {c.unread && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-signal" />}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
