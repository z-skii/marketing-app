/** Shared vehicle-zone labels (client-safe). */
export const ZONE_LABELS: Record<string, string> = {
  driver_door: "Driver door",
  passenger_door: "Passenger door",
  driver_rear_door: "Driver rear door",
  passenger_rear_door: "Passenger rear door",
  rear_window: "Rear window",
  rear_panel: "Rear panel",
  bumper: "Bumper",
  hood: "Hood",
  full_side: "Full side",
  partial_wrap: "Partial wrap",
  full_wrap: "Full vehicle wrap",
};

export const ANGLE_STEPS = [
  { key: "front", label: "Front", hint: "Stand ~10 feet back, whole front in frame." },
  { key: "driver_side", label: "Driver side", hint: "Full side profile, doors visible." },
  { key: "rear", label: "Rear", hint: "Whole back of the car, plate is fine to hide." },
  { key: "passenger_side", label: "Passenger side", hint: "Full side profile again." },
] as const;
