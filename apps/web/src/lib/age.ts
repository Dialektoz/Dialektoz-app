/** Age in whole years from a 'YYYY-MM-DD' birth date. */
export function ageFrom(birthDate: string): number {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** MVP policy: registration is limited to users 18 or older. */
export const MIN_AGE = 18;

export function isAdult(birthDate: string): boolean {
  const age = ageFrom(birthDate);
  return !Number.isNaN(age) && age >= MIN_AGE;
}

/** Max selectable birth date for an 18+ gate (today minus 18 years). */
export function maxBirthDateFor18(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}
