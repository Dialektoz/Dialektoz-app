import { createHash } from 'node:crypto';
import { AwsClient } from 'aws4fetch';

export const R2_ENV = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
];

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export function contentTypeFor(file: string): string {
  const ext = file.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Deterministic object key: the same file always maps to the same key, so
 * re-importing a lesson never duplicates files nor changes their URLs.
 * (src/lib/r2.ts uses a random UUID per upload, which can't be idempotent.)
 */
export function imageKey(file: string, bytes: Uint8Array): string {
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const safe = file
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-80);
  return `lessons/${hash}-${safe || 'image'}`;
}

export function publicUrlFor(publicBase: string, key: string): string {
  return `${publicBase.replace(/\/+$/, '')}/${key}`;
}

export function createR2(env: Record<string, string>) {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });
  const objectUrl = (key: string) =>
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;

  return {
    async exists(key: string): Promise<boolean> {
      const res = await client.fetch(objectUrl(key), { method: 'HEAD' });
      if (res.status === 200) return true;
      if (res.status === 404) return false;
      throw new Error(`R2 HEAD ${key} respondió ${res.status}`);
    },
    async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
      const res = await client.fetch(objectUrl(key), {
        method: 'PUT',
        body: body as unknown as BodyInit,
        headers: { 'Content-Type': contentType },
      });
      if (!res.ok) throw new Error(`R2 PUT ${key} respondió ${res.status}`);
    },
  };
}
