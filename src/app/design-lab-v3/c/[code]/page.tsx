import { Handoff } from "./Handoff";

/** A fixture campaign link: /design-lab-v3/c/<linkCode>. Resolves through the link registry, records a simulated trusted click after a deliberate tap, then opens the source aware signup. */
export default async function LinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Handoff code={code} />;
}
