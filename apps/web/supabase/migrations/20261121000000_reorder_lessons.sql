-- Reorder the lessons of a level in one atomic step.
--
-- The admin list sends the lesson ids in the order they should have; the function
-- renumbers `"order"` as 1..n (which also cleans up gaps/duplicates). It is
-- SECURITY INVOKER on purpose: the existing RLS policy `lessons_update_staff`
-- (is_staff()) decides who may do this, so no privilege is escalated.
--
-- Rules:
--   * the list must be EXACTLY the lessons of the level (no repeats, no strangers,
--     none missing), so a stale page can't renumber a level that changed meanwhile;
--   * if RLS hid or blocked any row, the whole call fails (nothing is changed).
-- Idempotent: safe to run more than once.

create or replace function public.reorder_lessons(p_level_id uuid, p_lesson_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected int;
  v_given    int := coalesce(array_length(p_lesson_ids, 1), 0);
  v_updated  int;
begin
  -- Serialize with other reorders/inserts on this level while we validate and write.
  perform 1 from public.lessons where level_id = p_level_id order by id for update;

  select count(*) into v_expected from public.lessons where level_id = p_level_id;

  if v_given = 0
     or v_given <> v_expected
     or (select count(distinct x) from unnest(p_lesson_ids) as x) <> v_given
     or exists (
       select 1 from unnest(p_lesson_ids) as x
       where not exists (select 1 from public.lessons l where l.id = x and l.level_id = p_level_id)
     )
  then
    raise exception 'La lista no coincide con las lecciones del nivel' using errcode = '22023';
  end if;

  update public.lessons l
     set "order" = o.pos
    from unnest(p_lesson_ids) with ordinality as o(id, pos)
   where l.id = o.id
     and l.level_id = p_level_id;

  get diagnostics v_updated = row_count;
  if v_updated <> v_given then
    raise exception 'No se pudo guardar el orden (permisos o el nivel cambió)' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.reorder_lessons(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_lessons(uuid, uuid[]) to authenticated;

-- ── Verification (run after applying) ────────────────────────────────────────
-- select proname, prosecdef from pg_proc where proname = 'reorder_lessons';
-- Expected: one row, prosecdef = false (SECURITY INVOKER).
