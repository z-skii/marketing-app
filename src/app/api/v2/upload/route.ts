import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { storeMedia, type MediaFolder } from "@/lib/v2/media";

/**
 * Authenticated media upload for the V2 marketplace. The client sends
 * multipart form data (file + folder); the server validates type and size and
 * returns the stored URL. Nothing here trusts a client-provided path.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const FOLDERS: MediaFolder[] = [
  "avatars", "business", "vehicles", "campaigns", "submissions", "portfolio", "proofs",
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.suspended) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "");
  if (!(file instanceof File) || !FOLDERS.includes(folder as MediaFolder)) {
    return NextResponse.json({ error: "Send a file and a valid folder." }, { status: 400 });
  }

  const stored = await storeMedia(folder as MediaFolder, {
    bytes: await file.arrayBuffer(),
    contentType: file.type,
  });
  if ("error" in stored) return NextResponse.json({ error: stored.error }, { status: 400 });
  return NextResponse.json({ url: stored.url });
}
