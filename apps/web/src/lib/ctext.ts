/**
 * Colorable-text helpers — pure, no React, safe to import on the server
 * (e.g. the exam grading engine) as well as in client block components.
 *
 * A colorable text is either legacy plain `string` content or an object with
 * the text plus an optional color. These helpers normalize either shape so
 * grading and rendering never have to care which one is stored.
 */

export type CText = string | { t: string; c?: string };

export function ctText(v: CText | null | undefined): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : v.t ?? '';
}

export function ctColor(v: CText | null | undefined): string | undefined {
  if (v == null || typeof v === 'string') return undefined;
  return v.c || undefined;
}

/** Build a normalized value, dropping the color wrapper when there is no color. */
export function mkCT(text: string, color?: string): CText {
  return color ? { t: text, c: color } : text;
}
