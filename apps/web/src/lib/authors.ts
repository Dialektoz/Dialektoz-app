/**
 * Author credits derived from `lessons.author_name`.
 *
 * Authorship is explicit (a lesson's credited author), never inferred from who
 * edited it last. A level's credits are just the lessons' authors grouped by
 * name, so the "main" author is whoever wrote the most lessons.
 */
export interface AuthorCredit {
  name: string;
  count: number;
}

/** Group lesson authors by name (case/whitespace-insensitive), most lessons first. */
export function summarizeAuthors(names: Array<string | null | undefined>): AuthorCredit[] {
  const byKey = new Map<string, AuthorCredit>();
  for (const raw of names) {
    const name = raw?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = byKey.get(key);
    if (existing) existing.count++;
    else byKey.set(key, { name, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** "Autor: Josecro" or "Autores: Josecro (12 lecciones), Ana (1 lección)"; null when nobody is credited. */
export function formatAuthorLine(credits: AuthorCredit[]): string | null {
  if (credits.length === 0) return null;
  if (credits.length === 1) return `Autor: ${credits[0].name}`;
  const parts = credits.map((c) => `${c.name} (${c.count} ${c.count === 1 ? 'lección' : 'lecciones'})`);
  return `Autores: ${parts.join(', ')}`;
}
