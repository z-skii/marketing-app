import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import "./lab.css";

/**
 * The Design Lab: an isolated place to prove a visual direction in real
 * React and CSS before anything touches the product. Development only
 * (or DESIGN_LAB=1), no authentication, no database, no server mutations:
 * every screen renders from src/app/design-lab/mock.ts.
 *
 * Direction: "Frame Shift" (docs/reboot/visual/VISUAL_DIRECTION.md).
 * Archivo carries display, identity and money; IBM Plex Sans carries the
 * interface. Both load through next/font with swap and Latin subsets.
 */

const display = Archivo({ subsets: ["latin"], weight: "variable", variable: "--font-display", display: "swap" });
const ui = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = { title: "TapMart Design Lab", robots: { index: false, follow: false } };

export default function DesignLabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className={`lab ${display.variable} ${ui.variable}`}>{children}</div>;
}
