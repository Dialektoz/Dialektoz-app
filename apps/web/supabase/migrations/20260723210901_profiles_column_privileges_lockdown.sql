-- ============================================================
-- Privilege escalation fix.
--
-- "Users can update own profile" allowed updating ANY column of your own row,
-- so a student could run
--     update profiles set role = 'admin' where id = auth.uid()
-- and gain full content-management access through is_staff().
--
-- RLS controls WHICH ROWS; column-level grants control WHICH COLUMNS.
-- Admin role changes still work: that path uses the service-role key.
-- ============================================================

revoke insert, update on public.profiles from authenticated, anon;

grant insert (
  id, first_name, last_name, phone, full_name, display_name,
  avatar_url, timezone, leaderboard_opt_in, onboarding_completed
) on public.profiles to authenticated;

grant update (
  first_name, last_name, phone, full_name, display_name,
  avatar_url, timezone, leaderboard_opt_in, onboarding_completed
) on public.profiles to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
