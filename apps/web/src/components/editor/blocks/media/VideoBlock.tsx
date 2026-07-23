'use client';

import { Video as VideoIcon } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

export interface VideoData {
  url: string;
  caption: string;
}

/** True when the URL points to a direct video file we can play with <video>. */
export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

/** Turns common video URLs into an embeddable src. Falls back to the raw URL. */
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`;
    if (host === 'vimeo.com') return `https://player.vimeo.com/video${u.pathname}`;
    return url;
  } catch {
    return null;
  }
}

export const VideoBlock = defineBlock<VideoData>({
  type: 'video',
  label: 'Video',
  description: 'YouTube, Vimeo o URL directa',
  icon: VideoIcon,
  category: 'media',
  keywords: ['video', 'youtube', 'vimeo', 'mp4'],
  createDefault: () => ({ url: '', caption: '' }),
  Editor: ({ data, onChange }) => {
    const embed = toEmbedUrl(data.url);
    return (
      <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
        {isDirectVideo(data.url) ? (
          <video controls src={data.url} className="w-full rounded-lg border border-border bg-black max-h-72" />
        ) : embed ? (
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
            <iframe src={embed} className="w-full h-full" allowFullScreen title="preview" />
          </div>
        ) : (
          <UploadDropzone accept="video/*" label="Arrastra un video o haz clic para subir" onUploaded={(url) => onChange({ ...data, url })} />
        )}
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="…o pega YouTube / Vimeo / URL"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {data.url && <button type="button" onClick={() => onChange({ ...data, url: '' })} className="text-xs text-muted-foreground hover:text-destructive shrink-0">Quitar</button>}
        </div>
        <input
          type="text"
          value={data.caption}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          placeholder="Descripción (opcional)"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    );
  },
  Renderer: ({ data }) => {
    if (isDirectVideo(data.url)) {
      return (
        <figure className="my-6">
          <video controls src={data.url} className="w-full rounded-xl border border-border bg-black" />
          {data.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{data.caption}</figcaption>}
        </figure>
      );
    }
    const embed = toEmbedUrl(data.url);
    if (!embed) return null;
    return (
      <figure className="my-6">
        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black">
          <iframe src={embed} className="w-full h-full" allowFullScreen title={data.caption || 'video'} />
        </div>
        {data.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{data.caption}</figcaption>}
      </figure>
    );
  },
});
