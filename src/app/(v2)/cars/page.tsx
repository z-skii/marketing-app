import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old address. Car campaigns are on Home; the car itself lives under Profile. */
export default function LegacyCarsPage() {
  redirect("/home?f=cars");
}
