"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { updateProfile } from "../actions";

export function EditProfileForm({
  initial,
}: { initial: { displayName: string; bio: string; city: string; avatarUrl: string } }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-5 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile(f);
          setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Failed." });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-3">
        {f.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.avatarUrl} alt="Profile" className="h-16 w-16 border border-ink object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center border border-dashed border-rule font-mono text-[0.5625rem] text-ink-faint">
            photo
          </span>
        )}
        <Uploader folder="avatars" accept="image/*" label="Change photo" onUploaded={(u) => setF({ ...f, avatarUrl: u[0] })} />
      </div>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Display name</span>
        <input className="field" maxLength={60} value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Bio</span>
        <textarea className="field min-h-20" maxLength={500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })}
          placeholder="What you do, what you're into." />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">City</span>
        <input className="field" maxLength={60} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Raleigh, NC" />
        <span className="font-mono text-[0.625rem] text-ink-faint">Shown publicly at city level only.</span>
      </label>
      {message && <p role="alert" className={`font-mono text-xs ${message.ok ? "text-rise" : "text-signal"}`}>{message.text}</p>}
      <button type="submit" disabled={pending} className="btn btn-signal mt-1 !py-3">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
