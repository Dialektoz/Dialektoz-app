-- Every lesson now has two parts:
--   content -> study material (may include free practice activities)
--   quiz    -> the graded evaluation; feeds the level certification exam
alter table lessons add column if not exists quiz jsonb not null default '[]'::jsonb;
