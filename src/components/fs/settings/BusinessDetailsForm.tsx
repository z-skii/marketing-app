"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBusinessProfile } from "@/app/(v2)/business/actions";
import { FsUploader } from "@/components/fs/work/Uploader";
import { Img } from "@/components/fs/Img";

type Business = {
  id: string; name: string; category: string | null; description: string | null;
  address: string | null; city: string | null; phone: string | null; website: string | null;
  logo_url: string | null; cover_url: string | null; socials: Record<string, string>;
  brand: Record<string, string>; target_note: string | null;
};

/**
 * Business details: what people and customers see, the essentials first.
 * Logo and cover are real uploads shown as they are; the rest are short
 * fields. The rarely used fields sit behind one disclosure.
 */
export function BusinessDetailsForm({ business }: { business: Business }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: business.name, category: business.category ?? "", description: business.description ?? "",
    address: business.address ?? "", city: business.city ?? "", phone: business.phone ?? "", website: business.website ?? "",
    logoUrl: business.logo_url ?? "", coverUrl: business.cover_url ?? "",
    instagram: business.socials?.instagram ?? "", facebook: business.socials?.facebook ?? "", tiktok: business.socials?.tiktok ?? "", google: business.socials?.google ?? "",
    brandColors: business.brand?.colors ?? "", targetNote: business.target_note ?? "",
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  const field = (key: keyof typeof f, label: string, opts: { placeholder?: string; type?: string; hint?: string } = {}) => (
    <div>
      <label htmlFor={`fs-biz-${key}`} className="fs-field-label">{label}</label>
      <input id={`fs-biz-${key}`} className="fs-input" type={opts.type ?? "text"} value={f[key]} maxLength={300} placeholder={opts.placeholder} onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)} />
      {opts.hint && <p className="fs-t-meta" style={{ marginTop: 4 }}>{opts.hint}</p>}
    </div>
  );

  return (
    <form
      style={{ display: "grid", gap: 16, marginTop: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateBusinessProfile({ businessId: business.id, ...f });
          setMessage(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error ?? "Could not save." });
          if (r.ok) router.refresh();
        });
      }}
    >
      <div className="fs-plane">
        <p className="fs-t-label">Logo and cover</p>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <span className="fs-biz-logo" style={{ width: 72, height: 72 }}>{f.logoUrl ? <Img src={f.logoUrl} alt="Current logo" /> : <span className="fs-t-meta">No logo</span>}</span>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FsUploader id="fs-biz-logo-up" folder="business" accept="image/*" label={f.logoUrl ? "Replace logo" : "Upload logo"} onUploaded={(u) => set({ logoUrl: u[0] })} />
            {f.logoUrl && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => set({ logoUrl: "" })}>Remove</button>}
          </span>
        </div>
        <p className="fs-t-meta" style={{ marginTop: 8 }}>Square works best. Shown beside your campaigns and on your public page.</p>
        <div style={{ marginTop: 16 }}>
          <div className={`fs-biz-cover${f.coverUrl ? "" : " is-empty"}`} style={{ maxWidth: 448 }}>{f.coverUrl ? <Img src={f.coverUrl} alt="Current cover photo" /> : <span>No cover photo</span>}</div>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <FsUploader id="fs-biz-cover-up" folder="business" accept="image/*" label={f.coverUrl ? "Replace cover" : "Upload cover"} onUploaded={(u) => set({ coverUrl: u[0] })} />
            {f.coverUrl && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => set({ coverUrl: "" })}>Remove</button>}
          </span>
        </div>
      </div>

      {field("name", "Business name")}
      {field("category", "Category", { placeholder: "Coffee shop" })}
      <div>
        <label htmlFor="fs-biz-description" className="fs-field-label">Description</label>
        <textarea id="fs-biz-description" className="fs-textarea" maxLength={2000} value={f.description} placeholder="What you do, in a couple of sentences." onChange={(e) => set({ description: e.target.value })} />
      </div>
      {field("city", "City", { placeholder: "Raleigh, NC", hint: "People and cars nearby are matched to this city." })}
      {field("website", "Website", { placeholder: "https://", type: "url" })}

      <details className="fs-disclosure">
        <summary className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Address, phone, socials and customer note</summary>
        <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
          {field("address", "Address", { hint: "Not shown publicly." })}
          {field("phone", "Phone")}
          {field("instagram", "Instagram", { placeholder: "https://instagram.com/" })}
          {field("facebook", "Facebook")}
          {field("tiktok", "TikTok")}
          {field("google", "Google Business link")}
          {field("brandColors", "Brand colours", { placeholder: "#101820, #2450E8", hint: "The approved brand kit overrides this once it exists." })}
          <div>
            <label htmlFor="fs-biz-target" className="fs-field-label">Who is your customer</label>
            <textarea id="fs-biz-target" className="fs-textarea" maxLength={500} value={f.targetNote} placeholder="Helps creators make content that fits." onChange={(e) => set({ targetNote: e.target.value })} />
          </div>
        </div>
      </details>

      {message && <p role="alert" className={message.ok ? "fs-status is-confirmed" : "fs-field-error"}>{message.text}</p>}
      <div><button type="submit" disabled={pending} className="fs-btn fs-btn-primary">{pending ? "Saving" : "Save details"}</button></div>
    </form>
  );
}
