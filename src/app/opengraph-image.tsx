import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The default share card: the wordmark on the dark broadcast canvas with the
 * live dot and the tagline. Same identity as the interface — paper on near
 * black with one signal accent, no marketing imagery.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          color: "#f2f0ea",
          padding: "64px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 18, height: 18, background: "#ff3b18", borderRadius: 999 }} />
          <div style={{ fontSize: 30, letterSpacing: 6, color: "#ff3b18" }}>LIVE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -6 }}>
            {SITE_NAME.toUpperCase()}
          </div>
          <div style={{ fontSize: 42, color: "#b9b6ac", marginTop: 10 }}>{SITE_TAGLINE}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 220, height: 8, background: "#f2f0ea" }} />
          <div style={{ width: 140, height: 8, background: "#f2f0ea", opacity: 0.55 }} />
          <div style={{ width: 80, height: 8, background: "#ff3b18" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
