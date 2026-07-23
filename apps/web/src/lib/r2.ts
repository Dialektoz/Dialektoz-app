import { AwsClient } from 'aws4fetch';

/**
 * Cloudflare R2 upload helper (server-only).
 *
 * Media/files are stored in R2 (not Supabase Storage). The browser uploads
 * directly to R2 using a short-lived presigned PUT URL generated here, so
 * large audio/video never passes through the serverless function.
 *
 * Required env vars (server-only, no NEXT_PUBLIC prefix):
 *   R2_ACCOUNT_ID          Cloudflare account id
 *   R2_ACCESS_KEY_ID       R2 API token access key id
 *   R2_SECRET_ACCESS_KEY   R2 API token secret
 *   R2_BUCKET              bucket name
 *   R2_PUBLIC_BASE_URL     public base url (r2.dev or custom domain), no trailing slash
 */

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
} = process.env;

export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_BASE_URL
  );
}

/** Sanitize a filename and prefix it with a folder + uuid to avoid collisions. */
export function buildKey(filename: string, folder = 'lessons'): string {
  const safe = (filename || 'file')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${folder}/${crypto.randomUUID()}-${safe || 'file'}`;
}

export function publicUrl(key: string): string {
  return `${(R2_PUBLIC_BASE_URL || '').replace(/\/$/, '')}/${key}`;
}

/** Generate a presigned PUT url the browser can upload to for `expiresIn` seconds. */
export async function presignPut(key: string, expiresIn = 3600): Promise<string> {
  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  });

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;
  const url = new URL(endpoint);
  url.searchParams.set('X-Amz-Expires', String(expiresIn));

  // Presign as a query-signed URL (host is the only signed header, so the
  // browser may freely set Content-Type on the PUT).
  const signed = await client.sign(url.toString(), {
    method: 'PUT',
    aws: { signQuery: true },
  });
  return signed.url;
}
