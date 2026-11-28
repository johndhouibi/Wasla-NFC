-- =====================================================================
-- Wasla NFC: owner dashboard setup. Run once in Supabase > SQL Editor.
-- Safe to re-run. Requires the earlier setup (public.is_admin()).
-- =====================================================================

-- Which email owns which business (kept private: not readable by customers)
create table if not exists public.business_owners (
  id bigint generated always as identity primary key,
  business_id text not null,
  email text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists business_owners_unique
  on public.business_owners (business_id, lower(email));

-- Who carries each card (crew member name), kept private as well
create table if not exists public.card_holders (
  card_id text primary key,
  holder_name text,
  updated_at timestamptz not null default now()
);

-- The business ids that belong to the signed-in user
create or replace function public.my_business_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.business_owners
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;
revoke all on function public.my_business_ids() from public, anon;
grant execute on function public.my_business_ids() to authenticated;

alter table public.business_owners enable row level security;
alter table public.card_holders    enable row level security;

-- business_owners: admin manages, an owner can only see their own rows
drop policy if exists "owners admin all" on public.business_owners;
drop policy if exists "owners read own"  on public.business_owners;
create policy "owners admin all" on public.business_owners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "owners read own" on public.business_owners
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- card_holders: admin manages, an owner can read holders of their own cards
drop policy if exists "holders admin all"  on public.card_holders;
drop policy if exists "holders owner read" on public.card_holders;
create policy "holders admin all" on public.card_holders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "holders owner read" on public.card_holders
  for select to authenticated
  using (exists (
    select 1 from public.cards c
    where c.id::text = card_holders.card_id
      and c.business_id::text in (select public.my_business_ids())
  ));

-- analytics_events: an owner can read events of their own businesses only
drop policy if exists "events owner read" on public.analytics_events;
create policy "events owner read" on public.analytics_events
  for select to authenticated
  using (business_id::text in (select public.my_business_ids()));

-- Owners can rename a card's placement and set who carries it, nothing else
create or replace function public.owner_set_card_details(p_card_id text, p_holder text, p_label text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.cards c
    where c.id::text = p_card_id
      and c.business_id::text in (select public.my_business_ids())
  ) then
    raise exception 'not allowed';
  end if;

  if nullif(trim(coalesce(p_label, '')), '') is not null then
    update public.cards set label = trim(p_label) where id::text = p_card_id;
  end if;

  insert into public.card_holders (card_id, holder_name)
  values (p_card_id, nullif(trim(coalesce(p_holder, '')), ''))
  on conflict (card_id) do update
    set holder_name = excluded.holder_name, updated_at = now();
end
$$;
revoke all on function public.owner_set_card_details(text, text, text) from public, anon;
grant execute on function public.owner_set_card_details(text, text, text) to authenticated;
