'use client';

import { FileDown, FileText } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

export interface FileData {
  url: string;
  name: string;
  showPreview: boolean;
}

const isPdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);

export const FileBlock = defineBlock<FileData>({
  type: 'file',
  label: 'Archivo / PDF',
  description: 'Documento descargable',
  icon: FileDown,
  category: 'media',
  keywords: ['archivo', 'file', 'pdf', 'descargar', 'documento', 'download'],
  createDefault: () => ({ url: '', name: '', showPreview: true }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      {!data.url ? (
        <UploadDropzone
          label="Arrastra un PDF o archivo, o haz clic para subir"
          onUploaded={(url, file) => onChange({ ...data, url, name: data.name || file.name })}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="Nombre visible del archivo" className="flex-1 bg-transparent outline-none text-sm font-medium" />
          <button type="button" onClick={() => onChange({ ...data, url: '', name: '' })} className="text-xs text-muted-foreground hover:text-destructive">Quitar</button>
        </div>
      )}
      {data.url && isPdf(data.url) && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={data.showPreview} onChange={(e) => onChange({ ...data, showPreview: e.target.checked })} className="accent-primary" />
          Mostrar vista previa del PDF incrustada
        </label>
      )}
    </div>
  ),
  Renderer: ({ data }) => {
    if (!data.url) return null;
    return (
      <div className="my-6">
        <a href={data.url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group">
          <div className="bg-primary/10 text-primary p-2.5 rounded-lg group-hover:bg-primary/20 transition-colors"><FileDown className="w-5 h-5" /></div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{data.name || 'Descargar archivo'}</p>
            <p className="text-xs text-muted-foreground">Haz clic para descargar</p>
          </div>
        </a>
        {isPdf(data.url) && data.showPreview && (
          <iframe src={data.url} className="w-full h-[600px] mt-3 rounded-xl border border-border" title={data.name || 'PDF'} />
        )}
      </div>
    );
  },
});
