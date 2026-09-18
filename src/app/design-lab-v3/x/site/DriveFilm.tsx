"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { homeOpportunities, money } from "../../../design-lab-v2/fixtures";
import { LateImg } from "../LateImg";
import { M } from "../media";
import { FilmControls, Scene, damped, openEase, useFilm, type Beat, type Tracks, type Viewport } from "../Film";

/**
 * The Drive scene (RECOMPOSE_DIRECTION.md, drive): one photographed
 * vehicle example (the director's approved oxblood wagon, an illustrative
 * lab asset, not Eli's listing) inside a fixed aperture. The photograph
 * enters, the crop shifts closer without changing perspective, the
 * registered rear door zone reveals through a shutter, a coded Spurroom
 * Bikes placement specimen attaches to that door as a decal registered
 * to the door plane by a projective transform and lit by the
 * photograph's own paint (the door's shading and reflections multiply
 * onto the decal), the camera pulls back to show the whole placement,
 * the campaign sheet opens beside the aperture tied to the zone's row, and
 * the conditional monthly amount extends it. The zone polygon and the
 * decal quad are stored against this exact asset in normalized image
 * coordinates and live under the photograph's own transform, so no crop
 * shift can make the overlay swim. Nothing here is an installation,
 * proof or an accepted offer: US$300 /month is the campaign opportunity,
 * approved monthly.
 */
const car = homeOpportunities[2];

/** The registered geometry of drive-oxblood-wagon-placement (normalized to the 3:2 frame). */
export const WAGON = {
  door: [[0.2266, 0.4258], [0.3717, 0.4238], [0.3717, 0.622], [0.2474, 0.6245], [0.2383, 0.5859], [0.2292, 0.5254]] as [number, number][],
  /** The decal quad on the door panel beneath the photographed handle (top left, top right, bottom right, bottom left), following the panel's slant and the wheel arch cut. */
  decal: [[0.262, 0.5], [0.362, 0.497], [0.362, 0.611], [0.2665, 0.6135]] as [number, number][],
  specimen: { x: 0.262, y: 0.497, w: 0.1, h: 0.116 },
  leader: { from: [0.3717, 0.53] as [number, number], to: [0.46, 0.47] as [number, number] },
  doorCenter: [0.3, 0.53] as [number, number],
};

