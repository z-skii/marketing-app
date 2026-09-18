import { BusinessShell } from "../../../../parts";
import { Composer } from "./Composer";

/** Compose, preview and simulate one business Wallet update. Review is a step of this route. */
export default function ComposerPage() {
  return <BusinessShell bare active="Business" title="Send update" mainClass="loy-main"><Composer /></BusinessShell>;
}
