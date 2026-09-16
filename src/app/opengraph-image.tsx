import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/config/site";

export const alt = `${SITE_NAME}: Recreate. Post. Drive. Get paid.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The default share card, on the Frame Shift canvas: the offset-frame mark
 * in cobalt, the wordmark, the four-word product line and the one message.
 * Same identity as the product; no photography, no numbers.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F4F3EF", color: "#151B23", padding: "64px 72px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width={44} height={44} viewBox="0 0 32 32" fill="#2450E8"><path d="M3 3H19V9H9V23H3Z" /><path d="M13 23H23V9H29V29H13Z" /></svg>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>Recreate. Post.</div>
          <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>Drive. Get paid.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, color: "#526171" }}>Local marketing. Real people.</div>
          <div style={{ width: 160, height: 10, background: "#2450E8" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
