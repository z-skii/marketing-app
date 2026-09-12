import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";

/**
 * The small Smart Vehicle assembly: a 184x136 source reservation holding
 * the complete 3:2 photograph, then the facts 12px lower on a square white
 * plane that starts at the photograph's edge and ends at the assembly's
 * lower right: one connected, stepped joint. With a real, permitted
 * model this reservation would load the viewer on activation; this fixture
 * has none, so the honest state is Smart Vehicle · Photos only. No canvas,
 * no fake turntable, no substitute model.
 */
export function VehiclePreview({ vehicle, style }: { vehicle: { label: string; year: number; body: string; color: string; city: string; photo: string; modelUrl: string | null }; style?: CSSProperties }) {
  return (
    <div style={style}>
      <div className="vehicle-assembly" style={{ display: "grid", gridTemplateColumns: "184px minmax(0, 1fr)", gap: 0, alignItems: "start" }}>
        <div style={{ width: 184, height: 136, display: "grid", alignItems: "center" }}>
          <div className="media" style={{ width: 184, height: 123 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vehicle.photo} alt={`${vehicle.color} ${vehicle.year} ${vehicle.label} ${vehicle.body.toLowerCase()}, photographed on the street`} width={184} height={123} />
          </div>
        </div>
        <div style={{ marginTop: "var(--tm-shift-phone)", background: "var(--tm-surface)", minHeight: 124, padding: "12px 12px 0 12px" }}>
          <p className="t-task" style={{ margin: 0 }}>{vehicle.label}</p>
          <p className="t-meta" style={{ margin: "4px 0 0" }}>{vehicle.year} · {vehicle.body}</p>
          <p className="t-meta" style={{ margin: 0 }}>{vehicle.color} · {vehicle.city}</p>
          <Link href="#vehicle" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>View vehicle <ArrowRight size={18} aria-hidden /></Link>
        </div>
      </div>
      <p className="t-meta" style={{ margin: "8px 0 0" }}>Smart Vehicle · {vehicle.modelUrl ? "3D model available" : "Photos only"}</p>
    </div>
  );
}
