-- SimplyMed database setup. Paste all of this into Supabase -> SQL Editor -> New query -> Run.
-- Safe to run more than once.
--
-- Row Level Security (RLS) is what keeps data private: each signed-in person can only
-- read and change their own rows. The website's "anon" key cannot get around it.
-- The pasted medical instructions are never stored here.

-- Profile: age (never a birth date) and text size.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  age int check (age between 0 and 120),
  text_scale numeric check (text_scale between 1 and 2),
  updated_at timestamptz not null default now()
);

-- Saved medicines and calendar events. "data" holds the item exactly as the app uses it.
create table if not exists public.medicines (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Feedback from the Feedback page. Anyone can send it (account or not); nobody can read
-- it through the website. Read it in the Supabase Table Editor (Export -> CSV).
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  ease int check (ease between 1 and 5),
  made_sense text check (made_sense in ('yes', 'partly', 'no')),
  page text,
  role text,
  age_group text,
  comments text check (char_length(comments) <= 2000),
  created_at timestamptz not null default now()
);

-- Table access for the website. Projects created with "Automatically expose new tables" off
-- have none by default. Signed-in people get full access to their own rows (RLS below
-- limits it); visitors who are not signed in can only send feedback.
grant select, insert, update, delete on public.profiles, public.medicines, public.events to authenticated;
grant insert on public.feedback to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.events enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own medicines" on public.medicines;
create policy "own medicines" on public.medicines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own events" on public.events;
create policy "own events" on public.events
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Admins: people who can read feedback and make other people admins.
--
-- The checks live here in the database, not in the website, so nobody can make
-- themselves an admin by editing the page. The first admin is added by hand in the
-- SQL Editor (see the README); after that, admins add others from the Admin page.
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  granted_by text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- "Is the signed-in person an admin?" Runs with the table owner's rights so it can
-- read the admins table even though ordinary users cannot.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Make someone an admin by email. Only admins may call it, and the person must
-- already have a SimplyMed account (so nobody can claim an email in advance).
create or replace function public.grant_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  clean_email text := lower(trim(target_email));
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this.';
  end if;
  select id into target_id from auth.users where lower(email) = clean_email;
  if target_id is null then
    raise exception 'No SimplyMed account uses that email. Ask them to create an account first.';
  end if;
  insert into public.admins (user_id, email, granted_by)
  values (target_id, clean_email, (select auth.jwt() ->> 'email'))
  on conflict (user_id) do nothing;
  return clean_email;
end;
$$;

-- Remove an admin. Admins cannot remove themselves, so there is always at least one.
create or replace function public.revoke_admin(target_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this.';
  end if;
  if target_user = (select auth.uid()) then
    raise exception 'You cannot remove yourself. Ask another admin.';
  end if;
  delete from public.admins where user_id = target_user;
end;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.grant_admin(text) from public, anon;
revoke all on function public.revoke_admin(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.grant_admin(text) to authenticated;
grant execute on function public.revoke_admin(uuid) to authenticated;

-- Admins can see the admin list and read feedback. Changes to the admin list only
-- happen through the two functions above.
grant select on public.admins to authenticated;
grant select on public.feedback to authenticated;

drop policy if exists "admins see admins" on public.admins;
create policy "admins see admins" on public.admins
  for select to authenticated using (public.is_admin());

drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback" on public.feedback
  for select to authenticated using (public.is_admin());
