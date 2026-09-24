import type { Metadata } from "next";
import { Suspense } from "react";
import { TwinBuilder } from "./Builder";
import "./twin-builder.css";

export const metadata: Metadata = { title: "Twin builder lab: G80 skeleton", robots: { index: false, follow: false } };

/** Engineering lab for the vehicle twin builder: stage selector, fitted curve skeleton, source overlays. Not a customer screen. */
export default function TwinBuilderLabPage() {
  return <Suspense fallback={null}><TwinBuilder /></Suspense>;
}
