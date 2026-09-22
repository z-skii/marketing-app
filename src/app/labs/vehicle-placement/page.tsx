import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacementStudio } from "./Studio";
import "./labs.css";

export const metadata: Metadata = { title: "Vehicle placement lab", robots: { index: false, follow: false } };

/**
 * The isolated proof of concept for car advertising placement: the 3D
 * vehicle is the interface. Public on purpose so it can be tested on any
 * phone without an account; it stores nothing.
 */
export default function VehiclePlacementLabPage() {
  return <Suspense fallback={null}><PlacementStudio /></Suspense>;
}
