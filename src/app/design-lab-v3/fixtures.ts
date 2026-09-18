/**
 * V3 Design Lab fixtures: the Loyalty fixture story exactly as the
 * director specified it (docs/design-lab-v3/LOYALTY_DIRECTION.md, Fixture
 * story). Every business, person, member, count, code and date is
 * fictional and exists only to render the concept. Nothing reads or
 * writes the database. The demonstration clock is frozen at
 * 2026-09-17 10:00 America/Chicago. Counts are projections of these
 * events, never separately hard-coded.
 */
export { ASSET, V2ASSET, money } from "../design-lab-v2/fixtures";
import { ASSET } from "../design-lab-v2/fixtures";

export const NOW = new Date("2026-09-17T10:00:00-05:00");
export const TZ = "America/Chicago";

export type ProgramKind = "visits" | "points";
export type SourceType = "RECREATE" | "STORY" | "CAR" | "DIRECT_CREATOR_REQUEST" | "TAPMART_LINK" | "BUSINESS_QR" | "ORGANIC";
export type WalletState = "none" | "apple" | "google" | "both";
export type Confidence = "link" | "none";

export type CardDesign = {
  businessName: string; programName: string; rewardTitle: string;
  bg: string; fg: string; label: string;
  logo: "loop" | "initial"; artwork: string | null; artworkAlt: string; artworkPosition: string;
};

export type Program = {
  id: string; status: "none" | "draft" | "live";
  kind: ProgramKind; requirement: number; pointsPerPurchase: 1;
  reward: { name: string; terms: string; version: number };
  card: CardDesign; joinCode: string; launchedAt: string | null; draftStep: number;
};

export type Source = { type: SourceType; creatorId: "jasmine" | "maya" | "eli" | null; campaign: string | null; label: string; sub: string; linkCode: string | null; confidence: Confidence };

export type Member = {
  id: string; memberId: string; firstName: string; contactKind: "phone" | "email"; contactNorm: string; contactMasked: string; code: string;
  joinedAt: string; agreedAt: string; source: Source;
  progress: number; ready: number; redeemed: number; lifetime: number; visitDays: string[]; lastCountedAt: string | null; lastAttemptAt: string | null;
  wallet: WalletState; walletAt: string | null;
};

export type EventType = "SIGNUP" | "VISIT" | "POINTS_ADDED" | "REWARD_UNLOCKED" | "REWARD_REDEEMED" | "WALLET_ADDED" | "WALLET_UPDATED" | "CAMPAIGN_CLICK";
export type LoyaltyEvent = { id: string; type: EventType; memberId: string | null; at: string; counted: boolean; note: string; businessDay?: string };

export type UpdateKind = "visit" | "points" | "reward_ready" | "redeemed" | "offer" | "promotion" | "milestone";
export type WalletUpdate = { id: string; kind: UpdateKind; title: string; body: string; at: string; memberId: string | null; audience: number; notifies: boolean; capped?: boolean };

export const business = { id: "loopday", name: "Loopday Coffee", category: "Coffee shop", city: "Austin", initials: "LC", cover: ASSET("content-loopday-counter-01"), coverAlt: "Loopday Coffee counter, fixture imagery" };

/** Creators and campaigns. Jasmine is a fictional source identity with no supplied portrait; Maya and Eli are the V2 fixture people. */
export const creators = {
  jasmine: { id: "jasmine", name: "Jasmine", portrait: null as string | null, campaign: "Morning loop", type: "STORY" as SourceType, kindLabel: "Story campaign" },
  maya: { id: "maya", name: "Maya", portrait: ASSET("portrait-maya-01"), campaign: "Counter pour", type: "RECREATE" as SourceType, kindLabel: "Recreate campaign" },
  eli: { id: "eli", name: "Eli", portrait: ASSET("portrait-eli-01"), campaign: "Around Austin", type: "CAR" as SourceType, kindLabel: "Car campaign" },
};

