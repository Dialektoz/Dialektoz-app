-- Public verification by serial. A SECURITY DEFINER function keeps the
-- certificates table closed while letting anyone holding the serial (an
-- employer, for instance) confirm the certificate is genuine.

create or replace function public.verify_certificate(p_serial text)
returns table(
  serial text,
  holder_name text,
  level_code text,
  level_title text,
  description text,
  hours numeric,
  score int,
  issued_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.serial, c.holder_name, c.level_code, c.level_title,
         c.description, c.hours, c.score, c.issued_at
  from public.certificates c
  where upper(trim(c.serial)) = upper(trim(p_serial));
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Total study hours of a level (sum of its published lessons' durations).
create or replace function public.level_hours(p_level_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select round(coalesce(sum(duration_minutes), 0) / 60.0, 1)
  from public.lessons
  where level_id = p_level_id and published;
$$;

grant execute on function public.level_hours(uuid) to authenticated;
