import { BusinessShell } from "../../../parts";
import { Updates } from "./Updates";

/** Wallet updates: automatic and business authored, explicitly simulated. */
export default function UpdatesPage() {
  return <BusinessShell bare active="Business" title="Wallet updates" mainClass="loy-main"><Updates /></BusinessShell>;
}
