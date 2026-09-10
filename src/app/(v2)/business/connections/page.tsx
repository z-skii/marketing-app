import { redirect } from "next/navigation";

/** Connected accounts live under Settings, Connections. */
export default function ConnectionsPage() {
  redirect("/business/settings/connections");
}
