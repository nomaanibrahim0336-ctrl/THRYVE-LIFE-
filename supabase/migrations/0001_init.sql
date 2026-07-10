-- Vitalis initial schema. Mirrors the on-device SQLite tables so the sync engine
-- can push rows 1:1. Row-Level Security ensures every user only ever sees their own data.

create extension if not exists "pgcrypto";

-- MOODS ----------------------------------------------------------------------
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  note text,
  logged_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists idx_moods_user_time on public.moods (user_id, logged_at desc);

-- HABITS ---------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null default '✅',
  archived boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_habits_user on public.habits (user_id);

-- HABIT CHECK-INS ------------------------------------------------------------
create table if not exists public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  day date not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  unique (habit_id, day)
);
create index if not exists idx_checkins_user on public.habit_checkins (user_id, day);

-- ROW LEVEL SECURITY ---------------------------------------------------------
alter table public.moods enable row level security;
alter table public.habits enable row level security;
alter table public.habit_checkins enable row level security;

-- Each policy restricts all operations to rows owned by the authenticated user.
create policy "own moods" on public.moods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own checkins" on public.habit_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
