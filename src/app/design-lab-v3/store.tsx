"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { NOW, OFFER_DEFAULT, SOURCES, TZ, buildPointsStory, buildStory, dayKey, defaultCard, liveProgram, type LoyaltyEvent, type Member, type Program, type Source, type UpdateKind, type WalletUpdate } from "./fixtures";

/**
 * The lab's Loyalty store: in-memory fixture state that simulates what the
 * production event model would do (docs/design-lab-v3/LOYALTY_ARCHITECTURE.md).
 * Every action appends an event; member progress, the four counts and the
 * attribution descents are projections over members and events. Nothing is
 * persisted, signed, issued, sent or delivered. A reload resets the story.
 * Scenarios replace the whole fixture context; they are never a second
 * live program.
 */

export type Scenario = "live" | "none" | "draft" | "live-empty" | "points-82" | "points-99";
export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "live", label: "Live program" }, { id: "none", label: "No program" }, { id: "draft", label: "Draft" }, { id: "live-empty", label: "Live · no members" }, { id: "points-82", label: "Points · 82 of 100" }, { id: "points-99", label: "Points · 99 of 100" },
];

export type Receipt = { type: "visit" | "points" | "same-day" | "unlock" | "redeem" | "wallet" | "message" | "signup" | "launch" | "duplicate"; memberId?: string; at: number; walletUpdated?: "simulated" | "not-added"; note?: string };

export type State = { scenario: Scenario; program: Program; draft: Program | null; members: Member[]; events: LoyaltyEvent[]; updates: WalletUpdate[]; clock: number; receipt: Receipt | null; seq: number };

type Action =
  | { type: "signup"; firstName: string; contactKind: "phone" | "email"; contact: string; source: Source }
  | { type: "count"; memberId: string; key: string }
  | { type: "redeem"; memberId: string }
  | { type: "wallet"; memberId: string; platform: "apple" | "google" }
  | { type: "message"; kind: UpdateKind; title: string; body: string }
  | { type: "click"; linkCode: string }
  | { type: "draft"; patch: Partial<Program> | null }
  | { type: "draftCard"; patch: Partial<Program["card"]> }
  | { type: "editReward"; name: string; terms: string }
  | { type: "editCard"; patch: Partial<Program["card"]> }
  | { type: "launch" }
  | { type: "advanceDay" }
  | { type: "scenario"; scenario: Scenario }
  | { type: "reset" };

function build(scenario: Scenario): State {
  const base = { scenario, draft: null, clock: 0, receipt: null, seq: 100 };
  if (scenario === "none") return { ...base, program: { ...liveProgram, status: "none", launchedAt: null, draftStep: 0 }, members: [], events: [], updates: [] };
  if (scenario === "draft") { const d: Program = { ...liveProgram, id: "draft", status: "draft", launchedAt: null, draftStep: 2 }; return { ...base, program: { ...liveProgram, status: "none", launchedAt: null, draftStep: 0 }, draft: d, members: [], events: [], updates: [] }; }
  if (scenario === "live-empty") return { ...base, program: { ...liveProgram, launchedAt: "2026-09-17T09:40:00-05:00" }, members: [], events: [], updates: [] };
  if (scenario === "points-82" || scenario === "points-99") {
    const s = buildPointsStory(scenario === "points-82" ? 82 : 99);
    return { ...base, program: { ...liveProgram, kind: "points", requirement: 100, reward: { ...liveProgram.reward, terms: "One point per qualifying purchase. A maximum of one counted purchase per business day. Collect 100 points for one free barista-made coffee on a later purchase. Redeeming a reward does not earn a point." } }, ...s };
  }
  const s = buildStory(5);
  return { ...base, program: liveProgram, ...s };
}

const nowOf = (s: State) => new Date(NOW.getTime() + s.clock * 60_000).toISOString();
export const normalise = (kind: "phone" | "email", v: string) => (kind === "email" ? v.trim().toLowerCase() : `+${v.replace(/\D/g, "").replace(/^1?/, "1")}`);
function mask(kind: "phone" | "email", norm: string): string {
  if (kind === "email") return `•••@${norm.split("@")[1] ?? "…"}`;
  return `••${norm.slice(-2)}`;
}
/** Google notifying requests per pass in a rolling 24 hours; the lab keeps a conservative maximum of three. */
function googleCapReached(s: State, memberId: string, at: string): boolean {
  const since = new Date(at).getTime() - 24 * 3600_000;
  return s.updates.filter((u) => u.notifies && (u.memberId === memberId || u.memberId === null) && new Date(u.at).getTime() > since).length >= 3;
}

