/**
 * The skills a lesson can train. Stored in `lessons.skill_type` as a
 * comma-separated string so no DB migration was needed; helpers here
 * parse/format it. A lesson may have several skills.
 */
export const SKILLS = ['Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary'] as const;
export type Skill = (typeof SKILLS)[number];

export function parseSkills(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatSkills(skills: string[]): string {
  return skills.join(', ');
}
