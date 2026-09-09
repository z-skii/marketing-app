"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

/** Shown once right after onboarding (?welcome=1). Dismissing drops the param from the URL. */
export function WelcomeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(params.get("welcome") === "1");
  if (!open) return null;
  const dismiss = () => {
    setOpen(false);
    const next = new URLSearchParams(params.toString());
    next.delete("welcome");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };
  const step = "text-[13px] text-text-2";
  const link = "text-accent font-medium hover:underline";
  return (
    <div className="card border-accent/40 bg-accent-soft/40 px-4 py-3 mb-4 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold">Your business is set up. Next steps:</div>
        <ol className="mt-1 space-y-0.5 list-decimal list-inside">
          <li className={step}><Link href="/employees" className={link}>Add your employees</Link> so they can clock in with Verified Shift.</li>
          <li className={step}>Install Storeday on your phones: open this site in Safari/Chrome and choose <b>Add to Home Screen</b>.</li>
          <li className={step}><Link href="/accounting/quick-close" className={link}>Try Quick Close</Link> at the end of the day — 60 seconds per store.</li>
        </ol>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1 rounded text-text-3 hover:text-text hover:bg-surface-2"><X className="h-4 w-4" /></button>
    </div>
  );
}
