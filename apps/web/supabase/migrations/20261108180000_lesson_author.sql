-- Per-lesson author credit.
--
-- `author_name` is the text students see ("Por Josecro"). It is denormalized
-- because profiles RLS blocks students from reading other users' rows, and it
-- keeps the credit if the author's account is later deleted. `author_id` is the
-- account that created the lesson (set to null if that profile is deleted); the
-- credit shown to students is always `author_name`, which staff can change.
--
-- Who may change them is already covered by the existing lessons RLS
-- (lessons_update_staff -> is_staff() -> superadmin/teacher); no policy change.
--
-- Existing lessons stay without an author (nothing is shown for them). To assign
-- one by hand, run in the SQL editor, e.g.:
--   update public.lessons set author_name = 'Josecro'
--   where level_id = (select id from public.levels where lower(code) = 'a1');

alter table public.lessons add column if not exists author_name text;
alter table public.lessons add column if not exists author_id uuid
  references public.profiles(id) on delete set null;

create index if not exists lessons_author_id_idx on public.lessons(author_id);

-- Fill the author on insert from the signed-in user. Same name precedence as
-- getCurrentProfile() in src/utils/supabase/session.ts. With the service role
-- (auth.uid() is null, e.g. the lesson importer) nothing is filled in.
create or replace function public.set_lesson_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.author_id is null then
    NEW.author_id := auth.uid();
  end if;
  if (NEW.author_name is null or NEW.author_name = '') and auth.uid() is not null then
    select coalesce(
             nullif(trim(display_name), ''),
             nullif(trim(full_name), ''),
             nullif(trim(first_name), ''),
             nullif(split_part(coalesce(email, ''), '@', 1), '')
           )
      into NEW.author_name
      from public.profiles
      where id = auth.uid();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_set_lesson_author on public.lessons;
create trigger trg_set_lesson_author
  before insert on public.lessons
  for each row execute function public.set_lesson_author();

-- Trigger function, not an RPC endpoint.
revoke execute on function public.set_lesson_author() from public, anon, authenticated;
