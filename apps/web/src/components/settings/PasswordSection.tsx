'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Card, Field, inputClass } from './ui';
import PasswordStrength from './PasswordStrength';

/**
 * Change (or, for accounts that only use Google/Facebook/Apple, create) the password.
 * Changing it requires the current one, and signs out every other session.
 */
export default function PasswordSection({ email, hasPassword }: { email: string | null; hasPassword: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (hasPassword && !current) return setResult({ ok: false, message: 'Escribe tu contraseña actual.' });
    if (next.length < 8) return setResult({ ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    if (next !== confirm) return setResult({ ok: false, message: 'Las contraseñas nuevas no coinciden.' });
    if (hasPassword && next === current) return setResult({ ok: false, message: 'La nueva contraseña debe ser distinta de la actual.' });

    setSaving(true);
    const supabase = createClient();

    if (hasPassword) {
      if (!email) {
        setSaving(false);
        return setResult({ ok: false, message: 'No pudimos verificar tu cuenta. Vuelve a iniciar sesión.' });
      }
      // Re-authenticate: proves the person at the keyboard knows the current password.
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (authError) {
        setSaving(false);
        return setResult({ ok: false, message: 'La contraseña actual no es correcta.' });
      }
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      setSaving(false);
      return setResult({ ok: false, message: error.message });
    }

    // Close every other session (other devices/browsers); this one stays signed in.
    await supabase.auth.signOut({ scope: 'others' });

    setSaving(false);
    setCurrent('');
    setNext('');
    setConfirm('');
    setResult({
      ok: true,
      message: hasPassword
        ? 'Contraseña actualizada. Cerramos tu sesión en los demás dispositivos.'
        : 'Contraseña creada. Ya puedes entrar también con tu correo y contraseña.',
    });
  };

  return (
    <Card
      title={hasPassword ? 'Contraseña' : 'Crear contraseña'}
      subtitle={
        hasPassword
          ? 'Para cambiarla necesitamos tu contraseña actual.'
          : 'Entras con Google, Facebook o Apple. Puedes crear una contraseña para entrar también con tu correo.'
      }
    >
      <form onSubmit={submit} className="space-y-4 max-w-md" autoComplete="off">
        {hasPassword && (
          <Field label="Contraseña actual">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} autoComplete="current-password" />
          </Field>
        )}
        <Field label="Nueva contraseña">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
        </Field>
        {next.length > 0 && <PasswordStrength password={next} />}
        <Field label="Confirmar nueva contraseña">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="Repite la contraseña" autoComplete="new-password" />
        </Field>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg disabled:opacity-50 justify-center"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? 'Guardando…' : hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
          </button>
          {result && (
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
              {result.ok ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />} {result.message}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
