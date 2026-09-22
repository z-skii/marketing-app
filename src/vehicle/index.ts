/**
 * The 3D vehicle system. One engine for every car the product shows:
 * the interactive viewer, still thumbnails, the zone chooser and the
 * placement editor all draw the same catalog vehicle with the same
 * surface mapping (docs/vehicles-3d.md).
 */
export { VehicleViewer, Vehicle3D, useReducedMotion, type VehicleViewerProps, type VehicleBadge } from "./VehicleViewer";
export { VehicleThumbnail } from "./VehicleThumbnail";
export { VehicleZoneOverlay, shortLabel } from "./VehicleZoneOverlay";
export { VehiclePlacementEditor, DEMO_CREATIVE, type Creative, type VehiclePlacementEditorProps } from "./VehiclePlacementEditor";
export * from "./catalog";
export * from "./placement";
