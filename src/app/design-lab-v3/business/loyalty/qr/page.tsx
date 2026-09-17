import { BusinessShell } from "../../../parts";
import { QRView } from "./QRView";

/** The counter QR, the local shareable link and the printout. view=print opens the labelled demo printout. */
export default async function QRPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  if (sp.view === "print") return <QRView print />;
  return <BusinessShell bare active="Business" title="Counter QR" mainClass="loy-main"><QRView /></BusinessShell>;
}
