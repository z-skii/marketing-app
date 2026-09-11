import { ASSET } from "../mock";

/**
 * A capture host for the finished Story creative: the generated
 * photographic base at 1080x1920 with its one line of copy set in Archivo
 * 700 at 76/84px in #F1D87A, exactly as the director specified. Captured
 * once by the lab tooling into public/design-lab/story-loopday-01.jpg;
 * the image model never rendered this text.
 */
export default function StoryMaster() {
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden", background: "#101820" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ASSET("story-loopday-01-base")} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <p className="t-display" style={{ position: "absolute", left: 72, top: 300, width: 936, margin: 0, textAlign: "center", fontWeight: 700, fontSize: 76, lineHeight: "84px", letterSpacing: "-0.03em", color: "#F1D87A" }}>Take a coffee break.</p>
    </div>
  );
}
