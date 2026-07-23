-- The caller's exact rank for a period, so a student outside the visible top
-- still sees where they stand. Returns no row when they opted out.

create or replace function public.get_my_leaderboard_rank(p_period text default 'all')
returns table(rank bigint, xp bigint, total bigint)
language sql
security definer
set search_path = public
stable
as $$
  with scores as (
    select
      p.id,
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
    group by p.id
  ),
  ranked as (
    select id, xp, rank() over (order by xp desc) as rank, count(*) over () as total
    from scores
  )
  select r.rank, r.xp, r.total
  from ranked r
  where r.id = auth.uid();
$$;

revoke all on function public.get_my_leaderboard_rank(text) from public, anon;
grant execute on function public.get_my_leaderboard_rank(text) to authenticated;
