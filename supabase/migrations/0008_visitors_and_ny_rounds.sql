-- Platform visitors and New York round boundaries.
--
-- VISITORS: one row per anonymous first-party visitor id. "All-time" is the
-- row count; "live now" is rows seen in the last five minutes. No IPs, no
-- fingerprints: the id is the same random first-party cookie the click
-- pipeline already uses.
--
-- ROUNDS: the daily board round now turns over at midnight in New York
-- (America/New_York), correct across daylight-saving changes. Score reset and
-- credit preservation semantics are untouched.

create table if not exists visitors (
  id         text primary key,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
create index if not exists visitors_last_seen_idx on visitors (last_seen);
alter table visitors enable row level security;

create or replace function visitor_seen(p_id text)
returns void language sql as $$
  insert into visitors (id) values (p_id)
  on conflict (id) do update set last_seen = now();
$$;
alter function visitor_seen(text) set search_path = public;
revoke all on function visitor_seen(text) from public, anon, authenticated;
revoke all on visitors from public, anon, authenticated;

-- Midnight of the current civil day in New York, as an absolute instant.
create or replace function ny_day_start(p_from timestamptz default now())
returns timestamptz language sql stable as $$
  select date_trunc('day', p_from at time zone 'America/New_York')
         at time zone 'America/New_York';
$$;
alter function ny_day_start(timestamptz) set search_path = public;

-- Midnight of the next civil day in New York after the given instant. Adds a
-- civil day in local time, so a round is 23 or 25 hours across DST changes.
create or replace function ny_next_midnight(p_from timestamptz default now())
returns timestamptz language sql stable as $$
  select (date_trunc('day', p_from at time zone 'America/New_York') + interval '1 day')
         at time zone 'America/New_York';
$$;
alter function ny_next_midnight(timestamptz) set search_path = public;

create or replace function ensure_current_round()
returns daily_rounds language plpgsql as $$
declare
  v_round daily_rounds;
  v_start timestamptz;
begin
  select * into v_round from daily_rounds where status = 'active' for update;
  if found and now() < v_round.ends_at then
    return v_round;
  end if;

  if found then
    -- The active round has expired: close it and roll forward.
    return close_round_and_open_next();
  end if;

  v_start := ny_day_start(now());

  insert into daily_rounds (starts_at, ends_at, status)
  values (v_start, ny_next_midnight(v_start), 'active')
  returning * into v_round;
  return v_round;
end;
$$;

create or replace function close_round_and_open_next()
returns daily_rounds language plpgsql as $$
declare
  v_old   daily_rounds;
  v_new   daily_rounds;
  v_start timestamptz;
begin
  select * into v_old from daily_rounds where status = 'active' for update;

  if found then
    -- Freeze final standings for history.
    with ranked as (
      select id, row_number() over (
        order by score_cents desc, previous_rank nulls last, activated_at, placement_id
      ) as rnk
      from board_round_entries where round_id = v_old.id
    )
    update board_round_entries e set final_rank = r.rnk, updated_at = now()
    from ranked r where e.id = r.id;

    update daily_rounds set status = 'closed' where id = v_old.id;
    v_start := v_old.ends_at;
  else
    v_start := ny_day_start(now());
  end if;

  -- Never leave a gap if the reset ran late; walk forward one New York civil
  -- day at a time until the round containing now().
  while ny_next_midnight(v_start) <= now() loop
    v_start := ny_next_midnight(v_start);
  end loop;

  insert into daily_rounds (starts_at, ends_at, status)
  values (v_start, ny_next_midnight(v_start), 'active')
  returning * into v_new;

  -- Carry every still-funded board placement into the new round at score 0,
  -- remembering its finishing rank for deterministic tie-breaking.
  if v_old.id is not null then
    insert into board_round_entries
      (round_id, placement_id, score_cents, previous_rank, activated_at)
    select v_new.id, p.id, 0, old_e.final_rank, coalesce(p.activated_at, now())
    from placements p
    left join board_round_entries old_e
      on old_e.placement_id = p.id and old_e.round_id = v_old.id
    where p.placement_type = 'board'
      and p.status = 'active'
      and p.remaining_credit_cents > 0
    on conflict (round_id, placement_id) do nothing;
  end if;

  return v_new;
end;
$$;

-- Re-pin the recreated functions (create or replace resets settings) and keep
-- them off PostgREST, matching 0006_hardening.
alter function ensure_current_round()      set search_path = public, pg_temp;
alter function close_round_and_open_next() set search_path = public, pg_temp;
revoke execute on function ensure_current_round()      from public, anon, authenticated;
revoke execute on function close_round_and_open_next() from public, anon, authenticated;
alter function visitor_seen(text)     set search_path = public, pg_temp;
alter function ny_day_start(timestamptz)     set search_path = public, pg_temp;
alter function ny_next_midnight(timestamptz) set search_path = public, pg_temp;
