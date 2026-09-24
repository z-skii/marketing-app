"use client";

import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VEHICLES, type CameraPresetKey } from "@/vehicle/catalog";
import { makePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";
import { STANDARD_COLOURS, type StandardColourKey } from "@/vehicle/style/standard";
import { STYLE_NOTES } from "./notes";

/**
 * Customer facing: the vehicle, its name, three colours, the ad. Everything technical sits behind Details.
 * The geometry is the refined twin of /labs/twin-refinement, untouched; only the materials change.
 */
const VEHICLE_ID = "syn-g80-meshy-standard";
const TEST_CREATIVE = "/vehicles/tapmart-test-creative.svg";
const KEYS: StandardColourKey[] = ["black", "graphite", "white"];

export function TwinStyle() {
  const params = useSearchParams();
  const initialColour = KEYS.find((k) => k === params.get("colour")) ?? "graphite";
  const initial = (["hero", "front", "driver", "rear", "passenger"] as const).find((k) => k === params.get("view")) ?? "hero";
  const [colour, setColour] = useState<StandardColourKey>(initialColour);
  const [ad, setAd] = useState(params.get("ad") === "1");
  const [details, setDetails] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 767px)"); const on = () => setNarrow(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  const vehicle = VEHICLES[VEHICLE_ID];
  const placement: Placement | null = ad ? { ...makePlacement("driver_door", TEST_CREATIVE), scale: 0.82 } : null;
  const presetKeys: CameraPresetKey[] = ["front", "driver", "rear", "passenger"];

  return (
    <main className="tws">
      <section className="tws-stage" aria-label="Digital twin">
        <VehicleViewer
          vehicleId={VEHICLE_ID}
          placement={placement}
          selectedZone={ad ? "driver_door" : null}
          selectableZones="none"
          showHighlight={false}
          theme="light"
          aspect="fill"
          eager
          presets
          presetKeys={presetKeys}
          presetStyle="subtle"
          followZone={false}
          initialPreset={initial}
          studio="tapmart"
          standard={{ bodyHex: STANDARD_COLOURS[colour].hex }}
          distance={narrow ? 1.28 : 1}
          hint={false}
        />
      </section>

      <header className="tws-head">
        <p className="tws-kicker">TapMart digital twin</p>
        <h1 className="tws-name">{vehicle.make} M3 Competition</h1>
        <p className="tws-sub">{STANDARD_COLOURS[colour].label}{colour === "graphite" ? ", the detected colour" : ""}</p>
      </header>

      <div className="tws-bar">
        <div className="tws-colours" role="group" aria-label="Body colour">
          {KEYS.map((k) => (
            <button key={k} type="button" className={`tws-swatch ${colour === k ? "is-on" : ""}`} aria-pressed={colour === k} aria-label={STANDARD_COLOURS[k].label} title={STANDARD_COLOURS[k].label} onClick={() => setColour(k)}>
              <i style={{ background: STANDARD_COLOURS[k].hex }} aria-hidden />
              <span>{STANDARD_COLOURS[k].label.replace("Matte ", "")}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`tws-ad ${ad ? "is-on" : ""}`} aria-pressed={ad} onClick={() => setAd((a) => !a)}>{ad ? "Ad on" : "Ad off"}</button>
      </div>

      <button type="button" className="tws-details-btn" aria-expanded={details} onClick={() => setDetails((d) => !d)}>{details ? "Close" : "Details"}</button>
      {details && (
        <aside className="tws-details" aria-label="Details">
          <h2>How this twin is rendered</h2>
          <dl>
            {STYLE_NOTES.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}
          </dl>
        </aside>
      )}
    </main>
  );
}
