// Local-only demo seed for the live screen. Never run against production.
import pg from "pg";
import { randomUUID } from "node:crypto";

const pool = new pg.Pool({
  host: "127.0.0.1",
  user: "app",
  password: "app",
  database: process.env.SEED_DB ?? "untitled",
});
const q = async (sql, params = []) => (await pool.query(sql, params)).rows;

const PROJECTS = [
  ["Ledgerbird", "ledgerbird.io", "Bookkeeping that closes itself every night."],
  ["Fathom Audio", "fathomaudio.fm", "Podcast editing that keeps your ums out."],
  ["Driftless", "driftless.app", "A calm planner for people with loud weeks."],
  ["Copperline", "copperline.studio", "Brand systems for hardware companies."],
  ["Nightjar", "nightjar.dev", "Cron jobs you can actually see."],
  ["Peat", "peat.garden", "Grow-lights tuned by real botanists."],
  ["Vellum House", "vellumhouse.com", "Short-run art books, printed properly."],
  ["Kelpline", "kelpline.co", "Ocean-farmed snacks, direct from the rope."],
  ["Standwell", "standwell.fit", "A desk that argues when you slouch."],
  ["Mapmaker's Supply", "mapmakerssupply.com", "Field tools for cartography nerds."],
  ["Quietmark", "quietmark.app", "Email signatures without the tracking pixel."],
  ["Bellhop Games", "bellhop.games", "Couch games for exactly four people."],
  ["Ferrous", "ferrous.tools", "Rust crates, benchmarked weekly."],
  ["Loom & Little", "loomandlittle.com", "Small-batch blankets from mill ends."],
  ["Parallax Coffee", "parallax.coffee", "Single-origin, roasted the day you order."],
  ["Hutch", "hutch.rent", "Furniture rental for people who move a lot."],
  ["Signal Garden", "signalgarden.net", "A tiny observatory for your backyard."],
  ["Brickbat", "brickbat.press", "A newsletter of architecture opinions."],
  ["Milk Route", "milkroute.co", "Local dairy, delivered before six."],
  ["Ozette", "ozette.ai", "Meeting notes that name the follow-ups."],
  ["Ravel", "ravel.fm", "A record club that mails you one LP a month."],
  ["Sixfold", "sixfold.design", "Icons drawn on a real grid."],
  ["Tidepool Labs", "tidepool.dev", "Feature flags for teams of five."],
  ["Wren Security", "wrensec.com", "Pen tests with readable reports."],
  ["Almanac Goods", "almanacgoods.com", "Kitchen tools that outlive trends."],
  ["Barnacle", "barnacle.boats", "Maintenance logs for old sailboats."],
  ["Cinder", "cinder.recipes", "Recipes that scale down to one person."],
  ["Dovetail Joinery", "dovetailjoinery.uk", "Furniture classes in a working shop."],
  ["Ember Atlas", "emberatlas.org", "Live wildfire maps with local alerts."],
  ["Foghorn", "foghorn.audio", "A hardware mute button for every call."],
  ["Gable", "gable.homes", "Renovation quotes without the mystery."],
  ["Hollowell", "hollowell.bike", "Steel frames, brazed to order."],
  ["Inkwell Index", "inkwellindex.com", "Every fountain pen ink, swatched."],
  ["Junction Rail", "junctionrail.app", "Train times that admit the delay early."],
  ["Kestrel Optics", "kestreloptics.com", "Binoculars tuned for city birding."],
  ["Lantern Press", "lantern.press", "Poetry chapbooks, riso-printed."],
  ["Morrow Seeds", "morrowseeds.com", "Heirloom seeds with honest yield notes."],
  ["Nettle", "nettle.tea", "Foraged tisanes, tested for what's in them."],
  ["Orchard Row", "orchardrow.market", "A CSA box you can actually customize."],
  ["Pembroke Audio", "pembroke.audio", "Speaker kits you solder yourself."],
  ["Quarry", "quarry.game", "A slow strategy game played by mail."],
  ["Rushlight", "rushlight.energy", "Home batteries with boring, clear pricing."],
  ["Saltford", "saltford.swim", "Open-water swim maps with tide windows."],
  ["Tern", "tern.travel", "Trips planned around train lines, not airports."],
  ["Umber", "umber.paint", "Limewash paint in thirty real pigments."],
  ["Verge Radio", "vergeradio.live", "College radio, archived forever."],
];

