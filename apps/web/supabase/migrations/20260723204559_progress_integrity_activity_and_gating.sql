-- ============================================================
-- Progress integrity, daily activity log and sequential gating.
--
-- Before this, RLS let any student write their own user_progress rows
-- (score/status) straight from the browser, so XP, leaderboards and any
-- future certificate were forgeable.
-- ============================================================

alter table profiles add column if not exists timezone text not null default 'America/Bogota';
alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists leaderboard_opt_in boolean not null default true;

create table if not exists user_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  xp_earned int not null default 0,
  lessons_completed int not null default 0,
  minutes int not null default 0,
  primary key (user_id, activity_date)
);

create index if not exists user_activity_date_idx on user_activity (activity_date, user_id);

alter table user_activity enable row level security;

drop policy if exists "activity_select_own" on user_activity;
create policy "activity_select_own" on user_activity
  for select to authenticated
  using (auth.uid() = user_id);
-- No insert/update policies on purpose: only the SECURITY DEFINER RPC writes.

-- Backfill from lessons already completed (aggregated per user + day).
insert into user_activity (user_id, activity_date, xp_earned, lessons_completed, minutes)
select
  up.user_id,
  (coalesce(up.last_accessed_at, up.created_at, now()))::date as activity_date,
  sum(50 + coalesce(up.score, 0))::int,
  count(*)::int,
  sum(coalesce(l.duration_minutes, 0))::int
from user_progress up
join lessons l on l.id = up.lesson_id
where up.status = 'completed'
group by up.user_id, (coalesce(up.last_accessed_at, up.created_at, now()))::date
on conflict (user_id, activity_date) do update
  set xp_earned = user_activity.xp_earned + excluded.xp_earned,
      lessons_completed = user_activity.lessons_completed + excluded.lessons_completed,
      minutes = user_activity.minutes + excluded.minutes;

-- Server-validated progress writer.
create or replace function public.record_progress(
  p_lesson_id uuid,
  p_status progress_status,
  p_score int default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_prev    progress_status;
  v_score   int;
  v_level   uuid;
  v_order   int;
  v_minutes int;
  v_tz      text;
  v_day     date;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;

  select l.level_id, l."order", coalesce(l.duration_minutes, 0)
    into v_level, v_order, v_minutes
  from lessons l
  join levels lv on lv.id = l.level_id
  where l.id = p_lesson_id and l.published and lv.published;

  if v_level is null then
    raise exception 'La lección no está disponible';
  end if;

  v_score := greatest(0, least(100, coalesce(p_score, 0)));

  -- Sequential gating: all earlier lessons of the level must be completed.
  if p_status = 'completed' and exists (
    select 1 from lessons prev
    where prev.level_id = v_level
      and prev.published
      and prev."order" < v_order
      and not exists (
        select 1 from user_progress up
        where up.user_id = v_user and up.lesson_id = prev.id and up.status = 'completed'
      )
  ) then
    raise exception 'Debes completar las lecciones anteriores primero';
  end if;

  select status into v_prev from user_progress
  where user_id = v_user and lesson_id = p_lesson_id;

  insert into user_progress (user_id, lesson_id, status, score, last_accessed_at)
  values (v_user, p_lesson_id, p_status, v_score, now())
  on conflict (user_id, lesson_id) do update
    set status = case when user_progress.status = 'completed' then 'completed' else excluded.status end,
        score  = greatest(coalesce(user_progress.score, 0), excluded.score),
        last_accessed_at = now();

  select coalesce(timezone, 'UTC') into v_tz from profiles where id = v_user;
  v_day := (now() at time zone coalesce(v_tz, 'UTC'))::date;

  if p_status = 'completed' and coalesce(v_prev, 'not_started') <> 'completed' then
    insert into user_activity (user_id, activity_date, xp_earned, lessons_completed, minutes)
    values (v_user, v_day, 50 + v_score, 1, v_minutes)
    on conflict (user_id, activity_date) do update
      set xp_earned = user_activity.xp_earned + excluded.xp_earned,
          lessons_completed = user_activity.lessons_completed + excluded.lessons_completed,
          minutes = user_activity.minutes + excluded.minutes;
  else
    insert into user_activity (user_id, activity_date)
    values (v_user, v_day)
    on conflict (user_id, activity_date) do nothing;
  end if;
end;
$$;

revoke all on function public.record_progress(uuid, progress_status, int) from public, anon;
grant execute on function public.record_progress(uuid, progress_status, int) to authenticated;

-- user_progress becomes read-only for clients.
drop policy if exists "Users can manage their own progress" on user_progress;
drop policy if exists "progress_select_own" on user_progress;

create policy "progress_select_own" on user_progress
  for select to authenticated
  using (auth.uid() = user_id);
