"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { updateBusinessProfile } from "../actions";

type Business = {
  id: string; name: string; category: string | null; description: string | null;
  address: string | null; city: string | null; phone: string | null; website: string | null;
  logo_url: string | null; cover_url: string | null; socials: Record<string, string>;
  brand: Record<string, string>; target_note: string | null;
};

/** One business profile, filled in progressively — required stuff on top. */
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
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <input className="field" type={type} value={f[key]} maxLength={300}
        onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)} placeholder={placeholder} />
    </label>
  );

  return (
    <form
      className="mt-5 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateBusinessProfile({ businessId: business.id, ...f });
          setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Failed." });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <span className="eyebrow">Logo</span>
          <div className="mt-1 flex items-center gap-3">
            {f.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.logoUrl} alt="Logo" className="h-14 w-14 border border-ink object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center border border-dashed border-rule font-mono text-[0.5625rem] text-ink-faint">none</span>
            )}
            <Uploader folder="business" accept="image/*" label="Upload" onUploaded={(u) => set({ logoUrl: u[0] })} />
          </div>
        </div>
      </div>

      {text("name", "Business name")}
      {text("category", "Category", "Coffee shop")}
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Description</span>
        <textarea className="field min-h-20" maxLength={2000} value={f.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What you do, in a couple of sentences." />
      </label>
      {text("city", "City", "Raleigh, NC")}
      {text("website", "Website", "https://…", "url")}

      <button type="button" className="mt-1 self-start font-mono text-xs text-ink-faint underline underline-offset-2 hover:text-ink"
        onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "Hide" : "More"} options — address, phone, socials, brand
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-3 border-l-2 border-rule pl-3">
          {text("address", "Address (not shown publicly without your OK)")}
          {text("phone", "Phone")}
          {text("instagram", "Instagram", "https://instagram.com/…")}
          {text("facebook", "Facebook")}
          {text("tiktok", "TikTok")}
          {text("google", "Google Business link")}
          {text("brandColors", "Brand colors", "#0b0b0c, #ff3b18")}
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Who's your customer?</span>
            <textarea className="field min-h-16" maxLength={500} value={f.targetNote}
              onChange={(e) => set({ targetNote: e.target.value })}
              placeholder="Helps creators make content that fits." />
          </label>
        </div>
      )}

      {message && (
        <p role="alert" className={`font-mono text-xs ${message.ok ? "text-rise" : "text-signal"}`}>{message.text}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-signal mt-2 !py-3">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
