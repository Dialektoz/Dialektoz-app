'use client';

import { useState, useCallback } from 'react';

interface SignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/** Uploads a File to R2 via a presigned URL and reports progress. */
export function useR2Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, folder = 'lessons'): Promise<string | null> => {
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const signRes = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: file.name, size: file.size, folder }),
      });
      if (!signRes.ok) {
        const j = await signRes.json().catch(() => ({}));
        throw new Error(j.error || 'No se pudo iniciar la subida');
      }
      const { uploadUrl, publicUrl } = (await signRes.json()) as SignResponse;

      await putWithProgress(uploadUrl, file, setProgress);
      setProgress(100);
      return publicUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}

function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Fallo de subida (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Error de red durante la subida'));
    xhr.send(file);
  });
}
