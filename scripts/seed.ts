/**
 * Development seed data.
 *
 * Produces a homepage that looks like a real, busy board so the design can be
 * judged honestly. This is DEVELOPMENT DATA ONLY — `npm run seed` refuses to run
 * against a non-local database unless SEED_ALLOW_REMOTE=true is set explicitly,
 * and nothing here should ever be presented as real activity in production.
 */
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

// Match Next.js: .env.local wins over .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL is required");

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "true") {
  throw new Error(
    "Refusing to seed a non-local database. Set SEED_ALLOW_REMOTE=true if you really mean it.",
  );
}

const pool = new Pool({ connectionString });
const q = async <T = Record<string, string>>(text: string, params: unknown[] = []): Promise<T[]> =>
  (await pool.query(text, params)).rows as T[];

const $ = (dollars: number) => Math.round(dollars * 100);

type Seed = { name: string; domain: string; blurb: string; board?: number; spot?: number; bar?: number };

const SEEDS: Seed[] = [
  { name: "Lumen Type",      domain: "lumentype.com",    blurb: "A variable typeface foundry run by two people.",      board: 92, spot: 40, bar: 12 },
  { name: "Cold Storage",    domain: "coldstorage.fm",   blurb: "Long-form mixes for people who work at night.",       board: 78, spot: 25, bar: 10 },
  { name: "Paper Machine",   domain: "papermachine.io",  blurb: "Turn any RSS feed into a printable weekly.",          board: 64, spot: 18, bar: 8 },
  { name: "Halfmoon",        domain: "halfmoon.tools",   blurb: "A tiny SQL client that lives in your menu bar.",      board: 51, bar: 6 },
  { name: "Field Notes DB",  domain: "fieldnotes.db",    blurb: "Offline-first notes for fieldwork and surveys.",      board: 47, spot: 15, bar: 5 },
  { name: "Orbit Weather",   domain: "orbitweather.app", blurb: "Hyperlocal forecasts without the ad tracking.",       board: 41, bar: 5 },
  { name: "Kettle",          domain: "kettle.sh",        blurb: "Shell scripts with types and a proper stdlib.",       board: 38, spot: 12, bar: 4 },
  { name: "Verso Books",     domain: "verso.press",      blurb: "Independent publishing, printed on demand.",          board: 33, bar: 4 },
  { name: "Nightshift",      domain: "nightshift.cc",    blurb: "Pair programming for distributed teams.",             board: 29, bar: 4 },
  { name: "Grain",           domain: "grain.photo",      blurb: "Film simulation presets, shot on real stock.",        board: 26, spot: 10, bar: 3 },
  { name: "Marginal",        domain: "marginal.blog",    blurb: "One essay a week about building small software.",     board: 23, bar: 3 },
  { name: "Switchboard",     domain: "switchboard.dev",  blurb: "Webhook routing you can actually debug.",             board: 21, bar: 3 },
  { name: "Tidewater",       domain: "tidewater.co",     blurb: "Tide charts and swell data for the whole coast.",     board: 18, bar: 3 },
  { name: "Copperplate",     domain: "copperplate.studio", blurb: "A design studio that only takes three clients.",    board: 16, bar: 2 },
  { name: "Ledger Lite",     domain: "ledgerlite.app",   blurb: "Double-entry bookkeeping in a single file.",          board: 14, spot: 8, bar: 2 },
  { name: "Meridian Maps",   domain: "meridianmaps.com", blurb: "Hand-drawn cartography for tabletop games.",          board: 12, bar: 2 },
  { name: "Static Bloom",    domain: "staticbloom.net",  blurb: "Generative botanical prints, one per day.",           board: 11, bar: 2 },
  { name: "Rundown",         domain: "rundown.email",    blurb: "Your calendar as a plain-text morning email.",        board: 9,  bar: 2 },
  { name: "Anchor Point",    domain: "anchorpoint.gg",   blurb: "Climbing route database with real beta.",             board: 8,  bar: 2 },
  { name: "Slow Query",      domain: "slowquery.io",     blurb: "Postgres performance review, no agent required.",     board: 7,  bar: 1 },
  { name: "Foldout",         domain: "foldout.design",   blurb: "Print-ready zine templates for InDesign and Figma.",  board: 6,  bar: 1 },
  { name: "Passerine",       domain: "passerine.bird",   blurb: "Identify birdsong from a five-second clip.",          board: 5,  bar: 1 },
  { name: "Ironwood",        domain: "ironwood.build",   blurb: "Timber-frame plans for people with a workshop.",      board: 4,  bar: 1 },
  { name: "Quiet Hours",     domain: "quiethours.app",   blurb: "A focus timer that also silences your house.",        board: 3,  bar: 1 },
  { name: "Salt Print",      domain: "saltprint.co",     blurb: "Darkroom supplies for alternative processes.",        board: 2,  bar: 1 },
  { name: "Understory",      domain: "understory.farm",  blurb: "Notes from four years of no-dig market gardening.",   board: 1.5, bar: 1 },
  { name: "Blackletter",     domain: "blackletter.law",  blurb: "Plain-English summaries of new case law.",            board: 1, bar: 1 },
  { name: "Tessellate",      domain: "tessellate.art",   blurb: "Islamic geometric pattern generator, exports SVG.",   board: 0.5, bar: 1 },
];

