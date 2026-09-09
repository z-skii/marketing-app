import type { Metadata } from "next";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/data/team";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { ManualShiftForm } from "@/components/shifts/manual-shift-form";

export const metadata: Metadata = { title: "Add shift" };

export default async function NewShiftPage({ searchParams }: { searchParams: Promise<{ employee?: string; location?: string; date?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const employees = await listEmployees(supabase, ctx.org.id);
  const back = sp.employee ? { href: `/employees/${sp.employee}`, label: "Employee" } : { href: "/working", label: "Who's Working" };
  return (
    <div className="max-w-xl mx-auto">
      <PageHeader back={back} title="Add shift manually" description="For a forgotten clock-in. Recorded as a manual entry with your reason in the audit log." />
      <Card>
        <CardBody className="pt-4">
          <ManualShiftForm
            employees={employees.map((e) => ({ id: e.id, name: e.full_name }))}
            locations={ctx.locations.map((l) => ({ id: l.id, name: l.name, timezone: l.timezone }))}
            defaults={{ employee_id: sp.employee, location_id: sp.location, date: sp.date ?? ctx.today }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
