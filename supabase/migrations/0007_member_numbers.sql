-- Every account gets a public member number: a small sequential id (#0001,
-- #0002, ...) assigned in signup order. The founding account is #0001. UUIDs
-- remain the real keys; the member number is identity people can see.

create sequence if not exists profiles_member_no_seq;

alter table profiles
  add column if not exists member_no bigint;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from profiles
  where member_no is null
)
update profiles p
   set member_no = o.rn + coalesce((select max(member_no) from profiles), 0)
  from ordered o
 where o.id = p.id;

select setval(
  'profiles_member_no_seq',
  coalesce((select max(member_no) from profiles), 0) + 1,
  false
);

alter table profiles
  alter column member_no set default nextval('profiles_member_no_seq'),
  alter column member_no set not null;

create unique index if not exists profiles_member_no_key on profiles (member_no);