export const SOURCES: Record<string, Source> = {
  jasmine: { type: "STORY", creatorId: "jasmine", campaign: "Morning loop", label: "Jasmine", sub: "Morning loop · Story campaign", linkCode: "link-jasmine-story", confidence: "link" },
  maya: { type: "RECREATE", creatorId: "maya", campaign: "Counter pour", label: "Maya", sub: "Counter pour · Recreate campaign", linkCode: "link-maya-recreate", confidence: "link" },
  eli: { type: "CAR", creatorId: "eli", campaign: "Around Austin", label: "Eli", sub: "Around Austin · Car campaign", linkCode: "qr-eli-car", confidence: "link" },
  counter: { type: "BUSINESS_QR", creatorId: null, campaign: null, label: "Counter QR", sub: "At the counter", linkCode: "qr-loopday-counter", confidence: "link" },
  tapmart: { type: "TAPMART_LINK", creatorId: null, campaign: null, label: "TapMart link", sub: "Loopday's TapMart page", linkCode: "link-tapmart-loopday", confidence: "link" },
  request: { type: "DIRECT_CREATOR_REQUEST", creatorId: "maya", campaign: "Direct request", label: "Maya", sub: "Creator request", linkCode: "link-maya-request", confidence: "link" },
  direct: { type: "ORGANIC", creatorId: null, campaign: null, label: "Direct signup", sub: "Source not tracked", linkCode: null, confidence: "none" },
};

/** The link registry: acquisition codes (a counter QR or a creator's campaign link), never member codes. */
export const JOIN_CODES: Record<string, keyof typeof SOURCES> = { "loopday-counter": "counter", "loopday-jasmine-story": "jasmine", "loopday-maya-recreate": "maya", "loopday-eli-car": "eli", "loopday-tapmart": "tapmart", "loopday-request": "request", "loopday-direct": "direct" };
export const LINK_CODES: Record<string, { source: keyof typeof SOURCES; joinCode: string; placed: string }> = {
  "link-jasmine-story": { source: "jasmine", joinCode: "loopday-jasmine-story", placed: "The link sticker in Jasmine's Story" },
  "link-maya-recreate": { source: "maya", joinCode: "loopday-maya-recreate", placed: "The caption of the published Reel" },
  "qr-eli-car": { source: "eli", joinCode: "loopday-eli-car", placed: "The QR on the rear-door placement" },
  "qr-loopday-counter": { source: "counter", joinCode: "loopday-counter", placed: "The card at the register" },
  "link-tapmart-loopday": { source: "tapmart", joinCode: "loopday-tapmart", placed: "Loopday's TapMart page" },
  "link-maya-request": { source: "request", joinCode: "loopday-request", placed: "A direct creator request" },
};

export const defaultCard: CardDesign = {
  businessName: "Loopday Coffee", programName: "Loopday Rewards", rewardTitle: "Free coffee",
  bg: "#18231D", fg: "#F7F4EB", label: "#C4CDBF",
  logo: "loop", artwork: ASSET("reference-loopday-01"), artworkAlt: "Loopday counter, fixture imagery", artworkPosition: "72% 50%",
};

export const REWARD_TERMS = "One qualifying purchase earns one visit. A maximum of one visit counts per business day. Collect five visits for one free barista-made coffee on a later purchase. Redeeming a reward does not earn a visit. Earned rewards have no expiry in this example.";

export const liveProgram: Program = {
  id: "loopday-rewards", status: "live", kind: "visits", requirement: 5, pointsPerPurchase: 1,
  reward: { name: "Free coffee", terms: REWARD_TERMS, version: 1 },
  card: defaultCard, joinCode: "loopday-counter", launchedAt: "2026-08-25T09:00:00-05:00", draftStep: 5,
};

const T = (day: string, time = "09:00") => `2026-${day}T${time}:00-05:00`;

type Seed = { n: number; firstName: string; contactKind: "phone" | "email"; contactNorm: string; contactMasked: string; code: string; joinedAt: string; source: keyof typeof SOURCES; visits: string[]; redeemedAt: string[]; wallet: WalletState; sameDayAttempt?: string };

