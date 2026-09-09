import "server-only";
import { sqlOne } from "@/lib/db";

/** What a trend or idea hands to a wizard. Every field is optional. */
export type Prefill = {
  id: string;
  kind?: string;
  title?: string;
  brief?: string;
  payDollars?: number;
  slots?: number;
  requirements?: string[];
};

export type WizardBusiness = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  verified: boolean;
};

/** The active business with what the preview card needs. */
export async function loadWizardBusiness(businessId: string): Promise<WizardBusiness> {
  const row = await sqlOne<WizardBusiness>(
    `select id, name, slug, logo_url, cover_url, city, (verification = 'verified') as verified
       from businesses where id = $1`,
    [businessId],
  );
  if (!row) throw new Error("Business not found.");
  return row;
}

/** An unused recommendation for this business, or nothing. */
export async function loadPrefill(recId: string | undefined, businessId: string, kind: string): Promise<Prefill | null> {
  if (!recId || !/^[0-9a-f-]{36}$/i.test(recId)) return null;
  const rec = await sqlOne<{ id: string; prefill: Omit<Prefill, "id"> | null }>(
    `select id, prefill from marketing_recommendations
      where id = $1 and business_id = $2 and status = 'new'`,
    [recId, businessId],
  );
  if (!rec?.prefill) return null;
  const p = rec.prefill;
  // A prefill for another kind still carries a usable title and brief.
  if (p.kind && p.kind !== kind) return { id: rec.id, title: p.title, brief: p.brief };
  return {
    id: rec.id,
    kind: p.kind,
    title: typeof p.title === "string" ? p.title : undefined,
    brief: typeof p.brief === "string" ? p.brief : undefined,
    payDollars: typeof p.payDollars === "number" ? p.payDollars : undefined,
    slots: typeof p.slots === "number" ? p.slots : undefined,
    requirements: Array.isArray(p.requirements) ? p.requirements.filter((r) => typeof r === "string") : undefined,
  };
}