async function main() {
  await q(`select ensure_current_round()`);

  const [{ id: owner }] = await q(
    `insert into auth.users (email) values ('demo-owner@example.test') returning id`,
  );
  await q(`insert into profiles (id, display_name) values ($1, 'demo')`, [owner]);
  await q(`select ensure_wallet($1)`, [owner]);
  await q(`select apply_stripe_topup($1, $2, $3, $4)`, [
    owner, `cs_test_${randomUUID()}`, `pi_${randomUUID()}`, 2_000_000,
  ]);

  const linkIds = [];
  for (const [name, domain, desc] of PROJECTS) {
    const slug = domain.replace(/[^a-z0-9]+/g, "-");
    const [l] = await q(
      `insert into links (owner_id, slug, destination_url, domain, display_name,
                          short_description, moderation_status)
       values ($1, $2, $3, $4, $5, $6, 'approved') returning id`,
      [owner, slug, `https://${domain}`, domain, name, desc],
    );
    linkIds.push(l.id);
  }

  // Board: descending but uneven scores so the ranking looks lived-in.
  const boardPlacements = [];
  for (let i = 0; i < linkIds.length; i++) {
    const dollars = Math.max(2, Math.round(140 * Math.exp(-i / 12) + (i % 5)));
    const [row] = await q(
      `select allocate_to_placement($1, $2, 'board'::placement_type, $3) as id`,
      [owner, linkIds[i], dollars * 100],
    );
    boardPlacements.push(row.id);
  }

  // Movement arrows need a previous rank to move against.
  await q(`
    update board_round_entries e set previous_rank = sub.rank + (sub.rank % 7) - 3
    from (
      select e2.placement_id, row_number() over (order by e2.score_cents desc) as rank
      from board_round_entries e2
      join daily_rounds r on r.id = e2.round_id and r.status = 'active'
    ) sub
    where sub.placement_id = e.placement_id and sub.rank % 3 != 0
  `);

  // Bar: first thirty links also ride the tape.
  for (let i = 0; i < 30; i++) {
    await q(`select allocate_to_placement($1, $2, 'bar'::placement_type, $3) as id`,
      [owner, linkIds[i], 500]);
  }

  // Spot: one live now, one right after, two later.
  const spotIds = [];
  for (const i of [0, 3, 7, 11]) {
    const [row] = await q(
      `select allocate_to_placement($1, $2, 'spot'::placement_type, $3) as id`,
      [owner, linkIds[i], 3000],
    );
    spotIds.push(row.id);
  }
  await q(
    `insert into spot_schedules (placement_id, starts_at, ends_at, status) values
       ($1, now() - interval '15 seconds', now() + interval '45 seconds', 'scheduled'),
       ($2, now() + interval '45 seconds', now() + interval '105 seconds', 'scheduled'),
       ($3, now() + interval '10 minutes', now() + interval '11 minutes', 'scheduled'),
       ($4, now() + interval '20 minutes', now() + interval '21 minutes', 'scheduled')`,
    spotIds,
  );

  // Opens: heavier at the top, thinner down the ranks.
  for (let i = 0; i < 18; i++) {
    const clicks = Math.max(1, Math.round(24 * Math.exp(-i / 6)));
    for (let c = 0; c < clicks; c++) {
      await q(`select record_click($1, $2, null, 'seed-agent', null, null, null, null)`,
        [boardPlacements[i], `seed-visitor-${randomUUID()}`]);
    }
  }

  const [board] = await q(`select count(*)::int as n from public_board`);
  const [bar] = await q(`select count(*)::int as n from public_bar`);
  const [spot] = await q(`select display_name from public_spot join links on true limit 1`).catch(() => [null]);
  console.log(`board=${board.n} bar=${bar.n} spot=${spot ? "live" : "none"}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