/** The ten members. Visits are counted business days with the time of the count; a redemption consumes one earned instance. */
const SEEDS: Seed[] = [
  { n: 1, firstName: "Sara", contactKind: "phone", contactNorm: "+12025550142", contactMasked: "••42", code: "LMQ-7K2P-SARA", joinedAt: T("09-08", "08:50"), source: "jasmine", visits: [T("09-08", "09:00"), T("09-10"), T("09-13"), T("09-16", "16:20")], redeemedAt: [], wallet: "apple" },
  { n: 2, firstName: "Mina", contactKind: "email", contactNorm: "mina@example.test", contactMasked: "•••@example.test", code: "LMQ-3H8D-MINA", joinedAt: T("09-01", "08:50"), source: "jasmine", visits: [T("09-01"), T("09-04"), T("09-08"), T("09-12"), T("09-16")], redeemedAt: [], wallet: "google" },
  { n: 3, firstName: "Theo", contactKind: "phone", contactNorm: "+12025550108", contactMasked: "••08", code: "LMQ-9C4V-THEO", joinedAt: T("08-27", "08:50"), source: "jasmine", visits: [T("08-27"), T("08-29"), T("08-31"), T("09-02"), T("09-04"), T("09-09")], redeemedAt: [T("09-05")], wallet: "apple" },
  { n: 4, firstName: "Ava", contactKind: "email", contactNorm: "ava@example.test", contactMasked: "•••@example.test", code: "LMQ-5N1R-AVA", joinedAt: T("09-17", "08:40"), source: "jasmine", visits: [], redeemedAt: [], wallet: "none" },
  { n: 5, firstName: "Noah", contactKind: "email", contactNorm: "noah@example.test", contactMasked: "•••@example.test", code: "LMQ-2W6T-NOAH", joinedAt: T("09-03", "08:50"), source: "maya", visits: [T("09-03"), T("09-07"), T("09-14")], redeemedAt: [], wallet: "google" },
  { n: 6, firstName: "Lena", contactKind: "phone", contactNorm: "+12025550126", contactMasked: "••26", code: "LMQ-8J3M-LENA", joinedAt: T("09-02", "08:50"), source: "maya", visits: [T("09-02"), T("09-05"), T("09-08"), T("09-11"), T("09-14")], redeemedAt: [T("09-15")], wallet: "apple" },
  { n: 7, firstName: "Luca", contactKind: "email", contactNorm: "luca@example.test", contactMasked: "•••@example.test", code: "LMQ-4F9B-LUCA", joinedAt: T("09-16", "08:50"), source: "eli", visits: [T("09-16")], redeemedAt: [], wallet: "google" },
  { n: 8, firstName: "Imani", contactKind: "phone", contactNorm: "+12025550117", contactMasked: "••17", code: "LMQ-6L2X-IMANI", joinedAt: T("09-15", "08:50"), source: "counter", visits: [T("09-15"), T("09-17", "09:10")], redeemedAt: [], wallet: "both", sameDayAttempt: T("09-17", "09:45") },
  { n: 9, firstName: "Ben", contactKind: "phone", contactNorm: "+12025550109", contactMasked: "••09", code: "LMQ-1P7G-BEN", joinedAt: T("09-17", "09:20"), source: "counter", visits: [T("09-17", "09:30")], redeemedAt: [], wallet: "none" },
  { n: 10, firstName: "June", contactKind: "email", contactNorm: "june@example.test", contactMasked: "•••@example.test", code: "LMQ-0S5K-JUNE", joinedAt: T("09-17", "09:55"), source: "direct", visits: [], redeemedAt: [], wallet: "apple" },
];

export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ });
export const fmtDayYear = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

let eseq = 0;
const ev = (type: EventType, memberId: string | null, at: string, note: string, counted = true): LoyaltyEvent => ({ id: `seed-${++eseq}`, type, memberId, at, counted, note, businessDay: dayKey(at) });

