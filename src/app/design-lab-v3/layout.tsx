import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "../design-lab-v2/v2.css";
import "./v3.css";
import { LoyaltyProvider } from "./store";
import { LabControl } from "./LabControl";

/**
 * The V3 Design Lab: the V2 "Open Cut" exploration carried forward with
 * Loyalty designed in from the beginning (docs/design-lab-v3/BRIEF.md).
 * Development only (or DESIGN_LAB=1), no authentication, no database, no
 * Wallet platform calls, no notification delivery: every screen renders
 * from src/app/design-lab-v3/fixtures.ts through an in-memory store that
 * simulates signup, visits, rewards, redemption and Wallet state. A reload
 * resets it. The V2 Lab at /design-lab-v2 is untouched.
 */

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700"], variable: "--v2-font-display", display: "swap" });
const ui = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--v2-font-ui", display: "swap" });

export const metadata: Metadata = { title: "TapMart V3 Design Lab", robots: { index: false, follow: false } };

export default function DesignLabV3Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className={`v2 v3 ${display.variable} ${ui.variable}`}><LoyaltyProvider>{children}<LabControl /></LoyaltyProvider></div>;
}