function reducer(s: State, a: Action): State {
  const at = nowOf(s);
  let seq = s.seq;
  const id = (p: string) => `${p}-${++seq}`;
  const done = (st: State): State => ({ ...st, seq, clock: st.clock + 1 });
  const withEvent = (st: State, e: Omit<LoyaltyEvent, "id" | "at" | "businessDay">): State => ({ ...st, events: [{ id: id("e"), at, businessDay: dayKey(at), ...e }, ...st.events] });
  const withUpdate = (st: State, u: Omit<WalletUpdate, "id" | "at">): State => ({ ...st, updates: [{ id: id("u"), at, ...u }, ...st.updates] });
  const patchMember = (st: State, mid: string, f: (m: Member) => Member): State => ({ ...st, members: st.members.map((m) => (m.id === mid ? f(m) : m)) });
  switch (a.type) {
    case "signup": {
      if (s.program.status !== "live") return s;
      const norm = normalise(a.contactKind, a.contact);
      const existing = s.members.find((m) => m.contactNorm === norm);
      if (existing) return done({ ...s, receipt: { type: "duplicate", memberId: existing.id, at: Date.now() } });
      const n = s.members.length + 1;
      const first = a.firstName.trim().slice(0, 40) || "Guest";
      const member: Member = { id: id("m"), memberId: `LD-${String(n).padStart(3, "0")}`, firstName: first, contactKind: a.contactKind, contactNorm: norm, contactMasked: mask(a.contactKind, norm), code: `LMQ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${first.toUpperCase().slice(0, 4)}`, joinedAt: at, agreedAt: at, source: a.source, progress: 0, ready: 0, redeemed: 0, lifetime: 0, visitDays: [], lastCountedAt: null, lastAttemptAt: null, wallet: "none", walletAt: null };
      let st: State = { ...s, members: [member, ...s.members], receipt: { type: "signup", memberId: member.id, at: Date.now() } };
      st = withEvent(st, { type: "SIGNUP", memberId: member.id, counted: true, note: `Joined · ${a.source.label}` });
      return done(st);
    }
    case "click": {
      let st: State = withEvent(s, { type: "CAMPAIGN_CLICK", memberId: null, counted: false, note: a.linkCode });
      st = { ...st, receipt: null };
      return done(st);
    }
    case "count": {
      const m0 = s.members.find((m) => m.id === a.memberId); if (!m0) return s;
      if (s.events.some((e) => e.note.endsWith(`key ${a.key}`))) return s;
      const p = s.program; const today = dayKey(at);
      const points = p.kind === "points";
      if (m0.visitDays.includes(today)) {
        let st: State = withEvent(s, { type: points ? "POINTS_ADDED" : "VISIT", memberId: m0.id, counted: false, note: `Not counted · same day · key ${a.key}` });
        st = patchMember(st, m0.id, (m) => ({ ...m, lastAttemptAt: at }));
        return done({ ...st, receipt: { type: "same-day", memberId: m0.id, at: Date.now() } });
      }
      let unlocked = false;
      let st: State = patchMember(s, m0.id, (m) => {
        let progress = m.progress + 1; let ready = m.ready;
        if (progress >= p.requirement) { progress -= p.requirement; ready += 1; unlocked = true; }
        return { ...m, progress, ready, lifetime: m.lifetime + 1, visitDays: [...m.visitDays, today], lastCountedAt: at, lastAttemptAt: at };
      });
      const m1 = st.members.find((m) => m.id === a.memberId)!;
      st = withEvent(st, { type: points ? "POINTS_ADDED" : "VISIT", memberId: m1.id, counted: true, note: `${points ? "Point added" : "Visit counted"} · ${unlocked ? p.requirement : m1.progress} of ${p.requirement} · key ${a.key}` });
      const hasWallet = m1.wallet !== "none";
      const capped = hasWallet && (m1.wallet === "google" || m1.wallet === "both") && googleCapReached(st, m1.id, at);
      if (unlocked) {
        st = withEvent(st, { type: "REWARD_UNLOCKED", memberId: m1.id, counted: false, note: `Reward ready · ${p.reward.name}` });
        if (hasWallet) { st = withEvent(st, { type: "WALLET_UPDATED", memberId: m1.id, counted: false, note: "Reward ready" }); st = withUpdate(st, { kind: "reward_ready", title: "Reward ready", body: "Your reward is ready.", memberId: m1.id, audience: 1, notifies: !capped, capped }); }
      } else if (hasWallet) {
        st = withEvent(st, { type: "WALLET_UPDATED", memberId: m1.id, counted: false, note: points ? "Point added" : "Visit counted" });
        st = withUpdate(st, { kind: points ? "points" : "visit", title: points ? "Point added" : "Visit counted", body: `${unlocked ? p.requirement : m1.progress} of ${p.requirement} ${points ? "points" : "visits"}`, memberId: m1.id, audience: 1, notifies: !capped, capped });
      }
      return done({ ...st, receipt: { type: unlocked ? "unlock" : points ? "points" : "visit", memberId: m1.id, at: Date.now(), walletUpdated: hasWallet ? "simulated" : "not-added" } });
    }
    case "redeem": {
      const m0 = s.members.find((m) => m.id === a.memberId); if (!m0 || m0.ready < 1) return s;
      const p = s.program;
      let st: State = patchMember(s, m0.id, (m) => ({ ...m, ready: m.ready - 1, redeemed: m.redeemed + 1 }));
      st = withEvent(st, { type: "REWARD_REDEEMED", memberId: m0.id, counted: false, note: `Reward redeemed · ${p.reward.name}` });
      if (m0.wallet !== "none") { st = withEvent(st, { type: "WALLET_UPDATED", memberId: m0.id, counted: false, note: "Reward redeemed" }); const capped = (m0.wallet === "google" || m0.wallet === "both") && googleCapReached(st, m0.id, at); st = withUpdate(st, { kind: "redeemed", title: "Reward redeemed", body: "Your reward was redeemed.", memberId: m0.id, audience: 1, notifies: !capped, capped }); }
      return done({ ...st, receipt: { type: "redeem", memberId: m0.id, at: Date.now(), walletUpdated: m0.wallet !== "none" ? "simulated" : "not-added" } });
    }
    case "wallet": {
      const m0 = s.members.find((m) => m.id === a.memberId); if (!m0) return s;
      const wallet = m0.wallet === "none" ? a.platform : m0.wallet === a.platform ? m0.wallet : "both";
      let st: State = patchMember(s, m0.id, (m) => ({ ...m, wallet, walletAt: m.walletAt ?? at }));
      st = withEvent(st, { type: "WALLET_ADDED", memberId: m0.id, counted: false, note: a.platform === "apple" ? "Apple Wallet · simulated" : "Google Wallet · simulated" });
      return done({ ...st, receipt: { type: "wallet", memberId: m0.id, at: Date.now(), note: a.platform } });
    }
    case "message": {
      const today = dayKey(at);
      if (s.updates.some((u) => (u.kind === "offer" || u.kind === "promotion" || u.kind === "milestone") && dayKey(u.at) === today)) return s;
      const audience = s.members.filter((m) => m.wallet !== "none").length;
      let st: State = withEvent(s, { type: "WALLET_UPDATED", memberId: null, counted: false, note: a.title });
      st = withUpdate(st, { kind: a.kind, title: a.title, body: a.body, memberId: null, audience, notifies: true });
      return done({ ...st, receipt: { type: "message", at: Date.now() } });
    }
    case "draft": {
      if (a.patch === null) return done({ ...s, draft: null });
      const base: Program = s.draft ?? { ...liveProgram, id: "draft", status: "draft", launchedAt: null, draftStep: 1, kind: "visits", requirement: 5, reward: { name: "Free coffee", terms: "", version: 1 }, card: defaultCard };
      return done({ ...s, draft: { ...base, ...a.patch } });
    }
    case "draftCard": {
      const base: Program = s.draft ?? { ...liveProgram, id: "draft", status: "draft", launchedAt: null, draftStep: 3, card: defaultCard };
      return done({ ...s, draft: { ...base, card: { ...base.card, ...a.patch } } });
    }
    case "editReward": return done({ ...s, program: { ...s.program, reward: { name: a.name, terms: a.terms, version: s.program.reward.version + 1 }, card: { ...s.program.card, rewardTitle: a.name } } });
    case "editCard": return done({ ...s, program: { ...s.program, card: { ...s.program.card, ...a.patch } } });
    case "launch": {
      if (!s.draft) return s;
      const p: Program = { ...s.draft, id: "loopday-rewards", status: "live", launchedAt: at, draftStep: 5, reward: { ...s.draft.reward, terms: s.draft.reward.terms || liveProgram.reward.terms, version: 1 } };
      return done({ ...s, program: p, draft: null, members: [], events: [], updates: [], receipt: { type: "launch", at: Date.now() } });
    }
    case "advanceDay": return { ...s, clock: s.clock + 24 * 60, receipt: null };
    case "scenario": return build(a.scenario);
    case "reset": return build(s.scenario);
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, "live", build);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useLoyalty() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLoyalty outside LoyaltyProvider");
  return c;
}

