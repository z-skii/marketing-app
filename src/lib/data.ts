import "server-only";
import { sql, sqlOne } from "./db";

/** Public read models. None of these ever expose a placement's remaining credit. */

export type BoardRow = {
  rank: number;
  previous_rank: number | null;
  score_cents_today: number;
  opens_today: number;
  placement_id: string;
  link_id: string;
  slug: string;
  display_name: string;
  short_description: string | null;
  image_url: string | null;
  domain: string;
  total_opens: number;
};

export type SpotRow = {
  schedule_id: string;
  placement_id: string;
  starts_at: string;
  ends_at: string;
  link_id: string;
  slug: string;
  display_name: string;
  short_description: string | null;
  image_url: string | null;
  domain: string;
  total_opens: number;
};

export type BarRow = {
  queue_position: number;
  placement_id: string;
  link_id: string;
  slug: string;
  display_name: string;
  domain: string;
  image_url: string | null;
};

const numeric = <T extends Record<string, unknown>>(row: T, keys: string[]): T => {
  for (const key of keys) {
    if (row[key] !== null && row[key] !== undefined) {
      (row as Record<string, unknown>)[key] = Number(row[key]);
    }
  }
  return row;
};

export async function getBoard(limit = 100, offset = 0): Promise<BoardRow[]> {
  const rows = await sql<BoardRow>(
    `select * from public_board order by rank limit $1 offset $2`, [limit, offset],
  );
  return rows.map((r) =>
    numeric(r, ["rank", "previous_rank", "score_cents_today", "opens_today", "total_opens"]),
  );
}

export async function getBoardCount(): Promise<number> {
  const row = await sqlOne<{ n: string }>(`select count(*)::text as n from public_board`);
  return Number(row?.n ?? 0);
}

export async function getCurrentSpot(): Promise<SpotRow | null> {
  const row = await sqlOne<SpotRow>(`select * from public_spot`);
  return row ? numeric(row, ["total_opens"]) : null;
}

/** Shown when nothing is scheduled right now, so the section is never empty-handed. */
export async function getNextSpot(): Promise<SpotRow | null> {
  return sqlOne<SpotRow>(
    `select s.id as schedule_id, s.placement_id, s.starts_at, s.ends_at,
            l.id as link_id, l.slug, l.display_name, l.short_description,
            l.image_url, l.domain, l.total_opens
       from spot_schedules s
       join placements p on p.id = s.placement_id
       join links l on l.id = p.link_id
      where s.starts_at > now() and s.status = 'scheduled'
        and p.status = 'active' and p.remaining_credit_cents > 0
        and l.moderation_status = 'approved' and l.enabled
      order by s.starts_at asc
      limit 1`,
  );
}

export async function getBar(): Promise<BarRow[]> {
  const rows = await sql<BarRow>(`select * from public_bar order by queue_position`);
  return rows.map((r) => numeric(r, ["queue_position"]));
}

export type RoundInfo = { id: string; starts_at: string; ends_at: string };

export async function getCurrentRound(): Promise<RoundInfo | null> {
  const round = await sqlOne<RoundInfo>(
    `select id, starts_at, ends_at from daily_rounds where status = 'active' limit 1`,
  );
  if (round && new Date(round.ends_at).getTime() > Date.now()) return round;

  // Hosting plans may only run the maintenance cron once a day, so the round
  // also rolls forward lazily: the first request that notices the active round
  // has expired advances it. ensure_current_round() no-ops while it is fresh,
  // and the catch covers the rare midnight race where two requests roll at once.
  try {
    return await sqlOne<RoundInfo>(
      `select id, starts_at, ends_at from ensure_current_round()`,
    );
  } catch {
    return sqlOne<RoundInfo>(
      `select id, starts_at, ends_at from daily_rounds where status = 'active' limit 1`,
    );
  }
}

export type LinkProfile = {
  id: string; slug: string; display_name: string; short_description: string | null;
  image_url: string | null; domain: string; total_opens: number;
  board_placement_id: string | null; board_rank: number | null; board_score_cents: number | null;
  spot_placement_id: string | null; bar_placement_id: string | null;
};

export async function getLinkBySlug(slug: string): Promise<LinkProfile | null> {
  const row = await sqlOne<LinkProfile>(
    `select l.id, l.slug, l.display_name, l.short_description, l.image_url, l.domain,
            l.total_opens,
            b.placement_id as board_placement_id,
            b.rank        as board_rank,
            b.score_cents_today as board_score_cents,
            (select p.id from placements p where p.link_id = l.id
              and p.placement_type = 'spot' and p.status = 'active'
              and p.remaining_credit_cents > 0) as spot_placement_id,
            (select p.id from placements p where p.link_id = l.id
              and p.placement_type = 'bar' and p.status = 'active'
              and p.remaining_credit_cents > 0) as bar_placement_id
       from links l
       left join public_board b on b.link_id = l.id
      where l.slug = $1 and l.moderation_status = 'approved' and l.enabled`,
    [slug],
  );
  return row
    ? numeric(row, ["total_opens", "board_rank", "board_score_cents"])
    : null;
}

/** Totals for the live header. Cheap aggregates only — never a scan per request. */
export async function getLiveStats(): Promise<{ liveLinks: number; opensToday: number }> {
  const row = await sqlOne<{ live_links: string; opens_today: string }>(
    `select
       (select count(*)::text from placements
         where status = 'active' and remaining_credit_cents > 0) as live_links,
       (select coalesce(sum(opens_count), 0)::text
          from board_round_entries e
          join daily_rounds r on r.id = e.round_id and r.status = 'active') as opens_today`,
  );
  return {
    liveLinks: Number(row?.live_links ?? 0),
    opensToday: Number(row?.opens_today ?? 0),
  };
}
