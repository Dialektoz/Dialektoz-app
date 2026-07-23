-- Leaderboard: weekly/monthly/global periods, privacy opt-in, and XP sourced
-- from the activity log so period filtering is possible.

drop function if exists public.get_leaderboard(int);

create or replace function public.get_leaderboard(
  limit_count int default 10,
  p_period text default 'all'   -- 'all' | 'week' | 'month'
)
returns table(user_id uuid, name text, xp bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(p.full_name), ''),
      nullif(split_part(coalesce(p.email, ''), '@', 1), ''),
      'Estudiante'
    ) as name,
    coalesce(sum(a.xp_earned), 0)::bigint as xp
  from public.profiles p
  left join public.user_activity a
    on a.user_id = p.id
   and (
        p_period = 'all'
     or (p_period = 'week'  and a.activity_date >= current_date - interval '7 days')
     or (p_period = 'month' and a.activity_date >= current_date - interval '30 days')
   )
  where coalesce(p.leaderboard_opt_in, true)
  group by p.id, p.display_name, p.full_name, p.email
  order by xp desc, name asc
  limit greatest(limit_count, 1);
$$;

revoke all on function public.get_leaderboard(int, text) from public, anon;
grant execute on function public.get_leaderboard(int, text) to authenticated;
