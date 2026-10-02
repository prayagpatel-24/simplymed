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
