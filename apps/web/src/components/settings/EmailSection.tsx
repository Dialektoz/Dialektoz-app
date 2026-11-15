'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Check, AlertCircle, Mail } from 'lucide-react';
import { Collapsible, Field, inputClass } from './ui';

const PROVIDER_LABEL: Record<string, string> = { google: 'Google', facebook: 'Facebook', apple: 'Apple' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Change the sign-in email. Requires the current password; Supabase then sends a
 * confirmation link and only switches the address once it is opened. Accounts that
 * sign in with Google/Facebook/Apple get their email from that provider, so it
 * can't be changed here.
 */
export default function EmailSection({
  currentEmail,
  pendingEmail,
  hasPassword,
  provider,
  defaultOpen = false,
}: {
  currentEmail: string | null;
  pendingEmail: string | null;
  hasPassword: boolean;
  provider: string | null;
  defaultOpen?: boolean;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const target = newEmail.trim().toLowerCase();

    if (!EMAIL_RE.test(target)) return setResult({ ok: false, message: 'Escribe un correo válido.' });
    if (target === (currentEmail ?? '').toLowerCase()) return setResult({ ok: false, message: 'Ese ya es tu correo actual.' });
    if (!password) return setResult({ ok: false, message: 'Escribe tu contraseña para confirmar que eres tú.' });
    if (!currentEmail) return setResult({ ok: false, message: 'No pudimos verificar tu cuenta. Vuelve a iniciar sesión.' });

    setSaving(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email: currentEmail, password });
    if (authError) {
      setSaving(false);
      return setResult({ ok: false, message: 'La contraseña no es correcta.' });
    }

    const { error } = await supabase.auth.updateUser(
      { email: target },
      { emailRedirectTo: `${window.location.origin}/auth/callback?type=email_change` }
    );
    setSaving(false);
    if (error) return setResult({ ok: false, message: error.message });

    setPassword('');
    setNewEmail('');
    setResult({
      ok: true,
      message: `Te enviamos un enlace de confirmación a ${target}. Tu correo cambia cuando lo abras. Si no lo ves, revisa la carpeta de spam; puede que también te pidamos confirmar desde tu correo actual.`,
    });
  };

  return (
    <Collapsible
      title="Correo electrónico"
      summary={pendingEmail ? `Pendiente de confirmar: ${pendingEmail}` : (currentEmail ?? 'Sin correo')}
      defaultOpen={defaultOpen}
    >
      <p className="text-sm text-foreground/50 mb-4">Es el correo con el que entras y donde recibes los avisos de tu cuenta.</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm mb-4 max-w-md">
        <Mail className="size-4 text-muted-foreground shrink-0" />
        <span className="truncate font-medium">{currentEmail ?? 'Sin correo'}</span>
      </div>

      {pendingEmail && (
        <p className="text-sm text-amber-600 mb-4 max-w-md">
          Cambio pendiente: <strong>{pendingEmail}</strong>. Abre el enlace que te enviamos para confirmarlo.
        </p>
      )}

      {!hasPassword ? (
        <p className="text-sm text-foreground/60 max-w-md">
          Entras con {provider ? (PROVIDER_LABEL[provider] ?? provider) : 'otro proveedor'}, que es quien administra tu correo. Para
          cambiarlo, hazlo en esa cuenta.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4 max-w-md" autoComplete="off">
          <Field label="Nuevo correo">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} placeholder="nuevo@correo.com" autoComplete="off" />
          </Field>
          <Field label="Tu contraseña" hint="La pedimos para confirmar que eres tú.">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
          </Field>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg disabled:opacity-50 justify-center"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? 'Enviando…' : 'Cambiar correo'}
            </button>
          </div>
          {result && (
            <p className={`text-sm font-semibold flex items-start gap-1.5 ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
              {result.ok ? <Check className="size-4 shrink-0 mt-0.5" /> : <AlertCircle className="size-4 shrink-0 mt-0.5" />} {result.message}
            </p>
          )}
        </form>
      )}
    </Collapsible>
  );
}
