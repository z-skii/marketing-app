import type { Metadata } from "next";
import { Suspense } from "react";
import { TwinStyle } from "./Style";
import "./twin-style.css";

export const metadata: Metadata = { title: "TapMart Standard: digital twin style", robots: { index: false, follow: false } };

/** The refined G80 geometry under TapMart's standard vehicle style: satin paint in the detected colour, black glass, dark wheels, stylised lights. */
export default function TwinStyleLabPage() {
  return <Suspense fallback={null}><TwinStyle /></Suspense>;
}
