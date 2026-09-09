"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createScheduleAction, deleteScheduleAction, updateScheduleAction } from "@/app/(app)/schedule/actions";
import { businessDateOf } from "@/lib/utils/time";
import { durationHours, shiftBounds, wallClockTime } from "./schedule-time";

export interface ShiftRow { id: string; employee_id: string; location_id: string; starts_at: string; ends_at: string; note: string | null; series_id: string | null }

export type ShiftModalState =
  | { mode: "add"; employee_id?: string; date: string }
  | { mode: "edit"; shift: ShiftRow };

export function ShiftModal({ state, timezone, locationId, locations, employees, onClose }: {
  state: ShiftModalState; timezone: string; locationId: string;
  locations: Array<{ id: string; name: string; timezone: string }>;
  employees: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"single" | "series" | null>(null);
  const edit = state.mode === "edit" ? state.shift : null;

  const [form, setForm] = useState(() => ({
    employee_id: edit?.employee_id ?? (state.mode === "add" ? state.employee_id ?? employees[0]?.id ?? "" : ""),
    location_id: edit?.location_id ?? locationId,
    date: edit ? businessDateOf(edit.starts_at, timezone) : state.mode === "add" ? state.date : "",
    start_time: edit ? wallClockTime(edit.starts_at, timezone) : "09:00",
    end_time: edit ? wallClockTime(edit.ends_at, timezone) : "17:00",
    note: edit?.note ?? "",
    repeat_weeks: 1,
  }));
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const tz = locations.find((l) => l.id === form.location_id)?.timezone ?? timezone;
  const preview = form.date && form.start_time && form.end_time ? shiftBounds(form.date, form.start_time, form.end_time, tz) : null;
  const hours = preview ? durationHours(preview.starts_at, preview.ends_at) : 0;
  const overnight = !!preview && form.end_time <= form.start_time;

  const save = () => start(async () => {
    setError(null);
    const res = edit
      ? await updateScheduleAction(edit.id, { employee_id: form.employee_id, location_id: form.location_id, date: form.date, start_time: form.start_time, end_time: form.end_time, note: form.note })
      : await createScheduleAction({ employee_id: form.employee_id, location_id: form.location_id, date: form.date, start_time: form.start_time, end_time: form.end_time, note: form.note, repeat_weeks: form.repeat_weeks });
    if (!res.ok) { setError(res.error); return; }
    toast.push(edit ? "Shift updated" : form.repeat_weeks > 1 ? `${form.repeat_weeks} shifts added` : "Shift added", "success");
    onClose();
    router.refresh();
  });

  const remove = (scope: "single" | "series") => start(async () => {
    if (!edit) return;
    setError(null);
    const res = await deleteScheduleAction(edit.id, scope);
    if (!res.ok) { setError(res.error); setConfirm(null); return; }
    toast.push(scope === "series" ? `${res.data.deleted} shifts deleted` : "Shift deleted", "success");
    onClose();
    router.refresh();
  });

  return (
    <Modal open onClose={onClose} title={edit ? "Edit shift" : "Add shift"}
      footer={<>
        {edit && !confirm && (
          <div className="mr-auto flex gap-1">
            <Button variant="ghost" size="sm" className="text-danger" type="button" onClick={() => setConfirm("single")} disabled={pending}>Delete</Button>
            {edit.series_id && <Button variant="ghost" size="sm" className="text-danger" type="button" onClick={() => setConfirm("series")} disabled={pending}>Delete series</Button>}
          </div>
        )}
        {confirm ? (
          <>
            <span className="mr-auto text-[12.5px] text-text-2">{confirm === "series" ? "Delete every shift in this weekly series?" : "Delete this shift?"}</span>
            <Button variant="secondary" size="sm" type="button" onClick={() => setConfirm(null)} disabled={pending}>Keep</Button>
            <Button variant="danger" size="sm" type="button" onClick={() => remove(confirm)} loading={pending}>{confirm === "series" ? "Delete series" : "Delete"}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" type="button" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button type="button" onClick={save} loading={pending} disabled={!form.employee_id || !form.date}>{edit ? "Save" : form.repeat_weeks > 1 ? `Add ${form.repeat_weeks} shifts` : "Add shift"}</Button>
          </>
        )}
      </>}>
      <div className="space-y-3">
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Employee" className="col-span-2 sm:col-span-1">
            <Select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)}>
              {!form.employee_id && <option value="">Choose…</option>}
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <Field label="Store" className="col-span-2 sm:col-span-1">
            <Select value={form.location_id} onChange={(e) => set("location_id", e.target.value)}>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="Date" className="col-span-2"><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required /></Field>
          <Field label="Start"><Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} required step={300} /></Field>
          <Field label="End" hint={overnight ? "next day" : undefined}><Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} required step={300} /></Field>
        </div>
        {preview && <div className="text-[12.5px] text-text-3 tnum">{hours.toFixed(hours % 1 ? 2 : 0)} hours{overnight ? " · overnight shift" : ""}</div>}
        <Field label="Note" hint="optional"><Textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={2} placeholder="Covering for Sam" className="min-h-[52px]" /></Field>
        {!edit && (
          <Field label="Repeat weekly for" hint="1 = only this shift">
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={52} value={form.repeat_weeks} onChange={(e) => set("repeat_weeks", Math.max(1, Math.min(52, Number(e.target.value) || 1)))} className="w-20 tnum" inputMode="numeric" />
              <span className="text-[13px] text-text-2">week{form.repeat_weeks === 1 ? "" : "s"}</span>
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}
