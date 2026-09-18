import { BusinessShell } from "../../parts";
import { LoyaltyHome } from "./LoyaltyHome";

/** Loyalty Home: the business's Loyalty overview and its no program, draft and live states. Fixture state only. */
export default function LoyaltyPage() {
  return <BusinessShell bare active="Business" title="Loyalty" mainClass="loy-main"><LoyaltyHome /></BusinessShell>;
}
