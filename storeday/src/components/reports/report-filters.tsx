"use client";
import { Download } from "lucide-react";
import { DateRangeBar, ParamSelect, StoreSelect } from "@/components/ui/filters";
import { Segmented } from "@/components/ui/misc";

export interface ToggleOption { href: string; label: string; active?: boolean }

/**
 * Filter bar shared by every report. All state lives in the URL, so the "Export CSV" link
 * (built server-side with the same params) always matches what is on screen.
 */
export function ReportFilters({ locations, employees, categories, toggles, exportHref, showStore = true }: {
  locations: Array<{ id: string; name: string }>;
  employees?: Array<{ value: string; label: string }>;
  categories?: Array<{ value: string; label: string }>;
  toggles?: ToggleOption[];
  exportHref: string;
  showStore?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <DateRangeBar />
      {showStore && locations.length > 1 && <StoreSelect locations={locations} />}
      {employees && <ParamSelect paramKey="employee" options={employees} placeholder="All employees" />}
      {categories && <ParamSelect paramKey="category" options={categories} placeholder="All categories" />}
      {toggles && toggles.length > 0 && <Segmented items={toggles} />}
      <a href={exportHref} className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-[12.5px] font-medium hover:bg-surface-2" download>
        <Download className="h-3.5 w-3.5" /> Export CSV
      </a>
    </div>
  );
}
