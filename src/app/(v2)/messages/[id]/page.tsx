import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar } from "@/components/v2/ui";
import { Composer } from "./Composer";
import { markConversationRead } from "./actions";

export const dynamic = "force-dynamic";

/** One thread: bubbles, system lines, a composer pinned to the bottom. */
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const membership = await sqlOne(
    `select 1 as x from conversation_members where conversation_id = $1 and profile_id = $2`,
    [id, ctx.user.id],
  );
  if (!membership) notFound();

  const [messages, other] = await Promise.all([
    sql<{
      id: string; sender_id: string | null; kind: string; body: string; created_at: string;
      username: string | null; display_name: string | null; avatar_url: string | null;
    }>(
      `select m.id, m.sender_id, m.kind, m.body, m.created_at,
              p.username, p.display_name, p.avatar_url
         from messages m left join profiles p on p.id = m.sender_id
        where m.conversation_id = $1 order by m.created_at limit 500`,
      [id],
    ),
    sqlOne<{ username: string; display_name: string | null; avatar_url: string | null }>(
      `select p.username, p.display_name, p.avatar_url
         from conversation_members m join profiles p on p.id = m.profile_id
        where m.conversation_id = $1 and m.profile_id <> $2 limit 1`,
      [id, ctx.user.id],
    ),
  ]);

  await markConversationRead(id);

  return (
    <main id="main" className="mx-auto flex h-[calc(100dvh-6rem)] w-full max-w-2xl flex-col px-4 py-4 md:h-dvh md:px-8 md:py-6">
      <header className="card flex items-center gap-3 px-3 py-2.5">
        <BackButton fallback="/messages" label="" />
        {other && (
          <>
            <Avatar src={other.avatar_url} name={other.display_name ?? other.username} size={36} />
            <Link href={`/u/${other.username}`} className="min-w-0 truncate font-display text-[1.0625rem] font-800 tracking-[-0.02em] hover:text-signal">
              {other.display_name ?? `@${other.username}`}
            </Link>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-2.5">
          {messages.map((m) =>
            m.kind === "system" ? (
              <li key={m.id} className="px-6 py-1 text-center text-sm text-ink-faint">
                {m.body}
              </li>
            ) : (
              <li key={m.id} className={`flex ${m.sender_id === ctx.user.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[0.9375rem] leading-snug whitespace-pre-wrap ${
                    m.sender_id === ctx.user.id
                      ? "rounded-[14px] rounded-br-[4px] bg-signal text-signal-ink"
                      : "rounded-[14px] rounded-bl-[4px] bg-surface-2 text-ink"
                  }`}
                >
                  {m.body}
                  <span className={`mt-1 block text-right text-xs ${m.sender_id === ctx.user.id ? "text-signal-ink/70" : "text-ink-faint"}`}>
                    {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>

      <Composer conversationId={id} />
    </main>
  );
}
