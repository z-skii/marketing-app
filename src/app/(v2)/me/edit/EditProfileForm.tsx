"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { Avatar } from "@/components/v2/ui";
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
      className="mt-6 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile(f);
          setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Failed." });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="card flex items-center gap-4 p-4">
        <Avatar src={f.avatarUrl || null} name={f.displayName || "?"} size={72} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.9375rem] font-700">Profile photo</p>
          <p className="mb-2 text-sm text-ink-faint">A clear photo of you gets more replies.</p>
          <Uploader folder="avatars" accept="image/*" label="Change photo" onUploaded={(u) => setF({ ...f, avatarUrl: u[0] })} />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">Display name</span>
        <input className="field" maxLength={60} value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">Bio</span>
        <textarea className="field min-h-24" maxLength={500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })}
          placeholder="What you do, what you're into." />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">City</span>
        <input className="field" maxLength={60} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Raleigh, NC" />
        <span className="text-sm text-ink-faint">Shown publicly at city level only.</span>
      </label>
      {message && <p role="alert" className={`text-sm ${message.ok ? "text-rise" : "alert-text"}`}>{message.text}</p>}
      <button type="submit" disabled={pending} className="btn btn-signal btn-lg mt-1">
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}
