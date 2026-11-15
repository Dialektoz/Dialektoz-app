'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Card } from './ui';

export default function SessionSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Card title="Sesión" subtitle="Cierra la sesión en este dispositivo.">
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} Cerrar sesión
      </button>
    </Card>
  );
}
