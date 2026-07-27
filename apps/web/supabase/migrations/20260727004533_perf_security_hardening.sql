-- ============================================================
-- PERFORMANCE + SECURITY hardening (grounded in Supabase advisors)
-- ============================================================

-- 1) Cover foreign keys with indexes (hot paths: lessons by level, etc.)
create index if not exists lessons_level_id_idx        on public.lessons(level_id);
create index if not exists user_progress_lesson_id_idx on public.user_progress(lesson_id);
create index if not exists certificates_level_id_idx   on public.certificates(level_id);
create index if not exists exam_attempts_exam_id_idx    on public.exam_attempts(exam_id);
create index if not exists levels_created_by_idx        on public.levels(created_by);

-- 2) Drop the duplicate unique index on user_progress (keep the baseline one)
alter table public.user_progress drop constraint if exists user_progress_user_lesson_unique;

-- 3) RLS init-plan: wrap auth.uid() in a scalar subquery so it is evaluated
--    once per query instead of once per row. Same logic, big win at scale.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "activity_select_own" on public.user_activity;
create policy "activity_select_own" on public.user_activity
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "attempts_select_own" on public.exam_attempts;
create policy "attempts_select_own" on public.exam_attempts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select to authenticated using ((select auth.uid()) = user_id);

-- 4) exams: remove the overlapping FOR ALL policy (it doubled up on SELECT)
--    and replace with write-only policies. SELECT stays on exams_select.
drop policy if exists "exams_write_staff" on public.exams;
create policy "exams_insert_staff" on public.exams
  for insert to authenticated with check (public.is_staff());
create policy "exams_update_staff" on public.exams
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "exams_delete_staff" on public.exams
  for delete to authenticated using (public.is_staff());

-- 5) Trigger functions must NOT be callable as RPC endpoints. They run inside
--    triggers regardless of grants, so revoke public execute.
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.set_lesson_order()  from public, anon, authenticated;
revoke execute on function public.set_level_creator() from public, anon, authenticated;