// ------------------------------------------------------------ projections

export const isReady = (m: Member) => m.ready > 0;
export const cameBack = (m: Member) => new Set(m.visitDays).size >= 2;
export const labClock = (s: State) => new Date(NOW.getTime() + s.clock * 60_000);
export const todayKey = (s: State) => dayKey(labClock(s));

/** The four Loyalty Home counts, all projections. */
export function counts(s: State) {
  return {
    members: s.members.length,
    repeat: s.members.filter(cameBack).length,
    ready: s.members.reduce((a, m) => a + m.ready, 0),
    redeemed: s.events.filter((e) => e.type === "REWARD_REDEEMED").length,
  };
}

export type SourceRow = { key: string; source: Source; joined: number; returned: number; redeemed: number; members: Member[] };

/** Per source: unique members joined, came back (two distinct business days), redeemed at least once. Sources partition the cohort once. */
export function sourceRows(s: State): SourceRow[] {
  const map = new Map<string, SourceRow>();
  for (const m of s.members) {
    const key = m.source.creatorId ? `${m.source.creatorId}-${m.source.type}` : m.source.type;
    const row = map.get(key) ?? { key, source: m.source, joined: 0, returned: 0, redeemed: 0, members: [] };
    row.joined += 1; if (cameBack(m)) row.returned += 1; if (m.redeemed > 0) row.redeemed += 1; row.members.push(m);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.returned - a.returned || b.joined - a.joined || a.source.label.localeCompare(b.source.label));
}

