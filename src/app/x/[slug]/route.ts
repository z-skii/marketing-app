import { NextResponse, type NextRequest } from "next/server";
import { sql, sqlOne } from "@/lib/db";

/**
 * Outbound open for a SHOWCASE link. Showcase links have no placement, so they
 * cannot leave through /go/ — and they must not: nothing here may ever touch
 * credit, qualification, or billing. The route only serves links flagged
 * `showcase`, counts the open for the public tally, and redirects. A paid link
 * can never use it as a free exit.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!/^[a-z0-9-]{1,64}$/i.test(slug)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const link = await sqlOne<{ id: string; destination_url: string }>(
    `select id, destination_url from links
      where slug = $1 and showcase and moderation_status = 'approved' and enabled`,
    [slug],
  );
  if (!link) return NextResponse.redirect(new URL("/", request.url), 302);

  // Best-effort tally; the redirect never waits on a failed count.
  try {
    await sql(`update links set total_opens = total_opens + 1 where id = $1`, [link.id]);
  } catch {
    /* the open still goes through */
  }

  return NextResponse.redirect(link.destination_url, 302);
}
