"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { Avatar } from "@/components/v2/ui";
import { updateBusinessProfile } from "../actions";

type Business = {
  id: string; name: string; category: string | null; description: string | null;
  address: string | null; city: string | null; phone: string | null; website: string | null;
  logo_url: string | null; cover_url: string | null; socials: Record<string, string>;
  brand: Record<string, string>; target_note: string | null;
};

const LABEL = "text-sm text-ink-soft";

/** One business profile, filled in progressively. Required stuff on top. */
export function EditBusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: business.name,
    category: business.category ?? "",
    description: business.description ?? "",
    address: business.address ?? "",
    city: business.city ?? "",
    phone: business.phone ?? "",
    website: business.website ?? "",
    logoUrl: business.logo_url ?? "",
    coverUrl: business.cover_url ?? "",
    instagram: business.socials?.instagram ?? "",
    facebook: business.socials?.facebook ?? "",
    tiktok: business.socials?.tiktok ?? "",
    google: business.socials?.google ?? "",
    brandColors: business.brand?.colors ?? "",
    targetNote: business.target_note ?? "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });
  const text = (key: keyof typeof f, label: string, placeholder = "", type = "text") => (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <input className="field" type={type} value={f[key]} maxLength={300}
        onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)} placeholder={placeholder} />
    </label>
  );

  return (
    <form
      className="mt-6 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateBusinessProfile({ businessId: business.id, ...f });
          setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Failed." });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="card overflow-hidden">
        {f.coverUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.coverUrl} alt="" className="h-full w-full object-cover" />
            <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
            <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-ink">Cover</span>
          </div>
        )}
        <div className="flex items-center gap-4 p-4">
          <Avatar src={f.logoUrl || null} name={f.name || business.name} size={56} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-600">Logo</p>
            <p className="mt-0.5 text-sm text-ink-faint">Square works best. Shown next to your jobs.</p>
          </div>
          <Uploader folder="business" accept="image/*" label={f.logoUrl ? "Replace" : "Upload"} onUploaded={(u) => set({ logoUrl: u[0] })} />
        </div>
      </div>

      {text("name", "Business name")}
      {text("category", "Category", "Coffee shop")}
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Description</span>
        <textarea className="field min-h-20" maxLength={2000} value={f.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What you do, in a couple of sentences." />
      </label>
      {text("city", "City", "Raleigh, NC")}
      {text("website", "Website", "https://", "url")}

      <button type="button" className="btn btn-ghost btn-sm mt-1 self-start"
        onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "Fewer options" : "More options: address, phone, socials, brand"}
      </button>

      {showAdvanced && (
        <div className="card-2 flex flex-col gap-3 p-4">
          {text("address", "Address (not shown publicly without your OK)")}
          {text("phone", "Phone")}
          {text("instagram", "Instagram", "https://instagram.com/")}
          {text("facebook", "Facebook")}
          {text("tiktok", "TikTok")}
          {text("google", "Google Business link")}
          {text("brandColors", "Brand colors", "#0b0b0c, #ff3b18")}
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Who is your customer?</span>
            <textarea className="field min-h-16" maxLength={500} value={f.targetNote}
              onChange={(e) => set({ targetNote: e.target.value })}
              placeholder="Helps creators make content that fits." />
          </label>
        </div>
      )}

      {message && (
        <p role="alert" className={`text-sm ${message.ok ? "text-rise" : "alert-text"}`}>{message.text}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-signal btn-lg mt-2 w-full">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
