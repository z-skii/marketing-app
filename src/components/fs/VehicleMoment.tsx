import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";
import type { VehicleSummary } from "@/lib/v2/opportunities";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";

/**
 * The Smart Vehicle moment on Profile: a 184x136 source reservation, then
 * the facts 12px lower on a white plane that starts at the source's edge.
 * With a real reconstructed model the reservation holds the interactive
 * stage; without one it holds the best real photograph and says so.
 * Never a fake model, never a synthetic angle.
 */
export function VehicleMoment({ vehicle: v, style }: { vehicle: VehicleSummary; style?: CSSProperties }) {
  const has3d = Boolean(v.model_glb_url);
  const photo = v.photo_url ?? v.poster_url ?? null;
  const scanning = v.scan_status && ["queued", "validating", "recognizing", "reconstructing"].includes(v.scan_status);
  const state = has3d ? "3D model" : scanning ? "Scan in progress" : photo ? "Photos only" : "No photos yet";
  const listing = v.status === "listed" && v.available ? "Listed for ads" : v.status === "listed" ? "Paused" : "Not listed yet";
  return (
    <div style={style}>
      <div className="fs-vehicle-assembly">
        <div style={{ width: 184, height: 136, display: "grid", alignItems: "center" }}>
          {has3d ? (
            <div className="fs-media" style={{ position: "relative", width: 184, height: 136, background: "var(--fs-studio-floor)" }}>
              <VehicleStage glbUrl={v.model_glb_url} posterUrl={v.poster_url} photos={[]} label={null} fill />
            </div>
          ) : photo ? (
            <div className="fs-media" style={{ width: 184, height: 123 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`${v.year} ${v.make} ${v.model}`} width={184} height={123} />
            </div>
          ) : (
            <div style={{ width: 184, height: 123, display: "grid", placeItems: "center", background: "var(--fs-underlay)", borderRadius: 4, color: "var(--fs-muted)", fontSize: 14, lineHeight: "20px", textAlign: "center", padding: 12 }}>No photos yet</div>
          )}
        </div>
        <div style={{ marginTop: "var(--fs-shift-phone)", background: "var(--fs-surface)", minHeight: 124, padding: "12px 12px 0" }}>
          <p className="fs-t-task">{v.year} {v.make} {v.model}</p>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{[v.body_type, v.color].filter(Boolean).join(" · ") || listing}</p>
          <p className="fs-t-meta">{[v.city, v.body_type || v.color ? listing : null].filter(Boolean).join(" · ")}</p>
          <Link href={`/me/vehicles/${v.id}`} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>View vehicle <ArrowRight size={18} aria-hidden /></Link>
        </div>
      </div>
      <p className="fs-t-meta" style={{ marginTop: 8 }}>Smart Vehicle · {state}{!has3d && !scanning && v.scan_id ? "" : ""}</p>
    </div>
  );
}
