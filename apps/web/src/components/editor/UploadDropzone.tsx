'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useR2Upload } from '@/lib/useR2Upload';

interface UploadDropzoneProps {
  accept?: string;
  label?: string;
  folder?: string;
  onUploaded: (url: string, file: File) => void;
}

export function UploadDropzone({ accept, label = 'Arrastra un archivo o haz clic para subir', folder, onUploaded }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error } = useR2Upload();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const url = await upload(file, folder);
      if (url) onUploaded(url, file);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        disabled={uploading}
        className={`w-full rounded-lg border-2 border-dashed p-5 flex flex-col items-center justify-center gap-2 text-sm transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${uploading ? 'opacity-70' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">Subiendo… {progress}%</span>
          </>
        ) : (
          <>
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
            <span className="text-muted-foreground">{label}</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple={false} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && (
        <p className="mt-2 text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
