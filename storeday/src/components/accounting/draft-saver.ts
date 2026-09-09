"use client";
import * as React from "react";
import type { ActionResult } from "@/lib/action-result";
import { EMPTY_INPUTS, type DailyInputs } from "@/lib/calc/accounting";
import { saveDraftAction } from "@/app/(app)/accounting/actions";
import { localDraftKey, type DailyReportRow, type DraftPatch, type LocalDraft, type MoneyField, type SaveStatus } from "./types";

type DraftKey = keyof DraftPatch;
const RETRY_MS = 3000;

/**
 * Debounced, coalescing saver for one daily report draft.
 * Only changed fields are sent. Saves are chained; flush() resolves to false when anything is still unsaved.
 * Failed saves keep their fields dirty and retry automatically.
 */
export class DraftSaver {
  private dirty: DraftPatch = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private chain: Promise<void> = Promise.resolve();
  private inflight = false;

  constructor(
    private readonly save: (patch: DraftPatch) => Promise<ActionResult<unknown>>,
    private readonly onStatus: (status: SaveStatus, error?: string) => void,
    private readonly delay = 700,
  ) {}

  set<K extends DraftKey>(key: K, value: DraftPatch[K]) { this.setMany({ [key]: value } as DraftPatch); }

  setMany(patch: DraftPatch) {
    Object.assign(this.dirty, patch);
    this.onStatus("dirty");
    this.arm(this.delay);
  }

  hasDirty() { return Object.keys(this.dirty).length > 0; }
  /** Unsaved or still saving. */
  hasPending() { return this.inflight || this.hasDirty(); }

  private arm(ms: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), ms);
  }

  /** Saves everything dirty now. Resolves to true only when every change reached the server. */
  flush(): Promise<boolean> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.hasDirty()) {
      const patch = this.dirty;
      this.dirty = {};
      this.chain = this.chain.then(async () => {
        this.inflight = true;
        this.onStatus("saving");
        try {
          const r = await this.save(patch);
          if (!r.ok) throw new Error(r.error);
          this.onStatus(this.hasDirty() ? "dirty" : "saved");
        } catch (e) {
          this.dirty = { ...patch, ...this.dirty };
          this.onStatus("error", e instanceof Error ? e.message : "Save failed");
          this.arm(RETRY_MS);
        } finally { this.inflight = false; }
      });
    }
    return this.chain.then(() => !this.hasDirty());
  }

  /** Component going away: push whatever is still pending instead of dropping it. */
  dispose() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.hasDirty()) void this.flush();
  }
}

export interface DraftState { inputs: DailyInputs; notes: string }

export function reportInputs(r: Pick<DailyReportRow, MoneyField> | null | undefined): DailyInputs {
  if (!r) return { ...EMPTY_INPUTS };
  const out = { ...EMPTY_INPUTS };
  for (const k of Object.keys(EMPTY_INPUTS) as MoneyField[]) {
    const v = r[k];
    out[k] = v == null ? null : Number(v);
  }
  return out;
}

function stateFromReport(report: DailyReportRow | null): DraftState {
  return { inputs: reportInputs(report), notes: report?.notes ?? "" };
}

/**
 * Quick Close draft: state + debounced autosave + localStorage mirror.
 * - The mirror is cleared as soon as the server confirms a save; on mount a leftover (newer than the server row) is restored and pushed.
 * - When the server row changes underneath us (close / reopen / edit) and nothing is pending, state is re-synced from it.
 */
