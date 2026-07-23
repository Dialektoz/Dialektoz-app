-- Denormalize the level creator (profiles RLS blocks students from reading
-- other users' rows) and allow progress to be upserted.

alter table levels add column if not exists created_by uuid references profiles(id);
alter table levels add column if not exists creator_name text;

create or replace function public.set_level_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.created_by is null then
    NEW.created_by := auth.uid();
  end if;
  if NEW.creator_name is null or NEW.creator_name = '' then
    select coalesce(nullif(full_name, ''), split_part(coalesce(email, ''), '@', 1))
      into NEW.creator_name
      from public.profiles
      where id = auth.uid();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_set_level_creator on levels;
create trigger trg_set_level_creator
  before insert on levels
  for each row execute function public.set_level_creator();

alter table user_progress drop constraint if exists user_progress_user_lesson_unique;
alter table user_progress add constraint user_progress_user_lesson_unique unique (user_id, lesson_id);
