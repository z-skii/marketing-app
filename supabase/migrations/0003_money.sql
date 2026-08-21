-- Atomic money operations. Every balance change goes through these functions so
-- the immutable ledger and the cached wallet balances can never diverge.

-- Recompute a user's true total remaining platform credit from source rows.
create or replace function wallet_total_credit_cents(p_user uuid)
returns bigint language sql stable as $$
  select coalesce((select available_credit_cents from wallets where user_id = p_user), 0)
       + coalesce((select sum(remaining_credit_cents) from placements where owner_id = p_user), 0);
$$;

-- Internal: append to the immutable ledger and refresh the cached total.
-- Assumes the caller already holds a row lock on the wallet.
create or replace function ledger_append(
  p_user uuid, p_amount bigint, p_type ledger_type,
  p_before bigint, p_after bigint,
  p_entity_type text default null, p_entity_id uuid default null,
  p_reason text default null, p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into credit_ledger (user_id, amount_cents, transaction_type, balance_before_cents,
                             balance_after_cents, related_entity_type, related_entity_id, reason, metadata)
  values (p_user, p_amount, p_type, p_before, p_after, p_entity_type, p_entity_id, p_reason, p_metadata)
  returning id into v_id;

  update wallets set cached_total_remaining_credit_cents = p_after, updated_at = now()
  where user_id = p_user;

  return v_id;
end;
$$;

create or replace function ensure_wallet(p_user uuid)
returns void language plpgsql as $$
begin
  insert into wallets (user_id) values (p_user) on conflict (user_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------- rounds

-- The active round, opening one if none exists. Round boundaries follow the
-- configurable reset hour so admins can move the daily cutover.
create or replace function ensure_current_round()
returns daily_rounds language plpgsql as $$
declare
  v_round daily_rounds;
  v_hour  bigint := setting_int('board_reset_utc_hour', 0);
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

  v_start := date_trunc('day', now() at time zone 'utc') + make_interval(hours => v_hour::int);
  if v_start > now() then v_start := v_start - interval '1 day'; end if;

  insert into daily_rounds (starts_at, ends_at, status)
  values (v_start, v_start + interval '1 day', 'active')
  returning * into v_round;
  return v_round;
end;
$$;

-- Daily reset. Board SCORE resets; unused placement money survives untouched.
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
    v_start := date_trunc('day', now() at time zone 'utc')
             + make_interval(hours => setting_int('board_reset_utc_hour', 0)::int);
  end if;

  -- Never leave a gap if the reset job ran late.
  while v_start + interval '1 day' <= now() loop
    v_start := v_start + interval '1 day';
  end loop;

  insert into daily_rounds (starts_at, ends_at, status)
  values (v_start, v_start + interval '1 day', 'active')
  returning * into v_new;

  -- Carry every still-funded board placement into the new round at score 0,
  -- remembering its finishing rank for deterministic tie-breaking.
  if v_old.id is not null then
    insert into board_round_entries (round_id, placement_id, score_cents, previous_rank, activated_at)
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

-- ---------------------------------------------------------------- top-ups

-- Idempotent by Stripe session id: replaying a webhook can never double-credit.
create or replace function apply_stripe_topup(
  p_user uuid, p_session_id text, p_payment_intent text,
  p_amount_cents bigint, p_event_id text default null
) returns boolean language plpgsql as $$
declare
  v_before bigint;
  v_after  bigint;
  v_payment stripe_payments;
begin
  if p_amount_cents <= 0 then
    raise exception 'top-up amount must be positive';
  end if;

  perform ensure_wallet(p_user);

  -- Claim the session. A duplicate delivery loses the race and returns false.
  insert into stripe_payments (user_id, stripe_session_id, stripe_payment_intent_id,
                               stripe_event_id, amount_cents, status, processed_at)
  values (p_user, p_session_id, p_payment_intent, p_event_id, p_amount_cents, 'succeeded', now())
  on conflict (stripe_session_id) do nothing
  returning * into v_payment;

  if v_payment.id is null then
    return false;   -- already processed
  end if;

  perform 1 from wallets where user_id = p_user for update;

  v_before := wallet_total_credit_cents(p_user);
  update wallets
     set available_credit_cents = available_credit_cents + p_amount_cents,
         updated_at = now()
   where user_id = p_user;
  v_after := v_before + p_amount_cents;

  perform ledger_append(p_user, p_amount_cents, 'stripe_topup', v_before, v_after,
                        'stripe_payment', v_payment.id, 'Stripe top-up',
                        jsonb_build_object('stripe_session_id', p_session_id));
  return true;
end;
$$;

-- ---------------------------------------------------------------- allocation

-- Move money from available credit into a placement.
-- For board placements this ALSO raises the current-round score by the same
-- amount — the score is what ranks the board, and it only ever goes up.
create or replace function allocate_to_placement(
  p_user uuid, p_link_id uuid, p_type placement_type, p_amount_cents bigint
) returns uuid language plpgsql as $$
declare
  v_link      links;
  v_placement placements;
  v_round     daily_rounds;
  v_before    bigint;
  v_after     bigint;
  v_ledger    ledger_type;
  v_avail     bigint;
begin
  if p_amount_cents <= 0 then
    raise exception 'allocation must be positive';
  end if;

  select * into v_link from links where id = p_link_id;
  if not found then raise exception 'link not found'; end if;
  if v_link.owner_id <> p_user then raise exception 'not your link'; end if;

  perform ensure_wallet(p_user);
  select available_credit_cents into v_avail from wallets where user_id = p_user for update;
  if v_avail < p_amount_cents then
    raise exception 'insufficient available credit' using errcode = 'check_violation';
  end if;

  select * into v_placement from placements
   where link_id = p_link_id and placement_type = p_type for update;

  if not found then
    insert into placements (link_id, owner_id, placement_type, remaining_credit_cents, status)
    values (p_link_id, p_user, p_type, 0, 'pending')
    returning * into v_placement;
  end if;

  v_before := wallet_total_credit_cents(p_user);

  update wallets set available_credit_cents = available_credit_cents - p_amount_cents,
                     updated_at = now()
   where user_id = p_user;

  update placements
     set remaining_credit_cents = remaining_credit_cents + p_amount_cents,
         -- Approved links go live immediately; unapproved ones stay pending and
         -- burn nothing until moderation clears them.
         status = case
           when v_link.moderation_status = 'approved' and v_link.enabled then 'active'::placement_status
           else 'pending'::placement_status
         end,
         activated_at = coalesce(activated_at,
           case when v_link.moderation_status = 'approved' and v_link.enabled then now() end),
         exhausted_at = null,
         updated_at = now()
   where id = v_placement.id
   returning * into v_placement;

  -- Total credit is unchanged by an allocation — money moved, not spent.
  v_after := v_before;

  v_ledger := case p_type
    when 'board' then 'board_allocate'::ledger_type
    when 'spot'  then 'spot_allocate'::ledger_type
    when 'bar'   then 'bar_allocate'::ledger_type
  end;

  perform ledger_append(p_user, -p_amount_cents, v_ledger, v_before, v_after,
                        'placement', v_placement.id,
                        format('Allocated to %s', p_type),
                        jsonb_build_object('link_id', p_link_id, 'allocated_cents', p_amount_cents));

  if p_type = 'board' then
    v_round := ensure_current_round();
    insert into board_round_entries (round_id, placement_id, score_cents, activated_at)
    values (v_round.id, v_placement.id, p_amount_cents, coalesce(v_placement.activated_at, now()))
    on conflict (round_id, placement_id)
      do update set score_cents = board_round_entries.score_cents + excluded.score_cents,
                    updated_at = now();
  end if;

  if p_type = 'bar' then perform bar_sync(); end if;

  return v_placement.id;
end;
$$;

-- Pull unspent money back out of a placement and into available credit.
create or replace function release_placement_credit(p_user uuid, p_placement_id uuid, p_amount_cents bigint)
returns void language plpgsql as $$
declare
  v_placement placements;
  v_before bigint;
begin
  select * into v_placement from placements where id = p_placement_id for update;
  if not found then raise exception 'placement not found'; end if;
  if v_placement.owner_id <> p_user then raise exception 'not your placement'; end if;
  if p_amount_cents <= 0 or p_amount_cents > v_placement.remaining_credit_cents then
    raise exception 'invalid release amount';
  end if;

  perform 1 from wallets where user_id = p_user for update;
  v_before := wallet_total_credit_cents(p_user);

  update placements
     set remaining_credit_cents = remaining_credit_cents - p_amount_cents,
         status = case when remaining_credit_cents - p_amount_cents = 0
                       then 'exhausted'::placement_status else status end,
         exhausted_at = case when remaining_credit_cents - p_amount_cents = 0 then now() else exhausted_at end,
         updated_at = now()
   where id = p_placement_id;

  update wallets set available_credit_cents = available_credit_cents + p_amount_cents,
                     updated_at = now()
   where user_id = p_user;

  -- Releasing does not change total credit either.
  perform ledger_append(p_user, p_amount_cents, 'placement_release', v_before, v_before,
                        'placement', p_placement_id, 'Released placement credit');

  if v_placement.placement_type = 'bar' then perform bar_sync(); end if;
end;
$$;

-- Admin-only manual correction. Always leaves a ledger row and an audit entry.
create or replace function admin_adjust_credit(
  p_admin uuid, p_user uuid, p_amount_cents bigint, p_reason text
) returns void language plpgsql as $$
declare v_before bigint; v_after bigint;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for manual adjustments';
  end if;

  perform ensure_wallet(p_user);
  perform 1 from wallets where user_id = p_user for update;

  v_before := wallet_total_credit_cents(p_user);
  if p_amount_cents < 0 then
    perform 1 from wallets where user_id = p_user and available_credit_cents >= -p_amount_cents;
    if not found then raise exception 'cannot debit below zero available credit'; end if;
  end if;

  update wallets set available_credit_cents = available_credit_cents + p_amount_cents,
                     updated_at = now()
   where user_id = p_user;
  v_after := v_before + p_amount_cents;

  perform ledger_append(p_user, p_amount_cents, 'admin_adjustment', v_before, v_after,
                        'profile', p_user, p_reason, jsonb_build_object('admin_user_id', p_admin));

  insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
  values (p_admin, 'adjust_credit', 'profile', p_user,
          jsonb_build_object('amount_cents', p_amount_cents, 'reason', p_reason));
end;
$$;
