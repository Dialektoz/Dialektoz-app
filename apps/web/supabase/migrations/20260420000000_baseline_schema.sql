-- ============================================================================
-- BASELINE — everything that existed before this repo started tracking
-- migrations (2026-07-22).
--
-- These objects were originally created straight from the Supabase SQL editor
-- / dashboard, so they were never captured in a file. This baseline
-- reconstructs them from the live schema so the database can be recreated
-- from scratch in a new project.
--
-- Every statement is idempotent: running it against the existing project is a
-- no-op.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('admin', 'teacher', 'premium', 'free', 'student_premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Columns added later (timezone, display_name, leaderboard_opt_in) live in
-- their own migrations further down the history.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  first_name text,
  last_name text,
  phone text,
  onboarding_completed boolean default false,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role default 'free'
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Creates the profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (
    id, email, full_name, avatar_url, role,
    first_name, last_name, phone, onboarding_completed
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free'::public.user_role,
    '', '', '', false
  );
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Content model ───────────────────────────────────────────────────────────
create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now(),
  order_index int default 0,
  published boolean default false
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels(id) on delete cascade,
  title text not null,
  "order" int not null default 1,
  content jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  skill_type text,
  description text,
  published boolean default false,
  duration_minutes int
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.progress_status default 'not_started',
  score int default 0,
  last_accessed_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, lesson_id)
);

alter table public.levels enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;