// ------------------------------------------------------------------ artwork

const PALETTE = [
  ["#ff3b18", "#12100f"], ["#12876f", "#f2f0ea"], ["#1b3fcc", "#eae6dd"],
  ["#e8b21a", "#12100f"], ["#0b0b0c", "#f2f0ea"], ["#7a2ff2", "#f2f0ea"],
  ["#d92a09", "#f7e9d8"], ["#0f6fbf", "#eef4f7"],
];

/** Deterministic, self-contained placeholder art — no external image hosts. */
function artwork(seed: number, initials: string): string {
  const [fg, bg] = PALETTE[seed % PALETTE.length];
  const variant = seed % 4;
  const shapes =
    variant === 0
      ? `<circle cx="300" cy="300" r="170" fill="${fg}"/>`
      : variant === 1
      ? `<path d="M0 600 L600 0 L600 600 Z" fill="${fg}"/>`
      : variant === 2
      ? Array.from({ length: 7 }, (_, i) => `<rect x="${i * 86}" y="0" width="43" height="600" fill="${fg}"/>`).join("")
      : `<rect x="90" y="90" width="420" height="420" fill="none" stroke="${fg}" stroke-width="46"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<rect width="600" height="600" fill="${bg}"/>
${shapes}
<text x="44" y="500" font-family="Helvetica,Arial,sans-serif" font-size="84" font-weight="800"
      letter-spacing="-4" fill="${variant === 0 || variant === 1 ? bg : fg}">${initials}</text>
</svg>`;
}

// --------------------------------------------------------------------- main

