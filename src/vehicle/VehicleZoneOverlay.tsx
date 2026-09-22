"use client";

import { getVehicle, type PlacementZone, type ZoneKey } from "./catalog";

/**
 * The zone chooser drawn over (or under) the stage: one chip per real
 * surface, grouped by side. Choosing a chip does the same as tapping the
 * panel on the car; the viewer turns the camera to it and the panel
 * lights up. Zones the campaign does not allow are simply not listed.
 */
export function VehicleZoneOverlay({ vehicleId, zones = "all", selected, onSelect, compact = false, className = "" }: {
  vehicleId?: string;
  zones?: readonly ZoneKey[] | "all";
  selected: ZoneKey | null;
  onSelect: (zone: ZoneKey) => void;
  compact?: boolean;
  className?: string;
}) {
  const vehicle = getVehicle(vehicleId);
  const list: PlacementZone[] = zones === "all" ? vehicle.zones : vehicle.zones.filter((z) => zones.includes(z.id));
  if (list.length === 0) return null;
  return (
    <div className={`v3d-zones ${compact ? "is-compact" : ""} ${className}`} role="radiogroup" aria-label="Placement area">
      {list.map((z) => (
        <button key={z.id} type="button" role="radio" aria-checked={selected === z.id} className={`v3d-zone ${selected === z.id ? "is-on" : ""}`} onClick={() => onSelect(z.id)}>
          <span className="v3d-zone-dot" aria-hidden />
          {compact ? shortLabel(z) : z.label}
        </button>
      ))}
    </div>
  );
}

export function shortLabel(z: PlacementZone): string {
  switch (z.id) {
    case "driver_door": return "Driver door";
    case "driver_rear_door": return "Driver rear";
    case "passenger_door": return "Passenger door";
    case "passenger_rear_door": return "Passenger rear";
    case "full_side": return "Full side";
    case "rear_panel": return "Rear";
    default: return z.label;
  }
}
