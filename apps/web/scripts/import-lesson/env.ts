import { existsSync, readFileSync } from 'node:fs';

/** Load KEY=VALUE pairs from an env file into process.env (never overrides existing variables). */
export function loadEnvFile(path: string): boolean {
  if (!existsSync(path)) return false;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return true;
}

/** Return the requested variables, or the list of missing NAMES (values are never printed). */
export function readEnv(names: string[]): { values: Record<string, string>; missing: string[] } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of names) {
    const v = process.env[name];
    if (v) values[name] = v;
    else missing.push(name);
  }
  return { values, missing };
}
