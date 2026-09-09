import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The calendar became the Content tab. */
export default function CalendarRedirect() {
  redirect("/business/content");
}
