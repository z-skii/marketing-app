import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseAdParams, renderAd } from "@/lib/ad-render";
import { uploadAdPng } from "@/lib/agent-storage";

/**
 * Ad rendering endpoint.
 *
 *   POST { template, format?, eyebrow, headline, sub?, cta }
 *     → renders the PNG, saves it to the storage bucket under ads/ (when the
 *       service key is configured), returns the PNG with X-Asset-Url.
 *   GET  ?template=…&headline=…            (admin only)
 *     → renders without saving; this is what the review screen's <img> hits
 *       for queue items that predate storage configuration.
 *
 * Admin session or the cron secret authorizes either method.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && bearer === secret) return true;
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }

  const params = parseAdParams(body);
  if ("error" in params) return NextResponse.json({ error: params.error }, { status: 400 });

  const png = await (await renderAd(params)).arrayBuffer();
  let assetUrl: string | null = null;
  try {
    assetUrl = await uploadAdPng(png);
  } catch (error) {
    // The PNG still returns; the caller decides whether a missing stored
    // copy is fatal (publishing does, previewing does not).
    console.error("render-ad upload:", error);
  }

  return new NextResponse(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
      ...(assetUrl ? { "x-asset-url": assetUrl } : {}),
    },
  });
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const q = Object.fromEntries(request.nextUrl.searchParams.entries());
  const params = parseAdParams(q);
  if ("error" in params) return NextResponse.json({ error: params.error }, { status: 400 });
  return renderAd(params);
}
