import "server-only";
import { ImageResponse } from "next/og";
import { COLORS, SITE } from "./brand-kit";
import { ARCHIVO_800, ARCHIVO_900, PLEXMONO_500, PLEXMONO_600 } from "../assets/fonts-data";

/**
 * Server-side ad rendering. Three templates in the house style — ink, paper,
 * signal — at story (1080x1920) and feed (1080x1350) sizes, drawn with the
 * vendored brand fonts so a rendered ad is pixel-true to the site.
 */

export type AdTemplate = "ink" | "paper" | "signal" | "phone" | "browser";
export type AdFormat = "story" | "feed" | "square";

export type AdParams = {
  template: AdTemplate;
  format: AdFormat;
  eyebrow: string;
  headline: string;
  sub?: string;
  cta: string;
};

export const AD_SIZES: Record<AdFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

// Fonts ship embedded (src/assets/fonts-data.ts): every bundle — route
// handlers, server actions, crons — renders identically with zero
// filesystem access.
let fonts: { name: string; weight: 800 | 900 | 500 | 600; data: ArrayBuffer }[] | null = null;

function loadFonts() {
  fonts ??= (
    [
      ["Archivo", 800, ARCHIVO_800],
      ["Archivo", 900, ARCHIVO_900],
      ["IBM Plex Mono", 500, PLEXMONO_500],
      ["IBM Plex Mono", 600, PLEXMONO_600],
    ] as const
  ).map(([name, weight, b64]) => {
    const buf = Buffer.from(b64, "base64");
    return { name, weight, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  });
  return fonts;
}

/** Palette per template: ground, ink-on-ground, the accent, muted text. */
const PALETTES: Record<AdTemplate, { bg: string; fg: string; accent: string; muted: string }> = {
  ink: { bg: COLORS.ink, fg: COLORS.paper, accent: COLORS.signal, muted: COLORS.paperFaint },
  paper: { bg: COLORS.paper, fg: COLORS.ink, accent: COLORS.signal, muted: COLORS.inkFaint },
  signal: { bg: COLORS.signal, fg: COLORS.paper, accent: COLORS.ink, muted: "#ffd9d0" },
  phone: { bg: COLORS.ink, fg: COLORS.paper, accent: COLORS.signal, muted: COLORS.paperFaint },
  browser: { bg: COLORS.paper, fg: COLORS.ink, accent: COLORS.signal, muted: COLORS.inkFaint },
};

/**
 * Real screenshots of the live site, served from public/marketing/ and
 * cached as data URLs. The base URL is the deployment's own origin. When a
 * fetch fails the screenshot templates degrade to the text layout rather
 * than failing a whole generation run.
 */
const SHOT_FILES = { phone: "shot-phone.png", desktop: "shot-desktop.png" } as const;
const shotCache: Partial<Record<keyof typeof SHOT_FILES, string>> = {};

function baseUrl(): string {
  // SITE_BASE_URL is read at runtime (NEXT_PUBLIC_* would be inlined at
  // build time); on Vercel the deployment's own URL is always present.
  const configured = process.env.SITE_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function siteShot(kind: keyof typeof SHOT_FILES): Promise<string | null> {
  if (shotCache[kind]) return shotCache[kind]!;
  try {
    const response = await fetch(`${baseUrl()}/marketing/${SHOT_FILES[kind]}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const b64 = Buffer.from(await response.arrayBuffer()).toString("base64");
    shotCache[kind] = `data:image/png;base64,${b64}`;
    return shotCache[kind]!;
  } catch (error) {
    console.error(`site screenshot ${kind}:`, error);
    return null;
  }
}

function headlineSize(text: string, format: AdFormat): number {
  const scale = format === "story" ? 1 : format === "feed" ? 0.88 : 0.8;
  if (text.length <= 18) return Math.round(150 * scale);
  if (text.length <= 40) return Math.round(116 * scale);
  if (text.length <= 70) return Math.round(92 * scale);
  return Math.round(72 * scale);
}

function textAd(params: AdParams) {
  const { width } = AD_SIZES[params.format];
  const p = PALETTES[params.template];
  const pad = 88;

  return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: p.bg,
          color: p.fg,
          padding: pad,
          fontFamily: "Archivo",
        }}
      >
        {/* Masthead: live dot + brand, like the site header. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: params.template === "signal" ? p.fg : p.accent,
              }}
            />
            <div
              style={{
                fontFamily: "IBM Plex Mono",
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: 8,
                color: params.template === "signal" ? p.fg : p.accent,
              }}
            >
              LIVE
            </div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>{SITE.display}</div>
        </div>

        {/* Center block: eyebrow, headline, sub. */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: 10,
              color: p.muted,
              textTransform: "uppercase",
            }}
          >
            {params.eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: headlineSize(params.headline, params.format),
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.98,
              marginTop: 28,
              textTransform: "uppercase",
            }}
          >
            {params.headline}
          </div>
          {params.sub ? (
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.25,
                marginTop: 44,
                maxWidth: width - pad * 2 - 60,
                color: params.template === "paper" ? "#4a4842" : p.muted,
              }}
            >
              {params.sub}
            </div>
          ) : null}
        </div>

        {/* CTA block + URL footer. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                backgroundColor: params.template === "signal" ? COLORS.ink : p.accent,
                color: COLORS.paper,
                fontFamily: "IBM Plex Mono",
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: 5,
                padding: "30px 54px",
                textTransform: "uppercase",
              }}
            >
              {params.cta.toUpperCase()}
              {/* The site's outbound arrow, drawn so no font can drop it. */}
              <svg width="34" height="34" viewBox="0 0 12 12" fill="none">
                <path d="M3.2 8.8 8.8 3.2M4.4 3.2h4.4v4.4" stroke={COLORS.paper} strokeWidth="1.4" />
              </svg>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `3px solid ${params.template === "signal" ? p.fg : p.accent}`,
              marginTop: 56,
              paddingTop: 40,
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 900 }}>{SITE.url}</div>
            <div
              style={{
                fontFamily: "IBM Plex Mono",
                fontSize: 28,
                fontWeight: 500,
                color: p.muted,
              }}
            >
              {SITE.tagline}
            </div>
          </div>
        </div>
      </div>
  );
}

/**
 * Screenshot templates: the real site inside a device. "phone" sets the
 * mobile screenshot in a tilted phone shell peeking past the bottom edge;
 * "browser" sets the desktop screenshot in a browser window. Both keep the
 * masthead, a hard-hitting headline, and the CTA block.
 */
function screenshotAd(params: AdParams, shot: string) {
  const { width, height } = AD_SIZES[params.format];
  const p = PALETTES[params.template];
  const pad = 72;
  const isPhone = params.template === "phone";

  // Device box geometry: phone is w:h 1:2, desktop shot is 16:10.
  const deviceW = isPhone ? Math.round(width * 0.6) : width - pad * 2;
  const deviceH = isPhone ? deviceW * 2 : Math.round((deviceW - 24) * 900 / 1440) + 76;
  const textZone = params.format === "story" ? 0.42 : 0.46;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: p.bg,
        color: p.fg,
        fontFamily: "Archivo",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Text zone */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: `${pad}px ${pad}px 0`,
          height: Math.round(height * textZone),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: p.accent }} />
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 30, fontWeight: 600, letterSpacing: 7, color: p.accent }}>
              LIVE
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>{SITE.display}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 30, fontWeight: 600, letterSpacing: 9, color: p.muted, textTransform: "uppercase" }}>
            {params.eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: Math.round(headlineSize(params.headline, params.format) * 0.82),
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.98,
              marginTop: 22,
              textTransform: "uppercase",
            }}
          >
            {params.headline}
          </div>
        </div>
        <div style={{ display: "flex", marginBottom: 34 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              backgroundColor: p.accent,
              color: COLORS.paper,
              fontFamily: "IBM Plex Mono",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: 4,
              padding: "26px 46px",
              textTransform: "uppercase",
            }}
          >
            {params.cta.toUpperCase()}
            <svg width="30" height="30" viewBox="0 0 12 12" fill="none">
              <path d="M3.2 8.8 8.8 3.2M4.4 3.2h4.4v4.4" stroke={COLORS.paper} strokeWidth="1.4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Device zone */}
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        {isPhone ? (
          <div
            style={{
              display: "flex",
              width: deviceW,
              height: deviceH,
              borderRadius: 56,
              border: `16px solid ${COLORS.paper}`,
              overflow: "hidden",
              transform: "rotate(-4deg)",
              boxShadow: `28px 28px 0 ${p.accent}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} width={deviceW - 32} alt="" />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: deviceW,
              border: `3px solid ${COLORS.ink}`,
              backgroundColor: COLORS.paper,
              boxShadow: `22px 22px 0 ${p.accent}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "20px 28px",
                borderBottom: `3px solid ${COLORS.ink}`,
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.signal, display: "flex" }} />
              <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.inkFaint, display: "flex" }} />
              <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.ink, display: "flex" }} />
              <div
                style={{
                  display: "flex",
                  marginLeft: 20,
                  fontFamily: "IBM Plex Mono",
                  fontSize: 24,
                  fontWeight: 600,
                  color: COLORS.ink,
                  backgroundColor: "#e6e3da",
                  padding: "8px 26px",
                  borderRadius: 999,
                }}
              >
                {SITE.url}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} width={deviceW - 6} alt="" />
          </div>
        )}
      </div>
    </div>
  );
}

export async function renderAd(params: AdParams): Promise<Response> {
  const { width, height } = AD_SIZES[params.format];

  let element: React.ReactElement;
  if (params.template === "phone" || params.template === "browser") {
    const shot = await siteShot(params.template === "phone" ? "phone" : "desktop");
    // A missing screenshot degrades to the text layout instead of failing.
    element = shot
      ? screenshotAd(params, shot)
      : textAd({ ...params, template: params.template === "phone" ? "ink" : "paper" });
  } else {
    element = textAd(params);
  }

  return new ImageResponse(element, { width, height, fonts: loadFonts() });
}

const TEMPLATES: AdTemplate[] = ["ink", "paper", "signal", "phone", "browser"];
const FORMATS: AdFormat[] = ["story", "feed", "square"];

/** Validate untrusted params into AdParams, or explain what is wrong. */
export function parseAdParams(input: Record<string, unknown>): AdParams | { error: string } {
  const template = String(input.template ?? "");
  const format = String(input.format ?? "story");
  const eyebrow = String(input.eyebrow ?? "").trim();
  const headline = String(input.headline ?? "").trim();
  const sub = input.sub == null ? undefined : String(input.sub).trim() || undefined;
  const cta = String(input.cta ?? "").trim();

  if (!TEMPLATES.includes(template as AdTemplate)) return { error: `template must be one of ${TEMPLATES.join(", ")}` };
  if (!FORMATS.includes(format as AdFormat)) return { error: `format must be one of ${FORMATS.join(", ")}` };
  if (!eyebrow || eyebrow.length > 60) return { error: "eyebrow is required, max 60 chars" };
  if (!headline || headline.length > 120) return { error: "headline is required, max 120 chars" };
  if (sub && sub.length > 220) return { error: "sub max 220 chars" };
  if (!cta || cta.length > 40) return { error: "cta is required, max 40 chars" };

  return { template: template as AdTemplate, format: format as AdFormat, eyebrow, headline, sub, cta };
}
