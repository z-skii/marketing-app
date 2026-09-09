"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateStepper } from "@/components/ui/filters";

/** ?date= stepper for the Daily Brief. */
export function BriefDateNav({ date, max }: { date: string; max: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <DateStepper date={date} max={max} onChange={(d) => {
      const next = new URLSearchParams(params.toString());
      if (d === max) next.delete("date"); else next.set("date", d);
      router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    }} />
  );
}
