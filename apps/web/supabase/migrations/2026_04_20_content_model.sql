-- Levels: add ordering and publish state
ALTER TABLE levels ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Lessons: skill (free text, defined by teacher), description, publish, duration
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS skill_type TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Student progress on lessons
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  score INT,
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON user_lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own progress"
  ON user_lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON user_lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);
