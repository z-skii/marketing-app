import { supabaseAnon } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic for a corrupted-header failure that only reproduces in
 * the deployed runtime. Reports env variable NAMES containing non-printable
 * characters (never values), and runs three fetch probes with fully constant
 * inputs, capturing the real stack when one throws. Remove once the culprit
 * is found.
 */

const URL_BASE = "https://mzqlmhuzbtcotmorgadf.supabase.co";
const ANON =
  "eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";

type ProbeResult =
  | { ok: true; status: number }
  | { ok: false; message: string; stack?: string };

async function probeFetch(headers: Record<string, string>): Promise<ProbeResult> {
  try {
    const res = await fetch(`${URL_BASE}/auth/v1/health`, { headers, cache: "no-store" });
    return { ok: true, status: res.status };
  } catch (e) {
    const err = e as Error;
    return { ok: false, message: err.message, stack: err.stack };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== "audit-7f3x") {
    return new Response("Not found", { status: 404 });
  }

  const names: string[] = [];
  const corrupted: Array<{
    name: string;
    length: number;
    badIndex: number;
    badCode: number;
    head: string;
  }> = [];
  for (const [name, value] of Object.entries(process.env)) {
    names.push(name);
    const chars = [...(value ?? "")];
    const badIndex = chars.findIndex((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x20 || code > 0x7e;
    });
    if (badIndex !== -1) {
      corrupted.push({
        name,
        length: chars.length,
        badIndex,
        badCode: chars[badIndex]?.codePointAt(0) ?? -1,
        head: chars.slice(0, 4).join(""),
      });
    }
  }

  const bareFetch = await probeFetch({});
  const headerFetch = await probeFetch({ apikey: ANON, Authorization: `Bearer ${ANON}` });

  let supabaseProbe: unknown;
  try {
    const { error } = await supabaseAnon().auth.signInWithOtp({
      email: "audit-probe@example.com",
      options: { shouldCreateUser: false },
    });
    supabaseProbe = error ? { message: error.message } : { ok: true };
  } catch (e) {
    const err = e as Error;
    supabaseProbe = { thrown: true, message: err.message, stack: err.stack };
  }

  return Response.json({
    node: process.version,
    corrupted,
    probes: { bareFetch, headerFetch, supabaseProbe },
    names: names.sort(),
  });
}
