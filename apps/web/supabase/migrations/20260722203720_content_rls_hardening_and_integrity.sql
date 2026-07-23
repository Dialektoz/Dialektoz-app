-- Content RLS hardening + integrity fixes.
-- levels/lessons were writable by ANY authenticated user; restrict to staff.

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','teacher')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- LEVELS
drop policy if exists "Enable insert levels"                   on levels;
drop policy if exists "Enable update levels"                   on levels;
drop policy if exists "Enable delete levels"                   on levels;
drop policy if exists "Enable read access for all auth users"  on levels;

create policy "levels_select" on levels
  for select to authenticated
  using (published = true or public.is_staff());

create policy "levels_insert_staff" on levels
  for insert to authenticated with check (public.is_staff());

create policy "levels_update_staff" on levels
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "levels_delete_staff" on levels
  for delete to authenticated using (public.is_staff());

-- LESSONS
drop policy if exists "Enable insert lessons"                  on lessons;
drop policy if exists "Enable update lessons"                  on lessons;
drop policy if exists "Enable delete lessons"                  on lessons;
drop policy if exists "Enable read access for all auth users"  on lessons;

create policy "lessons_select" on lessons
  for select to authenticated
  using (
    public.is_staff()
    or (
      published = true
      and exists (select 1 from levels l where l.id = lessons.level_id and l.published = true)
    )
  );

create policy "lessons_insert_staff" on lessons
  for insert to authenticated with check (public.is_staff());

create policy "lessons_update_staff" on lessons
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "lessons_delete_staff" on lessons
  for delete to authenticated using (public.is_staff());

-- lessons.content must be a JSON array of blocks
update lessons set content = '[]'::jsonb
  where content is null or jsonb_typeof(content) <> 'array';
alter table lessons alter column content set default '[]'::jsonb;

-- Auto-assign lesson order (fixes "everything is order 1")
create or replace function public.set_lesson_order()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    select coalesce(max("order"), 0) + 1
      into NEW."order"
      from public.lessons
      where level_id = NEW.level_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_set_lesson_order on lessons;
create trigger trg_set_lesson_order
  before insert on lessons
  for each row execute function public.set_lesson_order();

-- Deduplicate progress tables: keep user_progress
drop table if exists public.user_lesson_progress;
