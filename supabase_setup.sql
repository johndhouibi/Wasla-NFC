-- =====================================================================
-- Wasla NFC: Supabase security setup. Safe to re-run.
-- 1) Replace YOUR_ADMIN_EMAIL below with the email of your admin user.
-- 2) Paste into Supabase > SQL Editor > Run.
-- =====================================================================

-- Make sure the columns the app uses exist (no-op if they already do)
alter table businesses add column if not exists tagline text;
alter table businesses add column if not exists city text;
alter table businesses add column if not exists accent_color text default '#D97706';
alter table businesses add column if not exists google_place_id text;
alter table businesses add column if not exists instagram_handle text;
alter table businesses add column if not exists whatsapp_number text;
alter table analytics_events add column if not exists feedback_message text;

-- Only this email counts as admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'YOUR_ADMIN_EMAIL'
$$;

alter table businesses       enable row level security;
alter table cards            enable row level security;
alter table analytics_events enable row level security;

-- businesses: public can read (needed by the tap page), only admin can write
drop policy if exists "businesses public read" on businesses;
drop policy if exists "businesses admin write" on businesses;
create policy "businesses public read" on businesses
  for select to anon, authenticated using (true);
create policy "businesses admin write" on businesses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- cards: same
drop policy if exists "cards public read" on cards;
drop policy if exists "cards admin write" on cards;
create policy "cards public read" on cards
  for select to anon, authenticated using (true);
create policy "cards admin write" on cards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- analytics_events: anyone can add an event, only admin can read or change them
drop policy if exists "events public insert" on analytics_events;
drop policy if exists "events admin all" on analytics_events;
create policy "events public insert" on analytics_events
  for insert to anon, authenticated with check (true);
create policy "events admin all" on analytics_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
