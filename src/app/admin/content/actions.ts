"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { runGeneration } from "@/lib/content-agent";

export type ContentActionResult = { ok: true; detail?: string } | { ok: false; error: string };

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/** Approve a draft, optionally scheduling it; the publish cron takes it from there. */
export async function approveContent(
  id: string,
  scheduledFor?: string,
): Promise<ContentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  let scheduled: string | null = null;
  if (scheduledFor) {
    const at = new Date(scheduledFor);
    if (Number.isNaN(at.getTime())) return { ok: false, error: "Bad schedule time." };
    scheduled = at.toISOString();
  }

  const row = await sqlOne(
    `update content_queue
        set status = 'approved', scheduled_for = $2, reviewed_by = $3, reviewed_at = now()
      where id = $1 and status in ('draft','ready','failed')
      returning id`,
    [id, scheduled, user.id],
  );
  if (!row) return { ok: false, error: "Already decided." };
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function rejectContent(id: string): Promise<ContentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  const row = await sqlOne(
    `update content_queue
        set status = 'rejected', reviewed_by = $2, reviewed_at = now()
      where id = $1 and status in ('draft','approved','ready','failed')
      returning id`,
    [id, user.id],
  );
  if (!row) return { ok: false, error: "Already decided." };
  revalidatePath("/admin/content");
  return { ok: true };
}

/** For 'ready' items posted by hand: record that it went out. */
export async function markPublished(id: string): Promise<ContentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  const row = await sqlOne(
    `update content_queue
        set status = 'published', published_at = now(),
            publish_result = jsonb_build_object('manual', true),
            reviewed_by = $2, reviewed_at = now()
      where id = $1 and status in ('ready','approved')
      returning id`,
    [id, user.id],
  );
  if (!row) return { ok: false, error: "Not in a publishable state." };
  revalidatePath("/admin/content");
  return { ok: true };
}

/** The "Run agents now" button: one full generate → render → queue cycle. */
export async function runAgentsNow(): Promise<ContentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  try {
    const result = await runGeneration();
    revalidatePath("/admin/content");
    return {
      ok: true,
      detail:
        result.mode === "claude"
          ? `${result.created} drafts generated ($${result.costUsd.toFixed(4)})`
          : `${result.created} sample drafts (add ANTHROPIC_API_KEY for real generation)`,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Generation failed." };
  }
}
