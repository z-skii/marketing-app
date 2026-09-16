import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * The V2 Design Lab: an isolated place for the new TapMart visual and UX
 * exploration (docs/design-lab-v2/BRIEF.md). Development only (or
 * DESIGN_LAB=1), no authentication, no database, no server mutations:
 * every screen renders from src/app/design-lab-v2/fixtures.ts. The fonts
 * and the scoped stylesheet arrive with the chosen direction.
 */
export const metadata: Metadata = { title: "TapMart V2 Design Lab", robots: { index: false, follow: false } };

export default function DesignLabV2Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className="v2">{children}</div>;
}
