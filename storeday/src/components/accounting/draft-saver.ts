"use client";
import * as React from "react";
import type { ActionResult } from "@/lib/action-result";
import { EMPTY_INPUTS, type DailyInputs } from "@/lib/calc/accounting";
import { saveDraftAction } from "@/app/(app)/accounting/actions";
import { localDraftKey, type DailyReportRow, type DraftPatch, type LocalDraft, type MoneyField, type SaveStatus } from "./types";

type DraftKey = keyof DraftPatch;

/**
 * Debounced, coalescing saver for one daily report draft.
 * Only changed fields are sent. Saves are chained so flush() resolves after every pending write.
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

  set<K extends DraftKey>(key: K, value: DraftPatch[K]) {
    this.dirty[key] = value;
    this.onStatus("dirty");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  }

  setMany(patch: DraftPatch) {
    Object.assign(this.dirty, patch);
    this.onStatus("dirty");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  }

  hasDirty() { return Object.keys(this.dirty).length > 0; }

  /** Saves everything dirty now; resolves once all in-flight saves are done. */
  flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.hasDirty()) return this.chain;
    const patch = this.dirty;
    this.dirty = {};
    this.chain = this.chain.then(async () => {
      this.inflight = true;
      this.onStatus("saving");
      try {
        const r = await this.save(patch);
        if (!r.ok) {
          this.dirty = { ...patch, ...this.dirty };
          this.onStatus("error", r.error);
        } else {
          this.onStatus(this.hasDirty() ? "dirty" : "saved");
        }
      } catch (e) {
        this.dirty = { ...patch, ...this.dirty };
        this.onStatus("error", e instanceof Error ? e.message : "Save failed");
      } finally { this.inflight = false; }
    });
    return this.chain;
  }

  dispose() { if (this.timer) clearTimeout(this.timer); }
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

/**
 * Quick Close draft: state + debounced autosave + localStorage mirror.
 * On mount, a newer local draft (updatedAt > server updated_at) is restored and pushed to the server.
 */
export function useQuickCloseDraft(args: { locationId: string; date: string; report: DailyReportRow | null; enabled: boolean }) {
  const { locationId, date, report, enabled } = args;
  const [state, setState] = React.useState<DraftState>({ inputs: reportInputs(report), notes: report?.notes ?? "" });
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const stateRef = React.useRef(state); // kept in sync by setMany (the only writer)

  const saver = React.useMemo(() => new DraftSaver(
    (patch) => saveDraftAction(locationId, date, patch),
    (s, err) => { setStatus(s); setError(err ?? null); },
  ), [locationId, date]);
  React.useEffect(() => () => saver.dispose(), [saver]);

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

  // Restore a newer local draft once.
  React.useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(localDraftKey(locationId, date));
      if (!raw) return;
      const local = JSON.parse(raw) as LocalDraft;
      const serverAt = report?.updated_at ? new Date(report.updated_at).getTime() : 0;
      if (!local.updatedAt || new Date(local.updatedAt).getTime() <= serverAt) { localStorage.removeItem(localDraftKey(locationId, date)); return; }
      const patch: DraftPatch = {};
      for (const k of Object.keys(EMPTY_INPUTS) as MoneyField[]) {
        const v = local.inputs?.[k] ?? null;
        if (v !== stateRef.current.inputs[k]) patch[k] = v;
      }
      if ((local.notes ?? "") !== stateRef.current.notes) patch.notes = local.notes ?? "";
      if (Object.keys(patch).length) setMany(patch);
      else localStorage.removeItem(localDraftKey(locationId, date));
    } catch { /* ignore */ }
  }, [enabled, locationId, date, report?.updated_at, setMany]);

  const flush = React.useCallback(() => saver.flush(), [saver]);
  const clearLocal = React.useCallback(() => { try { localStorage.removeItem(localDraftKey(locationId, date)); } catch { /* ignore */ } }, [locationId, date]);

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

  const flush = React.useCallback(async (locationId?: string) => {
    if (locationId) return saverFor(locationId).flush();
    await Promise.all(Array.from(savers.current.values()).map((s) => s.flush()));
  }, [saverFor]);

  return { rows, status, setField, flush };
}
