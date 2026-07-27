-- Corrected RBAC (owner's definitive matrix):
-- Admin manages users/memberships only — NOT content.
-- Content management is superadmin + teacher.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('superadmin','teacher')
  );
$$;
