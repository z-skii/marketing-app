import { BusinessShell } from "../../parts";
import { BusinessProfile } from "./BusinessProfile";

/** The Business destination: the brand profile with the permanent Loyalty row. Fixture data only. */
export default function BusinessProfilePage() {
  return <BusinessShell active="Business" title="Business"><BusinessProfile /></BusinessShell>;
}
