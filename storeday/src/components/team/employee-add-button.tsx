"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmployeeQuickAdd } from "@/components/team/employee-quick-add";

/** "+ Add employee" → EmployeeQuickAdd in a dialog. Owner only (the action re-checks). */
export function EmployeeAddButton({ locations }: { locations: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const onAdded = useCallback(() => router.refresh(), [router]);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add employee</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add employee" size="lg">
        <p className="text-[12.5px] text-text-3 mb-3">Adding an email creates an invitation link. The person joins by opening it; until then their record is used for schedules and manual shifts only.</p>
        <EmployeeQuickAdd locations={locations} onAdded={onAdded} />
      </Modal>
    </>
  );
}