async function main() {
  const dir = path.join(process.cwd(), "public", "seed");
  mkdirSync(dir, { recursive: true });

  console.log("clearing previous seed data…");
  await q(`truncate table credit_ledger, click_events, creator_earnings, creator_sessions,
    creator_referrals, payout_requests, stripe_payments, bar_queue, spot_schedules,
    board_round_entries, daily_rounds, placements, links, wallets, profiles,
    admin_audit_log restart identity cascade`);
  await q(`delete from auth.users`);

  // --- accounts -----------------------------------------------------------
  await makeUser("admin@untitled.test", "Admin", "admin");
  const creator = await makeUser("creator@untitled.test", "Creator");
  const owner = await makeUser("owner@untitled.test", "Owner");

  await q(`select ensure_current_round()`);

  // --- links --------------------------------------------------------------
  console.log(`seeding ${SEEDS.length} links…`);
  const totalNeeded = SEEDS.reduce(
    (sum, s) => sum + $(s.board ?? 0) + $(s.spot ?? 0) + $(s.bar ?? 0), 0,
  );
  await topUp(owner, totalNeeded + $(500));

  const placements: { id: string; type: string }[] = [];

  for (const [index, seed] of SEEDS.entries()) {
    const initials = seed.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const file = `${seed.domain.replace(/[^a-z0-9]/gi, "-")}.svg`;
    writeFileSync(path.join(dir, file), artwork(index, initials));

    const slug = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [link] = await q<{ id: string }>(
      `insert into links (owner_id, slug, destination_url, domain, display_name,
                          short_description, image_url, moderation_status)
       values ($1,$2,$3,$4,$5,$6,$7,'approved') returning id`,
      [owner, slug, `https://${seed.domain}`, seed.domain, seed.name, seed.blurb, `/seed/${file}`],
    );

    for (const type of ["board", "spot", "bar"] as const) {
      const dollars = seed[type];
      if (!dollars) continue;
      const [row] = await q<{ allocate_to_placement: string }>(
        `select allocate_to_placement($1,$2,$3::placement_type,$4)`,
        [owner, link.id, type, $(dollars)],
      );
      placements.push({ id: row.allocate_to_placement, type });
    }
  }

  // A couple of links awaiting moderation, so /admin has something to review.
  for (const pending of [
    { name: "Undertow", domain: "undertow.studio", blurb: "Motion design for record labels." },
    { name: "Cairn", domain: "cairn.guide", blurb: "Backcountry route planning with offline maps." },
  ]) {
    await q(
      `insert into links (owner_id, slug, destination_url, domain, display_name,
                          short_description, moderation_status)
       values ($1,$2,$3,$4,$5,$6,'pending')`,
      [creator, pending.name.toLowerCase(), `https://${pending.domain}`,
       pending.domain, pending.name, pending.blurb],
    );
  }

  // --- schedules ----------------------------------------------------------
  console.log("scheduling the spot…");
  await q(`update daily_rounds set starts_at = now() - interval '30 seconds'
           where status = 'active'`);
  await q(`select schedule_spot_day()`);
  await q(`select bar_sync()`);

  // --- simulated history --------------------------------------------------
  // Qualified opens from distinct visitors, so the board has believable depth.
  console.log("simulating opens…");
  const [ref] = await q<{ id: string }>(
    `insert into creator_referrals (creator_user_id, referral_code, target_type)
     values ($1, 'demo01', 'home') returning id`, [creator],
  );

  const boardPlacements = placements.filter((p) => p.type === "board");
  let opens = 0;
  for (const [i, p] of boardPlacements.entries()) {
    // Higher-ranked links have had more traffic.
    const count = Math.max(2, Math.round(60 / (i + 1)));
    for (let n = 0; n < count; n++) {
      const withCreator = n % 4 === 0;
      await q(
        `select record_click($1,$2,null,'Mozilla/5.0 (seed)',$3,$4,null,null)`,
        [p.id, `seed-visitor-${randomUUID()}`, withCreator ? creator : null, withCreator ? ref.id : null],
      );
      opens++;
    }
  }

  // Age some creator earnings past the hold so the Earn dashboard shows both states.
  await q(
    `update creator_earnings set status = 'available', available_at = now() - interval '1 day'
      where id in (select id from creator_earnings order by created_at limit 12)`,
  );

  const [{ n: live }] = await q<{ n: string }>(
    `select count(*)::text as n from placements where status = 'active'`,
  );

  console.log(`\ndone — ${SEEDS.length} links, ${live} active placements, ${opens} simulated opens`);
  console.log("accounts (dev auth mode, any code works):");
  console.log("  owner@untitled.test    — owns every seeded link");
  console.log("  creator@untitled.test  — has referral earnings");
  console.log("  admin@untitled.test    — admin access");
  await pool.end();
}

async function makeUser(email: string, name: string, role: "user" | "admin" = "user") {
  const [u] = await q<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`, [email],
  );
  await q(`insert into profiles (id, display_name, role) values ($1,$2,$3::user_role)`, [u.id, name, role]);
  await q(`select ensure_wallet($1)`, [u.id]);
  return u.id;
}

async function topUp(user: string, cents: number) {
  await q(`select apply_stripe_topup($1,$2,$3,$4)`, [user, `cs_seed_${randomUUID()}`, "pi_seed", cents]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
