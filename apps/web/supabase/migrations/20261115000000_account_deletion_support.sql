-- Account deletion + email-change support.
--
-- Before this, `auth.admin.deleteUser` failed: profiles.id -> auth.users had no
-- ON DELETE action and levels.created_by -> profiles had none either (a teacher
-- who created a level could never be deleted). Certificates cascaded away,
-- which would break public verification of already-issued credentials.
--
-- The baseline tables were originally created by hand in the SQL editor, so the
-- foreign keys are located by table/column instead of by an assumed name.
-- Idempotent: safe to run more than once.

-- Certificates survive their owner (anonymized by the trigger below), so /verify keeps
-- working for credentials already issued; the FK below sets user_id to null.
alter table public.certificates alter column user_id drop not null;

-- One self-contained block (no helper objects): for each FK, drop whatever constraint
-- exists on that table/column and recreate it with the wanted ON DELETE action.
--   profiles.id          -> auth.users  : CASCADE  (a profile goes away with its user)
--   levels.created_by    -> profiles    : SET NULL (the creator can be deleted; creator_name stays as text)
--   certificates.user_id -> auth.users  : SET NULL (kept, anonymized)
do $$
declare
  spec record;
  c record;
begin
  for spec in
    select * from (values
      ('profiles',     'id',         'auth.users'::regclass,     'profiles_id_fkey',
         'foreign key (id) references auth.users(id) on delete cascade'),
      ('levels',       'created_by', 'public.profiles'::regclass, 'levels_created_by_fkey',
         'foreign key (created_by) references public.profiles(id) on delete set null'),
      ('certificates', 'user_id',    'auth.users'::regclass,     'certificates_user_id_fkey',
         'foreign key (user_id) references auth.users(id) on delete set null')
    ) as v(tbl, col, ref, newname, def)
  loop
    for c in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
      where con.contype = 'f'
        and ns.nspname = 'public'
        and rel.relname = spec.tbl
        and att.attname = spec.col
        and con.confrelid = spec.ref
    loop
      execute format('alter table public.%I drop constraint %I', spec.tbl, c.conname);
    end loop;

    execute format('alter table public.%I add constraint %I %s', spec.tbl, spec.newname, spec.def);
  end loop;
end $$;

-- 4) Anonymize the holder name BEFORE the user row is deleted. BEFORE triggers
--    run before the referential actions (cascade / set null), in the same
--    transaction, so the name can never survive a successful deletion.
create or replace function public.anonymize_certificates_on_user_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.certificates set holder_name = 'Titular eliminado' where user_id = OLD.id;
  return OLD;
end;
$$;

drop trigger if exists trg_anonymize_certificates_on_user_delete on auth.users;
create trigger trg_anonymize_certificates_on_user_delete
  before delete on auth.users
  for each row execute function public.anonymize_certificates_on_user_delete();

-- 5) Keep profiles.email in sync when the auth email changes (profiles.email is
--    what the app, the leaderboard fallback and the exam holder name read).
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.email is distinct from OLD.email then
    update public.profiles set email = NEW.email where id = NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Trigger functions, not RPC endpoints.
revoke execute on function public.anonymize_certificates_on_user_delete() from public, anon, authenticated;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;

-- ── Verification (run after applying) ────────────────────────────────────────
-- select conrelid::regclass as tabla, conname, confdeltype   -- 'c' = cascade, 'n' = set null
--   from pg_constraint
--  where conname in ('profiles_id_fkey', 'levels_created_by_fkey', 'certificates_user_id_fkey');
-- Expected: profiles_id_fkey = c, levels_created_by_fkey = n, certificates_user_id_fkey = n.
--
-- select tgname from pg_trigger
--  where tgrelid = 'auth.users'::regclass and not tgisinternal;
-- Expected to include: trg_anonymize_certificates_on_user_delete, on_auth_user_email_changed
-- (and the existing on_auth_user_created).
