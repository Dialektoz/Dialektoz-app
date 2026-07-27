'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Algo salió mal</h1>
        <p className="text-foreground/60 mb-7">
          Tuvimos un problema al cargar esta vista. Puedes reintentar o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl"
          >
            <RotateCw className="size-4" /> Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-border font-bold px-5 py-2.5 rounded-xl hover:bg-muted"
          >
            <Home className="size-4" /> Ir al inicio
          </Link>
        </div>
        {error.digest && <p className="text-xs text-foreground/30 mt-6 font-mono">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
