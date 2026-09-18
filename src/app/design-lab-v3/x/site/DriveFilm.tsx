"use client";

import Link from "next/link";
import { useRef } from "react";
import { homeOpportunities, money } from "../../../design-lab-v2/fixtures";
import { M } from "../media";
import { FilmControls, Scene, damped, openEase, useFilm, type Beat, type Tracks, type Viewport } from "../Film";

/**
 * The Drive scene (RECOMPOSE_DIRECTION.md, drive): one photographed
 * vehicle example (the director's approved oxblood wagon, an illustrative
 * lab asset, not Eli's listing) inside a fixed aperture. The photograph
 * enters, the crop shifts closer without changing perspective, the
 * registered rear door zone reveals through a shutter, a coded Spurroom
 * Bikes placement specimen attaches to that door under the photographed
 * handle, the campaign sheet opens from the zone's label, and the
 * conditional monthly amount extends it. The zone polygon, the specimen
 * plane and the handle occlusion are stored against this exact asset in
 * normalized image coordinates and live under the photograph's own
 * transform, so the crop shift cannot make the overlay swim. Nothing here
 * is an installation, proof or an accepted offer: US$300 /month is the
 * campaign opportunity, approved monthly.
 */
const car = homeOpportunities[2];

/** The registered geometry of drive-oxblood-wagon-placement (normalized to the 3:2 frame). */
export const WAGON = {
  door: [[0.2266, 0.4258], [0.3717, 0.4238], [0.3717, 0.622], [0.2474, 0.6245], [0.2383, 0.5859], [0.2292, 0.5254]] as [number, number][],
  handle: { t: 0.442, r: 1 - 0.27, b: 1 - 0.49, l: 0.226 },
  specimen: { x: 0.256, y: 0.498, w: 0.11, h: 0.118 },
  leader: { from: [0.3717, 0.53] as [number, number], to: [0.46, 0.47] as [number, number] },
  doorCenter: [0.3, 0.53] as [number, number],
};

/** Beats sit where their movement is complete, so a direct step lands on a settled state. */
export const DRIVE_BEATS: Beat[] = [
  { key: "enters", label: "Vehicle example", at: 0.08, dwell: 1000 },
  { key: "camera", label: "Placement preview", at: 0.32, dwell: 1000 },
  { key: "zones", label: "Rear doors", at: 0.45, dwell: 1000 },
  { key: "creative", label: "Spurroom Bikes", at: 0.65, dwell: 1200 },
  { key: "campaign", label: "Campaign", at: 0.76, dwell: 1300 },
  { key: "earning", label: "Monthly opportunity", at: 0.94, dwell: 1800 },
];

/** Aperture and photograph sizes (mirrored in film.css). */
function dims(vp: Viewport) {
  // desktop: the 1056px photograph in a 1056x600 reviewed aperture (the 3:2 plane overflows 52px top and bottom) so title and controls stay on the stage
  if (vp.desktop) return { ap: { w: 1056, h: 600 }, photo: { w: 1056, h: 704 }, zoom: 1.08, sheetW: 304 };
  if (vp.tablet) return { ap: { w: 720, h: 460 }, photo: { w: 720, h: 480 }, zoom: 1.12, sheetW: 304 };
  return { ap: { w: vp.w, h: 330 }, photo: { w: vp.w, h: Math.round(vp.w * 2 / 3) }, zoom: 1.22, sheetW: Math.min(358, vp.w - 32) };
}

/** The crop shift keeps the rear door near the inspection datum: the plane scales about its center and drifts so the door stays put. */
function shift0(d: ReturnType<typeof dims>) {
  const doorDx = (WAGON.doorCenter[0] - 0.5) * d.photo.w; const doorDy = (WAGON.doorCenter[1] - 0.5) * d.photo.h;
  return { x: Math.max(-40, Math.min(40, -doorDx * (d.zoom - 1))), y: Math.max(-28, Math.min(28, -doorDy * (d.zoom - 1))) };
}

