import "server-only";
import { ImageResponse } from "next/og";
import { COLORS, SITE } from "./brand-kit";
import { ARCHIVO_800, ARCHIVO_900, PLEXMONO_500, PLEXMONO_600 } from "../assets/fonts-data";

/**
 * Server-side ad rendering. Three templates in the house style — ink, paper,
 * signal — at story (1080x1920) and feed (1080x1350) sizes, drawn with the
 * vendored brand fonts so a rendered ad is pixel-true to the site.
 */

export type AdTemplate = "ink" | "paper" | "signal";
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
};

function headlineSize(text: string, format: AdFormat): number {
  const scale = format === "story" ? 1 : format === "feed" ? 0.88 : 0.8;
  if (text.length <= 18) return Math.round(150 * scale);
  if (text.length <= 40) return Math.round(116 * scale);
  if (text.length <= 70) return Math.round(92 * scale);
  return Math.round(72 * scale);
}

export async function renderAd(params: AdParams): Promise<Response> {
  const { width, height } = AD_SIZES[params.format];
  const p = PALETTES[params.template];
  const pad = 88;

  const image = new ImageResponse(
    (
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
    ),
    { width, height, fonts: loadFonts() },
  );
  return image;
}

const TEMPLATES: AdTemplate[] = ["ink", "paper", "signal"];
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
