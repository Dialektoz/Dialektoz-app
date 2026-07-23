-- ============================================================
-- Certification: one exam per level, attempts, and certificates.
-- Exams are free and cover levels A1..C1.
-- ============================================================

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null unique references levels(id) on delete cascade,
  title text not null default 'Examen de certificación',
  description text,
  question_count int not null default 10,
  passing_score int not null default 70,
  time_limit_minutes int not null default 20,
  max_attempts int not null default 3,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- `questions` stores only REFERENCES to lesson blocks (lesson_id + block_id),
-- never the correct answers, because students can read their own attempts.
create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references exams(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  score int,
  passed boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists exam_attempts_user_idx on exam_attempts (user_id, exam_id);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id uuid not null references levels(id) on delete cascade,
  serial text not null unique,
  score int not null,
  hours numeric(6,1) not null default 0,
  level_code text not null,
  level_title text not null,
  description text,
  holder_name text,
  issued_at timestamptz not null default now(),
  unique (user_id, level_id)
);

alter table exams enable row level security;
alter table exam_attempts enable row level security;
alter table certificates enable row level security;

drop policy if exists "exams_select" on exams;
create policy "exams_select" on exams
  for select to authenticated
  using (published or public.is_staff());

drop policy if exists "exams_write_staff" on exams;
create policy "exams_write_staff" on exams
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "attempts_select_own" on exam_attempts;
create policy "attempts_select_own" on exam_attempts
  for select to authenticated
  using (auth.uid() = user_id);
-- No client insert/update: attempts are created and graded by API routes
-- running with the service-role key.

drop policy if exists "certificates_select_own" on certificates;
create policy "certificates_select_own" on certificates
  for select to authenticated
  using (auth.uid() = user_id);
-- Public verification goes through verify_certificate() instead of open reads.

-- Seed one exam per published level.
insert into exams (level_id, title, description)
select
  l.id,
  'Examen de certificación ' || l.code,
  'Demuestra tu dominio del nivel ' || l.code || ' — ' || l.title || '.'
from levels l
on conflict (level_id) do nothing;