/** Recent customers: latest signup, counted activity or redemption. */
export function recentMembers(s: State, n = 3): Member[] {
  const last = (m: Member) => Math.max(new Date(m.joinedAt).getTime(), m.lastCountedAt ? new Date(m.lastCountedAt).getTime() : 0, ...s.events.filter((e) => e.memberId === m.id && e.type === "REWARD_REDEEMED").map((e) => new Date(e.at).getTime()));
  return [...s.members].sort((a, b) => last(b) - last(a)).slice(0, n);
}

/** Default member order: ready rewards first, then progress descending, then first name. */
export function orderedMembers(s: State): Member[] {
  return [...s.members].sort((a, b) => (b.ready - a.ready) || (b.progress - a.progress) || a.firstName.localeCompare(b.firstName));
}

export function progressLabel(m: Member, p: Program): string {
  if (m.ready > 0) return "Reward ready";
  if (m.redeemed > 0 && m.progress === 0 && m.ready === 0) return "Reward redeemed";
  if (m.lifetime === 0) return "No visits yet";
  return `${m.progress} of ${p.requirement} ${p.kind === "visits" ? "visits" : "points"}`;
}

export function sourceForJoinCode(code: string): Source | null {
  const key = (Object.entries(SOURCES).find(([k]) => k === ({ "loopday-counter": "counter", "loopday-jasmine-story": "jasmine", "loopday-maya-recreate": "maya", "loopday-eli-car": "eli", "loopday-tapmart": "tapmart", "loopday-request": "request", "loopday-direct": "direct" } as Record<string, string>)[code]) ?? [null])[0];
  return key ? SOURCES[key] : null;
}

export { OFFER_DEFAULT, TZ };
