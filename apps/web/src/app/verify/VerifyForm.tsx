'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function VerifyForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) router.push(`/certificate/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ej: DZ-A1-8F3A2B9C"
        autoFocus
        className="flex-1 bg-card border border-border rounded-xl py-3 px-4 text-foreground placeholder:text-foreground/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono uppercase text-center sm:text-left"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="inline-flex items-center justify-center gap-2 bg-primary text-black font-extrabold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.2)]"
      >
        <Search className="size-4" /> Verificar
      </button>
    </form>
  );
}