/** Build the members and the append-only history from the seeds. Progress, ready instances and redemptions are replayed, never typed in. */
export function buildStory(requirement = 5): { members: Member[]; events: LoyaltyEvent[]; updates: WalletUpdate[] } {
  eseq = 0;
  const members: Member[] = []; const events: LoyaltyEvent[] = []; const updates: WalletUpdate[] = [];
  for (const s of SEEDS) {
    const id = `ld-${String(s.n).padStart(3, "0")}`; const memberId = `LD-${String(s.n).padStart(3, "0")}`;
    events.push(ev("SIGNUP", id, s.joinedAt, `Joined · ${SOURCES[s.source].label}`));
    const walletAt = s.wallet === "none" ? null : new Date(new Date(s.joinedAt).getTime() + 3 * 60_000).toISOString();
    if (s.wallet === "apple" || s.wallet === "both") events.push(ev("WALLET_ADDED", id, walletAt!, "Apple Wallet · simulated", false));
    if (s.wallet === "google" || s.wallet === "both") events.push(ev("WALLET_ADDED", id, walletAt!, "Google Wallet · simulated", false));
    let progress = 0, ready = 0, redeemed = 0; const days: string[] = []; let last: string | null = null;
    const timeline = [...s.visits.map((at) => ({ at, kind: "visit" as const })), ...s.redeemedAt.map((at) => ({ at, kind: "redeem" as const })), ...(s.sameDayAttempt ? [{ at: s.sameDayAttempt, kind: "same" as const }] : [])].sort((a, b) => a.at.localeCompare(b.at));
    for (const t of timeline) {
      if (t.kind === "visit") {
        progress += 1; days.push(dayKey(t.at)); last = t.at;
        events.push(ev("VISIT", id, t.at, `Visit counted · ${Math.min(progress, requirement)} of ${requirement}`));
        if (progress >= requirement) { progress -= requirement; ready += 1; events.push(ev("REWARD_UNLOCKED", id, t.at, "Reward ready · Free coffee", false)); events.push(ev("WALLET_UPDATED", id, t.at, "Reward ready", false)); updates.push({ id: `u-${eseq}`, kind: "reward_ready", title: "Reward ready", body: "Your reward is ready.", at: t.at, memberId: id, audience: 1, notifies: s.wallet !== "none" }); }
        else if (s.wallet !== "none") { events.push(ev("WALLET_UPDATED", id, t.at, "Visit counted", false)); }
      } else if (t.kind === "redeem") {
        ready = Math.max(0, ready - 1); redeemed += 1;
        events.push(ev("REWARD_REDEEMED", id, t.at, "Reward redeemed · Free coffee", false)); events.push(ev("WALLET_UPDATED", id, t.at, "Reward redeemed", false));
        updates.push({ id: `u-${eseq}`, kind: "redeemed", title: "Reward redeemed", body: "Your reward was redeemed.", at: t.at, memberId: id, audience: 1, notifies: s.wallet !== "none" });
      } else {
        events.push(ev("VISIT", id, t.at, "Not counted · same day", false));
      }
    }
    members.push({ id, memberId, firstName: s.firstName, contactKind: s.contactKind, contactNorm: s.contactNorm, contactMasked: s.contactMasked, code: s.code, joinedAt: s.joinedAt, agreedAt: s.joinedAt, source: SOURCES[s.source], progress, ready, redeemed, lifetime: s.visits.length, visitDays: days, lastCountedAt: last, lastAttemptAt: s.sameDayAttempt ?? last, wallet: s.wallet, walletAt });
  }
  events.sort((a, b) => b.at.localeCompare(a.at));
  updates.sort((a, b) => b.at.localeCompare(a.at));
  return { members, events, updates };
}

/** The points scenario: the same names in a points cohort, one point per qualifying purchase, 100 to a reward. Not a second live program. */
export function buildPointsStory(sara: 82 | 99): { members: Member[]; events: LoyaltyEvent[]; updates: WalletUpdate[] } {
  const base = buildStory(100);
  const members = base.members.map((m) => (m.firstName === "Sara" ? { ...m, progress: sara, lifetime: sara, ready: 0, redeemed: 0 } : { ...m, progress: Math.min(99, m.lifetime * 7 + 3), ready: 0, redeemed: 0 }));
  return { members, events: base.events.map((e): LoyaltyEvent => (e.type === "VISIT" && e.counted ? { ...e, type: "POINTS_ADDED", note: "Point added" } : e)).filter((e) => e.type !== "REWARD_UNLOCKED" && e.type !== "REWARD_REDEEMED"), updates: [] };
}

export const OFFER_DEFAULT = { kind: "offer" as UpdateKind, title: "Afternoon coffee", body: "Ask us what’s pouring after 2 PM." };
