import { redirect } from "next/navigation";

/** Earnings moved to /earnings; business credit lives under /business/billing. */
export default function WalletPage() {
  redirect("/earnings");
}
