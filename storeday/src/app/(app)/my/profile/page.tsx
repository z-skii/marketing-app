import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireOrgContext } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AddToHomeScreenHint, ChangePasswordForm, ProfileForm } from "@/components/shifts/profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function MyProfilePage() {
  const ctx = await requireOrgContext();
  const emp = ctx.employee;
  const name = ctx.user.profile?.full_name || (emp ? `${emp.first_name} ${emp.last_name ?? ""}`.trim() : "");
  return (
    <div className="max-w-md mx-auto space-y-3">
      <PageHeader title="Profile" description={<>{ctx.org.name} · <span className="capitalize">{ctx.membership.role}</span></>} />

      <Card>
        <CardHeader title="Your details" description="Name and phone are shown to your managers." />
        <CardBody>
          <ProfileForm fullName={name} phone={ctx.user.profile?.phone ?? emp?.phone ?? ""} email={ctx.user.email} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assigned stores" description={emp ? "Where you can clock in." : undefined} />
        <CardBody>
          {ctx.locations.length === 0 ? (
            <div className="text-[13px] text-text-3">No stores assigned yet. Ask the owner to assign you to a store.</div>
          ) : (
            <ul className="divide-y divide-border">
              {ctx.locations.map((l) => (
                <li key={l.id} className="py-1.5 flex items-center justify-between gap-2 text-[13.5px]">
                  <div className="min-w-0"><div className="font-medium truncate">{l.name}</div><div className="text-[12px] text-text-3 truncate">{[l.address_line1, l.city].filter(Boolean).join(", ") || l.timezone}</div></div>
                  {emp?.default_location_id === l.id && <Badge tone="accent">Default</Badge>}
                </li>
              ))}
            </ul>
          )}
          {!emp && <p className="mt-2 text-[12.5px] text-text-3">You don&apos;t have an employee record, so you can&apos;t clock in yet.</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password" />
        <CardBody><ChangePasswordForm /></CardBody>
      </Card>

      <Card>
        <CardHeader title="App" />
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-[13.5px]">
            <span>Dark mode</span>
            <ThemeToggle className="p-2 rounded-md border border-border text-text-2 hover:bg-surface-2" />
          </div>
          <AddToHomeScreenHint />
          <form action="/auth/sign-out" method="post">
            <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border text-[14px] font-medium hover:bg-surface-2"><LogOut className="h-4 w-4" />Sign out</button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
