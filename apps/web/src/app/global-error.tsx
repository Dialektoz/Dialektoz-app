'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#E0E0E0', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: '#9a9a9a', marginBottom: 24 }}>Ocurrió un error inesperado. Intenta recargar la página.</p>
          <button
            onClick={reset}
            style={{ background: '#D4AF37', color: '#121212', fontWeight: 700, border: 0, padding: '10px 22px', borderRadius: 12, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
