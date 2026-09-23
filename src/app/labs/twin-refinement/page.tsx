import type { Metadata } from "next";
import { Suspense } from "react";
import { TwinRefinement } from "./Refinement";
import "../ai-g80/ai-g80.css";
import "./twin-refinement.css";

export const metadata: Metadata = { title: "Twin refinement: source views to semantic twin", robots: { index: false, follow: false } };

/** The cleaned Meshy twin refined from the sixteen source views: semantic regions, panel lines, premium paint. */
export default function TwinRefinementLabPage() {
  return <Suspense fallback={null}><TwinRefinement /></Suspense>;
}
