import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Campaign credit is added from Business mode now. */
export default function AddCreditRedirect() {
  redirect("/business/billing");
}
