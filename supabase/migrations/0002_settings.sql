-- Configurable operational settings. Never hardcode these in application code.

insert into app_settings (key, value) values
  ('board_click_price_cents',      '5'),
  ('spot_click_price_cents',       '5'),
  ('bar_click_price_cents',        '5'),
  ('creator_commission_cents',     '1'),
  ('duplicate_click_window_hours', '24'),
  ('board_reset_utc_hour',         '0'),
  ('spot_appearance_seconds',      '60'),
  ('spot_appearances_per_day',     '10'),
  ('spot_capacity',                '144'),
  ('bar_capacity',                 '100'),
  ('creator_fraud_hold_days',      '7'),
  ('minimum_payout_cents',         '2500'),
  ('minimum_topup_cents',          '500'),
  ('maximum_topup_cents',          '100000'),
  ('feature_creator_program',      'true'),
  ('feature_spot_enabled',         'true'),
  ('feature_bar_enabled',          'true')
on conflict (key) do nothing;

create or replace function setting_int(p_key text, p_default bigint)
returns bigint language sql stable as $$
  select coalesce((select (value #>> '{}')::bigint from app_settings where key = p_key), p_default);
$$;

create or replace function setting_bool(p_key text, p_default boolean)
returns boolean language sql stable as $$
  select coalesce((select (value #>> '{}')::boolean from app_settings where key = p_key), p_default);
$$;

-- Click price for a given placement type.
create or replace function click_price_cents(p_type placement_type)
returns bigint language sql stable as $$
  select case p_type
    when 'board' then setting_int('board_click_price_cents', 5)
    when 'spot'  then setting_int('spot_click_price_cents', 5)
    when 'bar'   then setting_int('bar_click_price_cents', 5)
  end;
$$;
