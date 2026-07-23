-- Pin search_path on the trigger function (security linter) and stop
-- exposing is_staff() to the anon role.

create or replace function public.set_lesson_order()
returns trigger
language plpgsql
security definer
set search_path = public
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

revoke execute on function public.is_staff() from anon;