export function useQuickCloseDraft(args: { locationId: string; date: string; report: DailyReportRow | null; enabled: boolean }) {
  const { locationId, date, report, enabled } = args;
  const [state, setState] = React.useState<DraftState>(() => stateFromReport(report));
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const stateRef = React.useRef(state);
  React.useEffect(() => { stateRef.current = state; }, [state]);

  const clearLocal = React.useCallback(() => { try { localStorage.removeItem(localDraftKey(locationId, date)); } catch { /* ignore */ } }, [locationId, date]);

  const saver = React.useMemo(() => new DraftSaver(
    (patch) => saveDraftAction(locationId, date, patch),
    (s, err) => {
      setStatus(s); setError(err ?? null);
      if (s === "saved") clearLocal();
    },
  ), [locationId, date, clearLocal]);
  React.useEffect(() => () => saver.dispose(), [saver]);

  // Server row changed (close / reopen / audited edit): adopt it unless we have unsaved typing.
  const serverAt = report?.updated_at ?? null;
  const [seenAt, setSeenAt] = React.useState(serverAt);
  if (serverAt !== seenAt) {
    setSeenAt(serverAt);
    if (!saver.hasPending()) setState(stateFromReport(report));
  }

  const mirror = React.useCallback((next: DraftState) => {
    try { localStorage.setItem(localDraftKey(locationId, date), JSON.stringify({ ...next, updatedAt: new Date().toISOString() } satisfies LocalDraft)); } catch { /* ignore */ }
  }, [locationId, date]);

  const setMany = React.useCallback((patch: DraftPatch) => {
    if (!enabled) return;
    const prev = stateRef.current;
    const next: DraftState = { inputs: { ...prev.inputs }, notes: prev.notes };
    const send: DraftPatch = {};
    for (const [k, v] of Object.entries(patch) as Array<[DraftKey, DraftPatch[DraftKey]]>) {
      if (k === "notes") { const n = (v as string | null) ?? ""; if (n !== prev.notes) { next.notes = n; send.notes = n; } }
      else { const n = v as number | null; if (n !== prev.inputs[k]) { next.inputs[k] = n; send[k] = n; } }
    }
    if (Object.keys(send).length === 0) return;
    stateRef.current = next;
    setState(next);
    mirror(next);
    saver.setMany(send);
  }, [enabled, mirror, saver]);

  const setField = React.useCallback(<K extends DraftKey>(key: K, value: DraftPatch[K]) => setMany({ [key]: value } as DraftPatch), [setMany]);

  // Fallback: a mirror that survived (tab closed mid-save) and is newer than the server row is restored and pushed.
  React.useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(localDraftKey(locationId, date));
      if (!raw) return;
      const local = JSON.parse(raw) as LocalDraft;
      const serverTs = report?.updated_at ? new Date(report.updated_at).getTime() : 0;
      if (!local.updatedAt || new Date(local.updatedAt).getTime() <= serverTs) { clearLocal(); return; }
      const patch: DraftPatch = {};
      for (const k of Object.keys(EMPTY_INPUTS) as MoneyField[]) {
        const v = local.inputs?.[k] ?? null;
        if (v !== stateRef.current.inputs[k]) patch[k] = v;
      }
      if ((local.notes ?? "") !== stateRef.current.notes) patch.notes = local.notes ?? "";
      if (Object.keys(patch).length) setMany(patch);
      else clearLocal();
    } catch { /* ignore */ }
  }, [enabled, locationId, date, report?.updated_at, setMany, clearLocal]);

  const flush = React.useCallback(() => saver.flush(), [saver]);

  return { state, status, error, setField, setMany, flush, clearLocal };
}

/** Rapid Entry: one draft saver per location, shared state map. */
export function useMultiDraft(date: string, initial: Record<string, DailyInputs>) {
  const [rows, setRows] = React.useState<Record<string, DailyInputs>>(initial);
  const [status, setStatus] = React.useState<Record<string, { s: SaveStatus; error?: string }>>({});
  const savers = React.useRef<Map<string, DraftSaver>>(new Map());
  const rowsRef = React.useRef(rows); // kept in sync by setField (the only writer)

  const saverFor = React.useCallback((locationId: string) => {
    let s = savers.current.get(locationId);
    if (!s) {
      s = new DraftSaver(
        (patch) => saveDraftAction(locationId, date, patch),
        (st, err) => setStatus((p) => ({ ...p, [locationId]: { s: st, error: err } })),
      );
      savers.current.set(locationId, s);
    }
    return s;
  }, [date]);

  React.useEffect(() => {
    const map = savers.current;
    return () => { map.forEach((s) => s.dispose()); map.clear(); };
  }, [date]);

  const setField = React.useCallback((locationId: string, key: MoneyField, value: number | null) => {
    const cur = rowsRef.current[locationId] ?? EMPTY_INPUTS;
    if (cur[key] === value) return;
    const next = { ...rowsRef.current, [locationId]: { ...cur, [key]: value } };
    rowsRef.current = next;
    setRows(next);
    saverFor(locationId).set(key, value);
  }, [saverFor]);

  /** Resolves to true only when every pending change (for the given stores, or all) is on the server. */
  const flush = React.useCallback(async (locationIds?: string[]): Promise<boolean> => {
    const targets = locationIds ? locationIds.map((id) => saverFor(id)) : Array.from(savers.current.values());
    const results = await Promise.all(targets.map((s) => s.flush()));
    return results.every(Boolean);
  }, [saverFor]);

  return { rows, status, setField, flush };
}
