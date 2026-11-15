import { Download } from 'lucide-react';

export default function DataExportSection() {
  return (
    <div>
      <p className="text-sm text-foreground/50 mb-3">
        Descarga una copia de la información de tu cuenta: perfil, progreso, racha, intentos de examen y certificados.
      </p>
      <a
        href="/api/account/export"
        download
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
      >
        <Download className="size-4" /> Descargar mis datos
      </a>
    </div>
  );
}
