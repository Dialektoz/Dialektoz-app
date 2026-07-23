-- Cross-user leaderboard. SECURITY DEFINER because profiles RLS blocks
-- students from reading other users' rows. Exposes only a name + XP.
-- (Superseded by 20260723204623_leaderboard_privacy_and_periods.sql.)

create or replace function public.get_leaderboard(limit_count int default 10)
returns table(user_id uuid, name text, xp bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(nullif(p.full_name, ''), split_part(coalesce(p.email, ''), '@', 1), 'Estudiante') as name,
    coalesce(sum(case when up.status = 'completed' then 50 + coalesce(up.score, 0) else 0 end), 0)::bigint as xp
  from public.profiles p
  left join public.user_progress up on up.user_id = p.id
  group by p.id, p.full_name, p.email
  order by xp desc, name asc
  limit greatest(limit_count, 1);
$$;

revoke all on function public.get_leaderboard(int) from public, anon;
grant execute on function public.get_leaderboard(int) to authenticated;
