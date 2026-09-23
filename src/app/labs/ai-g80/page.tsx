import type { Metadata } from "next";
import { AiG80Studio } from "./Studio";
import "./ai-g80.css";

export const metadata: Metadata = { title: "AI 3D test: G80 reference reconstruction", robots: { index: false, follow: false } };

/**
 * One isolated experiment: can reference photos plus public dimensions
 * produce a BMW M3 Competition G80 mesh that a person recognises and
 * that takes a decal? Nothing here touches the rest of TapMart.
 */
export default function AiG80LabPage() {
  return <AiG80Studio />;
}
