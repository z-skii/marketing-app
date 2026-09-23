import type { Metadata } from "next";
import { Suspense } from "react";
import { TwinCleanup } from "./Cleanup";
import "../ai-g80/ai-g80.css";
import "./twin-cleanup.css";

export const metadata: Metadata = { title: "Twin cleanup: raw, clay, clean", robots: { index: false, follow: false } };

/** One Meshy reconstruction three ways: the raw scan, its bare geometry in clay, and the cleaned digital twin. */
export default function TwinCleanupLabPage() {
  return <Suspense fallback={null}><TwinCleanup /></Suspense>;
}
