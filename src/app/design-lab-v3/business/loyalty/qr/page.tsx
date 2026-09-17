import { BusinessShell } from "../../../parts";
import { QRView } from "./QRView";

/** The counter QR as a focused task (no business bottom bar), the local shareable link and the printout. view=print opens the labelled demo printout. */
export default async function QRPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  if (sp.view === "print") return <QRView print />;
  return <div className="record-page"><div className="record-context" inert aria-hidden><BusinessShell bare active="Business" title="Counter QR" mainClass="loy-main"><span /></BusinessShell></div><aside className="record-pane" aria-label="Counter QR"><QRView /></aside></div>;
}