/** Beats sit where their movement is complete, so a direct step lands on a settled state. */
export const DRIVE_BEATS: Beat[] = [
  { key: "enters", label: "Vehicle example", at: 0.08, dwell: 1000 },
  { key: "camera", label: "Placement preview", at: 0.32, dwell: 1000 },
  { key: "zones", label: "Rear doors", at: 0.45, dwell: 1000 },
  { key: "creative", label: "Spurroom Bikes", at: 0.65, dwell: 1200 },
  { key: "campaign", label: "Campaign", at: 0.83, dwell: 1300 },
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
  const letter = ((d.ap.h - d.photo.h) / 2 / d.ap.h) * 100;
  // the pull back: once the creative is attached the camera withdraws so the whole placement is in view; on desktop the aperture narrows from the right and the sheet takes the freed column
  const back = vp.desktop ? { x: -160, y: 0, s: 0.92 } : vp.tablet ? { ...shift, s: d.zoom } : { x: 0, y: 0, s: 1 };
  const apEnd = vp.desktop ? { ...apPos, ci: [0, 22, 0, 0] as [number, number, number, number] } : vp.phone ? { ...apPos, ci: [letter, 0, letter, 0] as [number, number, number, number] } : { ...apPos };
  // the campaign sheet: in the freed column beside the aperture on desktop, tied to the zone's row; below the aperture on phone, overlapping the photograph's lower edge by a narrow lip
  const sheetH = vp.desktop ? 300 : 286;
  const letterPx = (d.ap.h - d.photo.h) / 2;
  // the zone label's row after the pull back (the plane scales about its center): the sheet's Rear doors row and the tie sit on it
  const labelY = apPos.y + back.y - (d.photo.h * back.s) / 2 + WAGON.leader.to[1] * d.photo.h * back.s;
  const sheet = vp.desktop
    ? { x: 1000 + d.sheetW / 2 - vp.w / 2, y: labelY - 82 + sheetH / 2 }
    : vp.tablet ? { x: apPos.x + d.ap.w / 2 - 100, y: apPos.y + d.ap.h / 2 - 40 } : { x: 0, y: apPos.y + d.ap.h / 2 - letterPx + 8 + sheetH / 2 };
  // the sheet is pre sized with its lower plane; the campaign beat shows the upper part only, the earning beat uncovers the rest
  const lower = vp.desktop ? 42 : 44;
  // the tie: from the aperture's visible right edge to the sheet's left edge, on the zone label's row
  const tie = vp.desktop ? { x: (80 + d.ap.w * 0.78 + 1000) / 2 - vp.w / 2, y: labelY } : null;
  // the aperture's own labels step clear of the clipped bands at the pull back: the lens to the visible right edge on desktop, both down past the letterbox on phone
  const lensBack = vp.desktop ? { x: -d.ap.w * 0.22, y: 0 } : vp.phone ? { x: 0, y: letterPx } : { x: 0, y: 0 };
  return {
    plane: [
      { at: 0, pose: { x: 48, y: 0, s: 1, o: 1 } },
      { at: 0.08, pose: { x: 0, y: 0, s: 1, o: 1 }, ease: openEase },
      { at: 0.16, pose: { x: 0, y: 0, s: 1 } },
      { at: 0.32, pose: { ...shift, s: d.zoom }, ease: openEase },
      { at: 0.66, pose: { ...shift, s: d.zoom } },
      { at: 0.76, pose: { ...back }, ease: openEase },
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
    aperture: vp.phone
      ? [{ at: 0, pose: { ...apPos, ci: [letter, 0, letter, 0] } }, { at: 0.16, pose: { ...apPos, ci: [letter, 0, letter, 0] } }, { at: 0.32, pose: { ...apPos, ci: [0, 0, 0, 0] }, ease: openEase }, { at: 0.66, pose: { ...apPos, ci: [0, 0, 0, 0] } }, { at: 0.76, pose: apEnd, ease: openEase }]
      : [{ at: 0, pose: { ...apPos } }, { at: 0.66, pose: { ...apPos } }, { at: 0.76, pose: apEnd, ease: openEase }],
    // the sheet is full size opaque paper at its datum, revealed from its own left edge (the tie's side) with at most 48px of travel
    sheet: [{ at: 0.75, pose: { ...sheet, x: sheet.x + 48, o: 0, ci: [0, 0, lower, 100] } }, { at: 0.76, pose: { ...sheet, x: sheet.x + 48, o: 1, ci: [0, 0, lower, 100] } }, { at: 0.83, pose: { ...sheet, o: 1, ci: [0, 0, lower, 0] }, ease: damped }, { at: 0.86, pose: { ...sheet, o: 1, ci: [0, 0, lower, 0] } }, { at: 0.91, pose: { ...sheet, o: 1, ci: [0, 0, 0, 0] }, ease: damped }],
    tie: tie ? [{ at: 0.76, pose: { ...tie, o: 0, ci: [0, 100, 0, 0] } }, { at: 0.77, pose: { ...tie, o: 1, ci: [0, 100, 0, 0] } }, { at: 0.83, pose: { ...tie, o: 1, ci: [0, 0, 0, 0] }, ease: openEase }] : [{ at: 0, pose: { o: 0 } }],
    preview: [{ at: 0.16, pose: { o: 0, y: 8 } }, { at: 0.2, pose: { o: 1, y: 0 } }, { at: 0.66, pose: { o: 1, x: 0, y: 0 } }, { at: 0.76, pose: { o: 1, ...lensBack }, ease: openEase }],
    example: vp.phone ? [{ at: 0, pose: { y: letterPx } }, { at: 0.16, pose: { y: letterPx } }, { at: 0.32, pose: { y: 0 }, ease: openEase }, { at: 0.66, pose: { y: 0 } }, { at: 0.76, pose: { y: letterPx }, ease: openEase }] : [{ at: 0, pose: { y: 0 } }],
    moneyValue: [{ at: 0.9, pose: { o: 0 } }, { at: 0.94, pose: { o: 1 } }],
  };
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/* Projective mapping of a w by h box (origin top left) onto a quadrilateral, as a CSS matrix3d. Coded perspective on the real photograph, never a fake 3D vehicle. */
function adj(m: number[]) {
  return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
}
function mul(a: number[], b: number[]) {
  const c = new Array<number>(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) c[3 * i + j] += a[3 * i + k] * b[3 * k + j];
  return c;
}
function basis(p: number[][]) {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
  const a = adj(m); const v = [a[0] * p[3][0] + a[1] * p[3][1] + a[2], a[3] * p[3][0] + a[4] * p[3][1] + a[5], a[6] * p[3][0] + a[7] * p[3][1] + a[8]];
  return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
export function quadMatrix(w: number, h: number, quad: number[][]): string {
  const t = mul(basis(quad), adj(basis([[0, 0], [w, 0], [w, h], [0, h]])));
  const n = t.map((x) => x / t[8]);
  return `matrix3d(${[n[0], n[3], 0, n[6], n[1], n[4], 0, n[7], 0, 0, 1, 0, n[2], n[5], 0, n[8]].map((x) => x.toFixed(6)).join(", ")})`;
}

function Stage({ staticAt }: { staticAt: number | null }) {
  const stage = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const film = useFilm(DRIVE_BEATS, build, stage, { staticAt });
  const beat = staticAt === null ? film.beat : DRIVE_BEATS.reduce((acc, b, i) => (staticAt >= b.at - 0.015 ? i : acc), 0);
  const view = "/design-lab-v3/home?open=lab-car-spurroom-rear-doors";
  const poly = WAGON.door.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ");
  // the lighting layers cover only the decal's bounding box (filters and blends are paid per pixel of the layer, not of the clip), with the photograph offset inside so the same door pixels line up
  const bx = Math.min(...WAGON.decal.map((q) => q[0])), by = Math.min(...WAGON.decal.map((q) => q[1]));
  const bw = Math.max(...WAGON.decal.map((q) => q[0])) - bx, bh = Math.max(...WAGON.decal.map((q) => q[1])) - by;
  const lightBox = { left: pct(bx), top: pct(by), width: pct(bw), height: pct(bh), clipPath: `polygon(${WAGON.decal.map(([x, y]) => `${pct((x - bx) / bw)} ${pct((y - by) / bh)}`).join(", ")})` };
  const lightImg = { width: pct(1 / bw), height: pct(1 / bh), left: pct(-bx / bw), top: pct(-by / bh) };
  // the decal's projective transform needs the photograph's pixel size: measured, and again on resize
  const [size, setSize] = useState<[number, number] | null>(null);
  useEffect(() => {
    const el = plane.current; if (!el) return;
    // ResizeObserver reports the current size on observe, then every change
    const ro = new ResizeObserver(() => setSize([el.offsetWidth, el.offsetHeight])); ro.observe(el); return () => ro.disconnect();
  }, []);
  const decal = size ? quadMatrix(size[0] * WAGON.specimen.w, size[1] * WAGON.specimen.h, WAGON.decal.map(([x, y]) => [x * size[0], y * size[1]])) : undefined;
  const specimen = (planar: boolean) => (
    <span className={`x-dr-specimen${planar ? " is-planar" : ""}`} aria-hidden={planar ? undefined : true}>
      <span className="x-dr-specimen-name">{car.business.split(" ").map((w) => <span key={w}>{w}</span>)}</span>
    </span>
  );
  const photo = (extra: string, alt: string, style?: CSSProperties) => <LateImg className={extra} src={M.driveWagon(960)} srcSet={`${M.driveWagon(960)} 960w, ${M.driveWagon(1440)} 1440w`} sizes="(min-width: 1024px) 960px, 100vw" alt={alt} width={1440} height={960} margin={900} style={style} />;
  return (
    <div className="x-scene-stage x-drive-stage" ref={stage} data-beat={beat}>
      <div className="x-field">
        {/* the aperture: fixed; everything photographic moves inside it under one transform */}
        <div className="x-obj x-dr-aperture" data-film="aperture">
          <div className="x-dr-plane" data-film="plane" ref={plane}>
            {photo("x-dr-photo", "Vehicle example: an oxblood estate wagon parked in a limestone courtyard, illustrative photograph")}
            {/* the registered rear door zone: 1px light boundary, 8% neutral fill, one leader; revealed through a shutter */}
            <svg className="x-dr-zone" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden data-film="zone" data-inplace>
              <polygon points={WAGON.door.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.92)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1={WAGON.leader.from[0] * 1000} y1={WAGON.leader.from[1] * 1000} x2={WAGON.leader.to[0] * 1000} y2={WAGON.leader.to[1] * 1000} stroke="rgba(255,255,255,0.92)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="x-dr-zonelabel" data-film="zoneLabel" data-inplace style={{ left: pct(WAGON.leader.to[0]), top: pct(WAGON.leader.to[1]) }}><span className="x-tag">Rear doors</span></span>
            {/* the planar counterpart: the same specimen as a decal registered to the door plane, clipped to the zone, lit by the photographed paint */}
            <span className="x-dr-planar" data-film="planar" data-inplace style={{ clipPath: `polygon(${poly})` }}>
              <span className="x-dr-decal" style={{ width: pct(WAGON.specimen.w), height: pct(WAGON.specimen.h), transform: decal }}>{specimen(true)}</span>
              <span className="x-dr-light" aria-hidden style={lightBox}>{photo("", "", lightImg)}</span>
              <span className="x-dr-gloss" aria-hidden style={lightBox}>{photo("", "", lightImg)}</span>
            </span>
            {/* the free specimen: beside the car, moving to the door; x and y poses are fractions of its travel */}
            <span className="x-dr-free" data-film="free" data-travel style={{ ["--x0" as string]: pct(0.62), ["--y0" as string]: pct(0.5), ["--x1" as string]: pct(WAGON.specimen.x), ["--y1" as string]: pct(WAGON.specimen.y), width: pct(WAGON.specimen.w), height: pct(WAGON.specimen.h) }}>{specimen(false)}</span>
          </div>
          <span className="x-tag x-dr-example" data-film="example" data-inplace>Vehicle example</span>
          {/* the inspection lip: the one narrow lens on this stage; the photograph passes beneath it during the crop shift */}
          <span className="x-inspect x-dr-preview" data-film="preview" data-inplace><span className="x-inspect-text">Placement preview</span></span>
        </div>
        <span className="x-obj x-dr-tie" data-film="tie" aria-hidden />
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
  return <Scene id="drive" label="Drive" beats={DRIVE_BEATS} track={2} phoneHeight={528} className="x-drive" render={(staticAt) => <Stage staticAt={staticAt} />} />;
}
