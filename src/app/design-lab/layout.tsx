import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./lab.css";

export const metadata: Metadata = { title: "TapMart Design Lab", robots: { index: false, follow: false } };

/**
 * The Design Lab: an isolated place to prove a visual direction in real
 * React and CSS before anything touches the product. Development only
 * (or DESIGN_LAB=1), no authentication, no database, no server mutations:
 * every screen renders from src/app/design-lab/mock.ts.
 */
export default function DesignLabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_LAB !== "1") notFound();
  return <div className="lab">{children}</div>;
}
