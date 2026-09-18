"use client";

import dynamic from "next/dynamic";
import { Near } from "../Near";
import { useMotion } from "../motion";
import { DRIVE_BEATS } from "./drive-beats";
import { LOOP_BEATS } from "./loop-beats";

/**
 * The public homepage's two pinned scenes below the hero as islands: the
 * Drive scene and the Business to Loyalty scene are not part of the first
 * load. Each ships as its own chunk that is requested when its stage
 * comes within 1200px of the viewport; until then the server rendered
 * fallback holds the stage's exact height on the inspection substrate
 * with the scene's title, so nothing visible moves and the navigation
 * anchors (#drive, #loyalty) exist from the first byte. With reduced
 * motion the fallback lists the beats in flow as the scene itself would.
 */
const DriveFilm = dynamic(() => import("./DriveFilm").then((m) => m.DriveFilm), { ssr: false, loading: () => <SceneShell id="drive" title="Drive" className="x-drive" track={2} phoneHeight={528} beats={DRIVE_BEATS} /> });
const LoopFilm = dynamic(() => import("./LoopFilm").then((m) => m.LoopFilm), { ssr: false, loading: () => <SceneShell id="loyalty" title="Loyalty" className="x-loop" track={2.4} phoneHeight={990} beats={LOOP_BEATS} /> });

/** The empty stage of a scene: the same section, height and substrate the scene will occupy, with its title. */
function SceneShell({ id, title, className, track, phoneHeight, beats }: { id: string; title: string; className: string; track: number; phoneHeight: number; beats: readonly { key: string; label: string }[] }) {
  const { reduced } = useMotion();
  if (reduced) {
    return (
      <section id={id} className={`x-scene x-scene-static ${className}`} aria-label={title}>
        {beats.map((b, i) => <div key={b.key} className="x-scene-static-beat"><div className={`x-scene-stage ${className}-stage`}><div className="x-stage-head">{i === 0 && <h2 className="x-film-title">{title}</h2>}</div><div className="x-stage-foot"><span className="x-frame-label">{i + 1} of {beats.length}<span aria-hidden> · </span>{b.label}</span></div></div></div>)}
      </section>
    );
  }
  return (
    <section id={id} className={`x-scene ${className}`} aria-label={title} style={{ ["--track" as string]: track, ["--phone-h" as string]: `${phoneHeight}px` }}>
      <div className={`x-scene-stage ${className}-stage`} data-beat={0}><div className="x-stage-head"><h2 className="x-film-title">{title}</h2></div></div>
    </section>
  );
}

export function DriveIsland() {
  return <Near fallback={<SceneShell id="drive" title="Drive" className="x-drive" track={2} phoneHeight={528} beats={DRIVE_BEATS} />}><DriveFilm /></Near>;
}
export function LoopIsland() {
  return <Near fallback={<SceneShell id="loyalty" title="Loyalty" className="x-loop" track={2.4} phoneHeight={990} beats={LOOP_BEATS} />}><LoopFilm /></Near>;
}
