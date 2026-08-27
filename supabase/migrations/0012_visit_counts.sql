-- The header counter counts visits, not unique people: coming back after a
-- break counts again. A "visit" is a return after 30+ minutes away — the
-- presence beacon pings every minute while a tab is open, so pings inside one
-- sitting never inflate the number.

alter table visitors add column if not exists visits bigint not null default 1;

create or replace function visitor_seen(p_id text)
returns void language sql as $$
  insert into visitors (id) values (p_id)
  on conflict (id) do update
    set visits = visitors.visits
                 + case when visitors.last_seen < now() - interval '30 minutes'
                        then 1 else 0 end,
        last_seen = now();
$$;
alter function visitor_seen(text) set search_path = public;
revoke all on function visitor_seen(text) from public, anon, authenticated;
