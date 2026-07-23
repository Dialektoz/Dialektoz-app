-- Fall back to 'Estudiante' when a profile has neither name nor email.

create or replace function public.get_leaderboard(limit_count int default 10)
returns table(user_id uuid, name text, xp bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(
      nullif(trim(p.full_name), ''),
      nullif(split_part(coalesce(p.email, ''), '@', 1), ''),
      'Estudiante'
    ) as name,
    coalesce(sum(case when up.status = 'completed' then 50 + coalesce(up.score, 0) else 0 end), 0)::bigint as xp
  from public.profiles p
  left join public.user_progress up on up.user_id = p.id
  group by p.id, p.full_name, p.email
  order by xp desc, name asc
  limit greatest(limit_count, 1);
$$;
