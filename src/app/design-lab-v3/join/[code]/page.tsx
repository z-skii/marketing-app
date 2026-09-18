import { Join } from "../Join";

/**
 * The customer side of Loyalty: /design-lab-v3/join/<joinCode>. The join
 * code is an acquisition code from the fixture registry (loopday-counter,
 * loopday-jasmine-story, loopday-maya-recreate, loopday-eli-car,
 * loopday-direct). Fixture state only: joining creates a member in the
 * lab store; Add to Apple Wallet and Add to Google Wallet are simulated.
 */
export default async function JoinPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ m?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  return <Join code={code} memberId={sp.m ?? null} />;
}
