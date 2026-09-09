"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { notify, requireConversationMember, requireOnboarded } from "@/lib/v2/core";

/** Send into a thread you belong to; membership is checked on the server. */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireOnboarded();
  try {
    await requireConversationMember(ctx.user.id, conversationId);
  } catch {
    return { ok: false, error: "You're not part of this conversation." };
  }
  const text = body.trim().slice(0, 4000);
  if (!text) return { ok: false, error: "Write something first." };

  await sql(
    `insert into messages (conversation_id, sender_id, body) values ($1, $2, $3)`,
    [conversationId, ctx.user.id, text],
  );
  await sql(
    `update conversation_members set last_read_at = now()
      where conversation_id = $1 and profile_id = $2`,
    [conversationId, ctx.user.id],
  );
  const others = await sql<{ profile_id: string }>(
    `select profile_id from conversation_members
      where conversation_id = $1 and profile_id <> $2`,
    [conversationId, ctx.user.id],
  );
  for (const other of others) {
    await notify(other.profile_id, "message",
      `New message from @${ctx.user.username}`,
      { body: text.slice(0, 120), href: `/messages/${conversationId}` });
  }
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

export async function markConversationRead(conversationId: string) {
  const ctx = await requireOnboarded();
  await sql(
    `update conversation_members set last_read_at = now()
      where conversation_id = $1 and profile_id = $2`,
    [conversationId, ctx.user.id],
  );
}
