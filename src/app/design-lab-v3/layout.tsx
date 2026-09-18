import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DM_Sans } from "next/font/google";
import "../design-lab-v2/v2.css";
import "./v3.css";
import "./x/x.css";
import "./x/site.css";
import "./x/film.css";
import "./x/app.css";
import "./x/surfaces.css";
import { MotionProvider } from "./x/motion";
import { LoyaltyProvider } from "./store";
import { LabControl } from "./LabControl";

/**
 * The V3 Design Lab: the whole TapMart experience in the V3 material and
 * motion language (docs/design-lab-v3/EXPERIENCE_DIRECTION.md) with the
 * approved Loyalty foundation kept intact (docs/design-lab-v3/BRIEF.md).
 * Development only (or DESIGN_LAB=1), no authentication, no database, no
 * Wallet platform calls, no notification delivery: every screen renders
 * from src/app/design-lab-v3/fixtures.ts through an in-memory store that
 * simulates signup, visits, rewards, redemption and Wallet state. A reload
 * resets it. The V2 Lab at /design-lab-v2 is untouched.
 */

const ui = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--v2-font-ui", display: "swap" });
// V3 retires the Bricolage display treatment: DM Sans carries every size (EXPERIENCE_DIRECTION.md, typography).

export const metadata: Metadata = { title: "TapMart V3 Design Lab", robots: { index: false, follow: false } };

export default function DesignLabV3Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className={`v2 v3 ${ui.variable}`}><LoyaltyProvider><MotionProvider>{children}<LabControl /></MotionProvider></LoyaltyProvider></div>;
}
