import { CardView } from "./CardView";

/** The responsive Wallet concept wrapper: /design-lab-v3/card/<memberCode>?platform=apple|google&state=... Details opens within this route. Saving is simulated; nothing is produced. */
export default async function CardPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ platform?: string; state?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  return <CardView code={code} platform={sp.platform === "google" ? "google" : "apple"} forced={sp.state ?? null} />;
}
