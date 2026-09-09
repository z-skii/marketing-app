"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/** Text filter kept in the URL (?q=). Applies on Enter or after a short pause. */
export function SearchBox({ paramKey = "q", placeholder = "Search" }: { paramKey?: string; placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramKey) ?? "";
  const [value, setValue] = useState(current);

  const apply = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v.trim()) next.set(paramKey, v.trim()); else next.delete(paramKey);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => apply(value), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form className="relative" onSubmit={(e) => { e.preventDefault(); apply(value); }}>
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-3 pointer-events-none" />
      <input type="search" className="field w-44 sm:w-52 py-1 pl-7 pr-7" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} aria-label={placeholder} />
      {value && <button type="button" onClick={() => { setValue(""); apply(""); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-text-3 hover:text-text" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
    </form>
  );
}
