-- Public identity moves from member numbers to editable usernames. Member
-- numbers stay in the database for internal/historical use; the username is
-- what people see. Uniqueness is case-insensitive, format is 3-24 characters
-- of letters, digits, underscore, or period.

alter table profiles add column if not exists username text;

-- Backfill one row at a time so uniqueness resolves deterministically:
-- the email's local part when it fits the rules and is free, otherwise
-- "member<N>", which is always unique because member numbers are.
do $$
declare
  r record;
  base text;
begin
  for r in
    select p.id, p.member_no, u.email
    from profiles p
    join auth.users u on u.id = p.id
    where p.username is null
    order by p.member_no
  loop
    base := lower(regexp_replace(split_part(coalesce(r.email, ''), '@', 1),
                                 '[^A-Za-z0-9_.]', '', 'g'));
    base := left(base, 24);
    if length(base) < 3
       or base !~ '^[A-Za-z0-9_.]{3,24}$'
       or exists (select 1 from profiles p2 where lower(p2.username) = base) then
      base := 'member' || r.member_no;
    end if;
    update profiles set username = base where id = r.id;
  end loop;
end $$;

-- Any insert that doesn't choose a username gets a safe unique default, so
-- older code paths and tooling keep working.
create or replace function profiles_default_username()
returns trigger language plpgsql as $$
begin
  if new.username is null then
    new.username := 'member' || new.member_no;
  end if;
  return new;
end $$;
alter function profiles_default_username() set search_path = public, pg_temp;
drop trigger if exists profiles_username_default on profiles;
create trigger profiles_username_default
  before insert on profiles
  for each row execute function profiles_default_username();

alter table profiles alter column username set not null;
create unique index if not exists profiles_username_key on profiles (lower(username));
alter table profiles
  add constraint profiles_username_format check (username ~ '^[A-Za-z0-9_.]{3,24}$');
