import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./v2.css";

/**
 * The V2 Design Lab: an isolated place for the new TapMart visual and UX
 * exploration (docs/design-lab-v2/BRIEF.md). Development only (or
 * DESIGN_LAB=1), no authentication, no database, no server mutations:
 * every screen renders from src/app/design-lab-v2/fixtures.ts.
 *
 * Direction: "Open Cut" (docs/design-lab-v2/DIRECTIONS.md). Bricolage
 * Grotesque carries the wordmark, public display and identity; DM Sans
 * carries the interface and all money. Both load through next/font.
 */

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700"], variable: "--v2-font-display", display: "swap" });
const ui = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--v2-font-ui", display: "swap" });

export const metadata: Metadata = { title: "TapMart V2 Design Lab", robots: { index: false, follow: false } };

export default function DesignLabV2Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className={`v2 ${display.variable} ${ui.variable}`}>{children}</div>;
}
