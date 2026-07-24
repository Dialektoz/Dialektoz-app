-- 18+ policy (MVP): store birth_date so registration can block minors.
alter table public.profiles add column if not exists birth_date date;

-- Self-service column: users may set their own birth date.
grant insert (birth_date) on public.profiles to authenticated;
grant update (birth_date) on public.profiles to authenticated;

-- Level cover/icon image (uploaded to Cloudflare R2).
alter table public.levels add column if not exists icon_url text;
