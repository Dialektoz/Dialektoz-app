-- Superadmin counts as staff for content access. (The founder seed —
-- promoting a specific user to superadmin — is data, applied separately and
-- not versioned here.)
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('superadmin','admin','teacher')
  );
$$;
