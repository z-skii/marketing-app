import Link from "next/link";
import { VehiclePlacementEditor } from "@/vehicle/VehiclePlacementEditor";

export const metadata = { title: "Placement editor" };

/** The placement editor on its own, saving to this browser only. */
export default function VehicleLabEditorPage() {
  return (
    <div>
      <div className="ap-head" style={{ flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h1>Placement editor</h1>
          <p className="ap-sub">Pick a creative, tap a panel on the car, adjust, preview. Saved in this browser.</p>
        </div>
        <Link href="/vehicle-lab" className="v3d-btn" style={{ flexShrink: 0 }}>Back to the lab</Link>
      </div>
      <div style={{ marginTop: 16 }}>
        <VehiclePlacementEditor storageKey="tapmart.vehicle-lab.placement" caption="2021 BMW M3 Competition (G80)" />
      </div>
    </div>
  );
}
