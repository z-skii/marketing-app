import type { Metadata } from "next";
import { Suspense } from "react";
import { TwinCompare } from "./Compare";
import "../ai-g80/ai-g80.css";
import "./twin-compare.css";

export const metadata: Metadata = { title: "Prototype 2: twin comparison", robots: { index: false, follow: false } };

/**
 * Two reconstructions of the same capture, side by side, each with its
 * measured validation. The better one carries the one approved surface.
 */
export default function TwinCompareLabPage() {
  return <Suspense fallback={null}><TwinCompare /></Suspense>;
}
