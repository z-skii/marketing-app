import { VehicleLab } from "./Lab";

export const metadata = { title: "3D vehicle lab" };

/**
 * The 3D proof of concept, kept as a page so anyone can check the engine
 * on a real device: rotate, zoom, tap a panel, apply the demo creative,
 * and see the same car as still thumbnails from every preset.
 */
export default function VehicleLabPage() {
  return <VehicleLab />;
}