function build(vp: Viewport): Tracks {
  const d = dims(vp);
  // the aperture sits at the stage's left datum on desktop (80px inset), full width on phone
  const apPos = vp.desktop ? { x: 80 + d.ap.w / 2 - vp.w / 2, y: -vp.stageH / 2 + 72 + d.ap.h / 2 } : vp.tablet ? { x: 24 + d.ap.w / 2 - vp.w / 2, y: -vp.stageH / 2 + 72 + d.ap.h / 2 } : { x: 0, y: -vp.stageH / 2 + 56 + d.ap.h / 2 };
  // the crop shift keeps the rear door near the inspection datum: the plane scales about its center and drifts so the door stays put
  const shift = shift0(d);
  // the campaign sheet: attached to the photograph's right margin on desktop; below the aperture on phone, with only the narrow lip overlapping
  const sheetH = vp.desktop ? 300 : 286;
  const sheet = vp.desktop
    ? { x: apPos.x + d.ap.w / 2 - 152 + 96, y: apPos.y + 40 }
    : vp.tablet ? { x: apPos.x + d.ap.w / 2 - 100, y: apPos.y + d.ap.h / 2 - 40 } : { x: 0, y: apPos.y + d.ap.h / 2 + sheetH / 2 - 32 };
  // the sheet is pre sized with its lower plane; the campaign beat shows the upper part only, the earning beat uncovers the rest
  const lower = vp.desktop ? 42 : 44;
  const letter = ((d.ap.h - d.photo.h) / 2 / d.ap.h) * 100;
  return {
    plane: [
      { at: 0, pose: { x: 48, y: 0, s: 1, o: 1 } },
      { at: 0.08, pose: { x: 0, y: 0, s: 1, o: 1 }, ease: openEase },
      { at: 0.16, pose: { x: 0, y: 0, s: 1 } },
      { at: 0.32, pose: { ...shift, s: d.zoom }, ease: openEase },
    ],
    zone: [{ at: 0.32, pose: { o: 0, ci: [0, 100, 0, 0] } }, { at: 0.4, pose: { o: 1, ci: [0, 0, 0, 0] }, ease: openEase }],
    zoneLabel: [{ at: 0.4, pose: { o: 0, y: 8 } }, { at: 0.45, pose: { o: 1, y: 0 } }],
    free: [
      { at: 0.48, pose: { x: 0, y: 0, o: 0 } },
      { at: 0.5, pose: { x: 0, y: 0, o: 1 } },
      { at: 0.61, pose: { x: 1, y: 1, o: 1 }, ease: openEase },
      { at: 0.63, pose: { x: 1, y: 1, o: 0 } },
    ],
    planar: [{ at: 0.61, pose: { o: 0 } }, { at: 0.65, pose: { o: 1 } }],
    // the sheet opens from the selected zone's label datum and settles attached; its pre sized lower plane is uncovered at the end
    // the sheet is full size opaque paper at its datum, revealed from its own left edge (the zone leader's side) with at most 48px of travel
    sheet: [{ at: 0.65, pose: { ...sheet, x: sheet.x + 48, o: 0, ci: [0, 0, lower, 100] } }, { at: 0.66, pose: { ...sheet, x: sheet.x + 48, o: 1, ci: [0, 0, lower, 100] } }, { at: 0.76, pose: { ...sheet, o: 1, ci: [0, 0, lower, 0] }, ease: damped }, { at: 0.83, pose: { ...sheet, o: 1, ci: [0, 0, lower, 0] } }, { at: 0.9, pose: { ...sheet, o: 1, ci: [0, 0, 0, 0] }, ease: damped }],
    occlusion: [{ at: 0.61, pose: { o: 0 } }, { at: 0.63, pose: { o: 1 } }],
    preview: [{ at: 0.16, pose: { o: 0, y: 8 } }, { at: 0.2, pose: { o: 1, y: 0 } }],
    moneyValue: [{ at: 0.9, pose: { o: 0 } }, { at: 0.94, pose: { o: 1 } }],
    // phone: the whole 390x260 photograph first, then the fixed 330 inspection aperture opens around the closer crop
    aperture: vp.phone ? [{ at: 0, pose: { ...apPos, ci: [letter, 0, letter, 0] } }, { at: 0.16, pose: { ...apPos, ci: [letter, 0, letter, 0] } }, { at: 0.32, pose: { ...apPos, ci: [0, 0, 0, 0] }, ease: openEase }] : [{ at: 0, pose: { ...apPos } }],
  };
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function Stage({ staticAt }: { staticAt: number | null }) {
  const stage = useRef<HTMLDivElement>(null);
  const film = useFilm(DRIVE_BEATS, build, stage, { staticAt });
  const beat = staticAt === null ? film.beat : DRIVE_BEATS.reduce((acc, b, i) => (staticAt >= b.at - 0.015 ? i : acc), 0);
  const view = "/design-lab-v3/home?open=lab-car-spurroom-rear-doors";
  const poly = WAGON.door.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ");
  const specimen = (planar: boolean) => (
    <span className={`x-dr-specimen${planar ? " is-planar" : ""}`} aria-hidden={planar ? undefined : true}>
      <span className="x-dr-specimen-name">{car.business.split(" ").map((w) => <span key={w}>{w}</span>)}</span>
    </span>
  );
  return (
    <div className="x-scene-stage x-drive-stage" ref={stage} data-beat={beat}>
      <div className="x-field">
        {/* the aperture: fixed; everything photographic moves inside it under one transform */}
        <div className="x-obj x-dr-aperture" data-film="aperture">
          <div className="x-dr-plane" data-film="plane">
            <img src={M.driveWagon(960)} srcSet={`${M.driveWagon(960)} 960w, ${M.driveWagon(1440)} 1440w`} sizes="(min-width: 1024px) 960px, 100vw" alt="Vehicle example: an oxblood estate wagon parked in a limestone courtyard, illustrative photograph" width={1440} height={960} decoding="async" loading="lazy" />
            {/* the registered rear door zone: 1px light boundary, 8% neutral fill, one leader; revealed through a shutter */}
            <svg className="x-dr-zone" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden data-film="zone" data-inplace>
              <polygon points={WAGON.door.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.92)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1={WAGON.leader.from[0] * 1000} y1={WAGON.leader.from[1] * 1000} x2={WAGON.leader.to[0] * 1000} y2={WAGON.leader.to[1] * 1000} stroke="rgba(255,255,255,0.92)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="x-dr-zonelabel" data-film="zoneLabel" data-inplace style={{ left: pct(WAGON.leader.to[0]), top: pct(WAGON.leader.to[1]) }}><span className="x-tag">Rear doors</span></span>
            {/* the planar counterpart: the same specimen registered to the door plane, clipped to the zone, the photographed handle kept in front */}
            <span className="x-dr-planar" data-film="planar" data-inplace style={{ clipPath: `polygon(${poly})` }}>
              <span className="x-dr-planar-place" style={{ left: pct(WAGON.specimen.x), top: pct(WAGON.specimen.y), width: pct(WAGON.specimen.w), height: pct(WAGON.specimen.h) }}>{specimen(true)}</span>
            </span>
            <span className="x-dr-occlusion" data-film="occlusion" data-opacity-only aria-hidden style={{ clipPath: `inset(${pct(WAGON.handle.t)} ${pct(WAGON.handle.r)} ${pct(WAGON.handle.b)} ${pct(WAGON.handle.l)})` }}><img src={M.driveWagon(960)} srcSet={`${M.driveWagon(960)} 960w, ${M.driveWagon(1440)} 1440w`} sizes="(min-width: 1024px) 960px, 100vw" alt="" width={1440} height={960} decoding="async" loading="lazy" /></span>
            {/* the free specimen: beside the car, moving to the door; x and y poses are fractions of its travel */}
            <span className="x-dr-free" data-film="free" data-travel style={{ ["--x0" as string]: pct(0.62), ["--y0" as string]: pct(0.5), ["--x1" as string]: pct(WAGON.specimen.x), ["--y1" as string]: pct(WAGON.specimen.y), width: pct(WAGON.specimen.w), height: pct(WAGON.specimen.h) }}>{specimen(false)}</span>
          </div>
          <span className="x-tag x-dr-example">Vehicle example</span>
          {/* the inspection lip: the one narrow lens on this stage; the photograph passes beneath it during the crop shift */}
          <span className="x-inspect x-dr-preview" data-film="preview" data-inplace><span className="x-inspect-text">Placement preview</span></span>
        </div>
        <div className="x-obj x-paper x-dr-sheet" data-film="sheet">
          <span className="t-fact">Campaign</span>
          <span className="t-object">{car.business}</span>
          <span className="t-fact-ink">{car.facts[0]}<span aria-hidden> · </span>{car.extra?.[0].value}</span>
          <span className="t-fact">{car.requirements[0]}<span aria-hidden> · </span>Placement preview</span>
          <Link href={view} className="link t-action x-dr-view">View campaign</Link>
          <span className="x-dr-money">
            <span className="x-dr-money-value" data-film="moneyValue" data-opacity-only><span className="x-money-end">{money(car.netCents)}</span><span className="t-fact-ink">/month</span></span>
            <span className="t-object">Monthly approval</span>
            <span className="t-fact">{car.requirements[4]}</span>
          </span>
        </div>
      </div>
      <div className="x-stage-head"><h2 className="x-film-title" id="drive-h">Drive</h2></div>
      <div className="x-stage-foot">
        {staticAt === null ? <FilmControls film={film} beats={DRIVE_BEATS} playLabel="Play"><Link href={view} className="link t-action x-open-preview">View campaign</Link></FilmControls> : <span className="x-frame-label">{beat + 1} of {DRIVE_BEATS.length}<span aria-hidden> · </span>{DRIVE_BEATS[beat].label}</span>}
      </div>
    </div>
  );
}

export function DriveFilm() {
  return <Scene id="drive" label="Drive" beats={DRIVE_BEATS} track={2} phoneHeight={480} className="x-drive" render={(staticAt) => <Stage staticAt={staticAt} />} />;
}
