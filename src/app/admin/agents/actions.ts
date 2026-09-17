"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type AgentActionResult = { ok: true } | { ok: false; error: string };

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

async function audit(adminId: string, action: string, proposalId: string, meta: object = {}) {
  await sql(
    `insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
     values ($1,$2,'agent_proposal',$3,$4)`,
    [adminId, action, proposalId, JSON.stringify(meta)],
  );
}

/** Approve a pending proposal; the worker executes it within ~5 minutes. */
export async function approveProposal(id: string): Promise<AgentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  const row = await sqlOne(
    `update agent_proposals
        set status = 'approved', decided_at = now(), decided_by = $2
      where id = $1 and status = 'pending'
      returning id`,
    [id, user.id],
  );
  if (!row) return { ok: false, error: "Already decided." };

  await audit(user.id, "proposal_approved", id);
  revalidatePath("/admin/agents");
  return { ok: true };
}

export async function rejectProposal(id: string): Promise<AgentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  const row = await sqlOne(
    `update agent_proposals
        set status = 'rejected', decided_at = now(), decided_by = $2
      where id = $1 and status = 'pending'
      returning id`,
    [id, user.id],
  );
  if (!row) return { ok: false, error: "Already decided." };

  await audit(user.id, "proposal_rejected", id);
  revalidatePath("/admin/agents");
  return { ok: true };
}

/** Save an edited payload, then approve — the edited payload is what the
 * worker executes, and the edit is on the audit trail. */
export async function editAndApproveProposal(
  id: string,
  payloadJson: string,
): Promise<AgentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  let payload: unknown;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return { ok: false, error: "Payload is not valid JSON." };
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }

  const before = await sqlOne<{ payload: unknown }>(
    `select payload from agent_proposals where id = $1 and status = 'pending'`, [id],
  );
  if (!before) return { ok: false, error: "Already decided." };

  await sql(
    `update agent_proposals
        set payload = $2::jsonb, status = 'approved', decided_at = now(), decided_by = $3
      where id = $1 and status = 'pending'`,
    [id, JSON.stringify(payload), user.id],
  );

  await audit(user.id, "proposal_edited_approved", id, { previous_payload: before.payload });
  revalidatePath("/admin/agents");
  return { ok: true };
}

/** A failed execution stays failed; this files a fresh pending copy to retry
 * deliberately from the approval queue. */
export async function retryFailedProposal(id: string): Promise<AgentActionResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  const row = await sqlOne(
    `insert into agent_proposals (run_id, agent, kind, title, rationale, payload,
                                  estimated_cost_usd, assets)
     select run_id, agent, kind, title, rationale, payload, estimated_cost_usd, assets
       from agent_proposals where id = $1 and status = 'failed'
     returning id`,
    [id],
  );
  if (!row) return { ok: false, error: "Not a failed proposal." };

  await audit(user.id, "proposal_retried", id);
  revalidatePath("/admin/agents");
  return { ok: true };
}
