-- Hardening pass, driven by Supabase's security advisors.
-- Applied to production 2026-08-21 via MCP; kept in source control so any
-- rebuild of the database includes it. Pins function search_path, revokes
-- PostgREST execution of internal functions, makes public_* views
-- invoker-security with no client grants (the app reads them server-side).
-- is_admin() keeps EXECUTE because RLS policies evaluate it.

alter function setting_int(text, bigint)              set search_path = public, pg_temp;
alter function setting_bool(text, boolean)            set search_path = public, pg_temp;
alter function click_price_cents(placement_type)      set search_path = public, pg_temp;
alter function wallet_total_credit_cents(uuid)        set search_path = public, pg_temp;
alter function ledger_append(uuid, bigint, ledger_type, bigint, bigint, text, uuid, text, jsonb)
                                                      set search_path = public, pg_temp;
alter function ensure_wallet(uuid)                    set search_path = public, pg_temp;
alter function ensure_current_round()                 set search_path = public, pg_temp;
alter function close_round_and_open_next()            set search_path = public, pg_temp;
alter function apply_stripe_topup(uuid, text, text, bigint, text)
                                                      set search_path = public, pg_temp;
alter function allocate_to_placement(uuid, uuid, placement_type, bigint)
                                                      set search_path = public, pg_temp;
alter function release_placement_credit(uuid, uuid, bigint)
                                                      set search_path = public, pg_temp;
alter function admin_adjust_credit(uuid, uuid, bigint, text)
                                                      set search_path = public, pg_temp;
alter function record_click(uuid, text, text, text, uuid, uuid, uuid, text)
                                                      set search_path = public, pg_temp;
alter function bar_sync()                             set search_path = public, pg_temp;
alter function schedule_spot_day(uuid)                set search_path = public, pg_temp;
alter function current_spot()                         set search_path = public, pg_temp;

revoke execute on function setting_int(text, bigint)              from public, anon, authenticated;
revoke execute on function setting_bool(text, boolean)            from public, anon, authenticated;
revoke execute on function click_price_cents(placement_type)      from public, anon, authenticated;
revoke execute on function wallet_total_credit_cents(uuid)        from public, anon, authenticated;
revoke execute on function ledger_append(uuid, bigint, ledger_type, bigint, bigint, text, uuid, text, jsonb)
                                                                  from public, anon, authenticated;
revoke execute on function ensure_wallet(uuid)                    from public, anon, authenticated;
revoke execute on function ensure_current_round()                 from public, anon, authenticated;
revoke execute on function close_round_and_open_next()            from public, anon, authenticated;
revoke execute on function apply_stripe_topup(uuid, text, text, bigint, text)
                                                                  from public, anon, authenticated;
revoke execute on function allocate_to_placement(uuid, uuid, placement_type, bigint)
                                                                  from public, anon, authenticated;
revoke execute on function release_placement_credit(uuid, uuid, bigint)
                                                                  from public, anon, authenticated;
revoke execute on function admin_adjust_credit(uuid, uuid, bigint, text)
                                                                  from public, anon, authenticated;
revoke execute on function record_click(uuid, text, text, text, uuid, uuid, uuid, text)
                                                                  from public, anon, authenticated;
revoke execute on function bar_sync()                             from public, anon, authenticated;
revoke execute on function schedule_spot_day(uuid)                from public, anon, authenticated;
revoke execute on function current_spot()                         from public, anon, authenticated;

alter view public_board set (security_invoker = true);
alter view public_bar   set (security_invoker = true);
alter view public_spot  set (security_invoker = true);

revoke select on public_board, public_bar, public_spot from anon, authenticated;
