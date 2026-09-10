import { redirect } from "next/navigation";

/** Connected accounts now live on the Social screen. */
export default function ConnectionsPage() {
  redirect("/business/social");
}
