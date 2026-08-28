import { ImageResponse } from "next/og";
import { getLinkBySlug } from "@/lib/data";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import { formatCount } from "@/lib/money";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INK = "#0b0b0c";
const PAPER = "#f2f0ea";
const FAINT = "#8b887e";
const SIGNAL = "#ff3b18";

/**
 * A 1080x1920 story card for one link — sized for an Instagram/TikTok story,
 * drawn in the broadcast identity. The artwork is embedded as a data URL so a
 * slow or dead image host can never break the card; it simply falls back to
 * the initials plate.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return new Response("Not found", { status: 404 });

  const art = await fetchArtwork(link.image_url);
  const initials = link.display_name.slice(0, 2).toUpperCase();
  const name = link.display_name.toUpperCase();
  const nameSize = name.length > 16 ? 88 : name.length > 9 ? 116 : 148;

  // The frame hugs the photo exactly: scale its true proportions into the
  // available plate area, whatever shape was uploaded.
  const MAX_W = 904;
  const MAX_H = 920;
  let artW = MAX_W;
  let artH = MAX_H;
  if (art?.width && art?.height) {
    // Fill the plate: scale up or down until one side touches the limit.
    const scale = Math.min(MAX_W / art.width, MAX_H / art.height);
    artW = Math.round(art.width * scale);
    artH = Math.round(art.height * scale);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: INK,
          color: PAPER,
          padding: "96px 88px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 22, height: 22, background: SIGNAL, borderRadius: 999 }} />
            <div style={{ fontSize: 34, letterSpacing: 10, color: SIGNAL }}>LIVE ON</div>
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2 }}>
            {SITE_NAME.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 72,
          }}
        >
          {art ? (
            <div
              style={{
                display: "flex",
                width: artW,
                height: artH,
                border: `3px solid ${PAPER}`,
                background: "#121214",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={art.dataUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: art.width ? "cover" : "contain" }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: MAX_W,
                height: MAX_H,
                border: `3px solid ${PAPER}`,
                background: "#121214",
                fontSize: 340,
                fontWeight: 800,
                color: "#2a2a2e",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {link.board_rank != null && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: SIGNAL,
              color: INK,
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 4,
              padding: "14px 28px",
              marginTop: 56,
            }}
          >
            {`#${link.board_rank} ON THE BOARD`}
          </div>
        )}

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 8,
            color: FAINT,
            marginTop: link.board_rank != null ? 40 : 64,
          }}
        >
          {link.domain.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: nameSize,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1.02,
            marginTop: 14,
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 36 }}>
          <div style={{ fontSize: 38, fontWeight: 700 }}>
            {formatCount(link.total_opens)}
          </div>
          <div style={{ fontSize: 30, letterSpacing: 6, color: FAINT }}>OPENS</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid #2a2a2e`,
            paddingTop: 48,
            marginTop: 64,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 46, fontWeight: 800 }}>tapmart.live</div>
            <div style={{ fontSize: 28, color: FAINT, marginTop: 8 }}>{SITE_TAGLINE}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 84, height: 10, background: PAPER }} />
            <div style={{ width: 48, height: 10, background: PAPER, opacity: 0.5 }} />
            <div style={{ width: 30, height: 10, background: SIGNAL }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      // Phones aggressively cache images; the card must always be current.
      headers: { "cache-control": "no-store" },
    },
  );
}

type Artwork = { dataUrl: string; width?: number; height?: number };

async function fetchArtwork(url: string | null): Promise<Artwork | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;

    // The uploaded file is framed exactly as uploaded — never trimmed or
    // cropped. sharp only reads its true pixel size for the frame.
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buf).metadata();
      if (meta.width && meta.height) {
        return {
          dataUrl: `data:${type};base64,${buf.toString("base64")}`,
          width: meta.width,
          height: meta.height,
        };
      }
    } catch {
      // Unreadable metadata — the card falls back to the initials plate.
    }

    return { dataUrl: `data:${type};base64,${buf.toString("base64")}` };
  } catch {
    return null;
  }
}
