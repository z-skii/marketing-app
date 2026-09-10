import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { Avatar, Chip, EmptyState, ScreenHeader } from "@/components/v2/ui";
import { KIND_LABEL, isEarnKind } from "@/lib/v2/opportunities";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, string> = {
  campaign: "Campaign", offer: "Car ad", booking: "Car ad", business: "Business", profile: "Profile",
};

/** The chip on a thread: the campaign kind when the topic is a campaign we can resolve. */
function topicChip(topicType: string, campaignKind: string | null): string {
  if (topicType === "campaign" && campaignKind && isEarnKind(campaignKind)) return KIND_LABEL[campaignKind];
  return TOPIC_LABEL[topicType] ?? topicType.replaceAll("_", " ");
}

/** The inbox: one row per conversation, unread first. */
export default async function MessagesPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const rows = await sql<{
    id: string; topic_type: string | null; campaign_kind: string | null;
    other_name: string | null; other_username: string | null; other_avatar: string | null;
    last_body: string | null; last_at: string | null; unread: boolean;
  }>(
    `select c.id, c.topic_type,
            (case when c.topic_type = 'campaign'
                  then (select cp.kind::text from campaigns cp where cp.id::text = c.topic_id::text)
                  end) as campaign_kind,
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

  const unreadCount = rows.filter((r) => r.unread).length;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        title="Messages"
        kicker={unreadCount > 0 ? `${unreadCount} unread` : rows.length > 0 ? "You're all caught up" : undefined}
        unread={ctx.unreadNotifications}
        showSearch={false}
      />

      {rows.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No conversations yet"
            body="Threads start automatically around campaigns, submissions and car ads."
            actionHref="/home" actionLabel="Find work"
          />
        </div>
      )}

      <ul className="row-list mt-5">
        {rows.map((c) => {
          const name = c.other_name ?? (c.other_username ? `@${c.other_username}` : "Conversation");
          return (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="card flex items-center gap-3 p-3">
                <Avatar src={c.other_avatar} name={c.other_name ?? c.other_username ?? "?"} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`truncate font-display text-[0.9375rem] ${c.unread ? "font-600 text-ink" : "font-600 text-ink-soft"}`}>
                      {name}
                    </span>
                    {c.topic_type && <Chip tone="faint">{topicChip(c.topic_type, c.campaign_kind)}</Chip>}
                  </span>
                  <span className={`mt-0.5 block truncate text-sm ${c.unread ? "text-ink-soft" : "text-ink-faint"}`}>
                    {c.last_body}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  {c.last_at && (
                    <span className="text-sm text-ink-faint">
                      {new Date(c.last_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {c.unread && <Chip tone="signal">New</Chip>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
