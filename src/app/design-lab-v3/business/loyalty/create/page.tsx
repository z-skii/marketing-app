import { Create } from "./Create";

const STEP: Record<string, number> = { program: 1, reward: 2, card: 3, signup: 4, launch: 5 };

/** Create a program in five steps: Program, Reward, Card, Signup, Launch. A focused task without the business navigation. Launch never issues a pass. */
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const sp = await searchParams;
  const step = STEP[sp.step ?? ""] ?? Math.min(5, Math.max(1, Number(sp.step ?? 1) || 1));
  return <div className="record-page"><Create initialStep={step} /></div>;
}
