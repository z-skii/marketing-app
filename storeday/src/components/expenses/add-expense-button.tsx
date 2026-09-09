"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseModal } from "./expense-modal";
import type { CategoryOption, LocationOption } from "./expense-form";

/** "+ ADD EXPENSE" — opens the full expense dialog. */
export function AddExpenseButton({ organizationId, locations, categories, today, currency, defaultLocationId, size = "md" }: {
  organizationId: string; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; defaultLocationId?: string; size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} onClick={() => setOpen(true)} disabled={locations.length === 0 || categories.length === 0}
        title={locations.length === 0 ? "Add a store first" : categories.length === 0 ? "Add a category first" : undefined}>
        <Plus className="h-4 w-4" />Add expense
      </Button>
      <ExpenseModal open={open} onClose={() => setOpen(false)} organizationId={organizationId} locations={locations} categories={categories} today={today} currency={currency} defaultLocationId={defaultLocationId} />
    </>
  );
}
