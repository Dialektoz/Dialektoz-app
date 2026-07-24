-- Founder-level role: irrevocable, total access, the only role that can
-- create/remove admins and other superadmins.
-- ADD VALUE must run in its own transaction before the value can be used.
alter type public.user_role add value if not exists 'superadmin';
