'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { deleteMyAccount } from '@/app/settings/actions';
import { Card, Field, inputClass } from './ui';

/**
 * Delete account, in two steps so nobody does it by accident:
 *   1. a permanent-deletion notice that must be accepted with a checkbox,
 *   2. typing ELIMINAR (+ the password for accounts that have one).
 * The server re-checks the acceptance, the confirmation word and the re-authentication.
 */
export default function DeleteAccountSection({ hasPassword, isSuperadmin }: { hasPassword: boolean; isSuperadmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setAcknowledged(false);
    setConfirmText('');
    setPassword('');
    setError(null);
  };
  const close = () => {
    if (busy) return;
    setOpen(false);
    reset();
  };

  const canDelete = confirmText === 'ELIMINAR' && (!hasPassword || password.length > 0) && !busy;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    const result = await deleteMyAccount({ acknowledged, confirmText, password: hasPassword ? password : undefined });
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    // The user no longer exists server-side: drop the local session and leave.
    try {
      await createClient().auth.signOut({ scope: 'local' });
    } catch {
      // Nothing left to sign out of.
    }
    router.push('/login?deleted=1');
    router.refresh();
  };

  return (
    <Card
      danger
      title="Eliminar cuenta"
      subtitle="Elimina tu cuenta y tus datos de forma permanente. Esta acción no se puede deshacer."
    >
      {isSuperadmin ? (
        <p className="text-sm text-foreground/60 max-w-md">
          Las cuentas de superadmin no se pueden eliminar desde aquí.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <Trash2 className="size-4" /> Eliminar mi cuenta
        </button>
      )}

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3 text-destructive">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{step === 1 ? 'Eliminación permanente' : 'Confirma para eliminar'}</h3>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                    Esta acción es permanente e irreversible. Dialektoz no puede recuperar ni restaurar tu cuenta ni tus datos, y no
                    atendemos solicitudes de recuperación.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="font-bold mb-1">Se elimina</p>
                      <ul className="list-disc pl-5 space-y-0.5 text-foreground/70">
                        <li>Tu perfil y tu foto</li>
                        <li>Tu progreso en las lecciones</li>
                        <li>Tu racha y tus puntos (XP)</li>
                        <li>Tus intentos de examen</li>
                        <li>Tu acceso con este correo</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold mb-1">Se conserva</p>
                      <ul className="list-disc pl-5 space-y-0.5 text-foreground/70">
                        <li>Tus certificados, sin tu nombre (“Titular eliminado”), para que sigan siendo verificables</li>
                        <li>Si eres profesor, el nombre como crédito en el contenido que creaste</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/60">
                    ¿Quieres conservar una copia?{' '}
                    <a href="/api/account/export" download className="text-primary font-semibold hover:underline">
                      Descarga tus datos
                    </a>{' '}
                    antes de continuar.
                  </p>

                  <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 size-4 accent-destructive"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Entiendo que esta acción es permanente y que no podré recuperar mi cuenta ni mis datos.
                    </span>
                  </label>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!acknowledged}
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-lg bg-destructive/90 px-4 py-2.5 text-sm font-bold text-white hover:bg-destructive disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="Escribe ELIMINAR para confirmar">
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className={inputClass}
                      placeholder="ELIMINAR"
                      disabled={busy}
                      autoComplete="off"
                    />
                  </Field>
                  {hasPassword && (
                    <Field label="Tu contraseña" hint="La pedimos para confirmar que eres tú.">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        disabled={busy}
                        autoComplete="current-password"
                      />
                    </Field>
                  )}

                  {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError(null);
                      }}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete}
                      onClick={handleDelete}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {busy ? 'Eliminando…' : 'Eliminar mi cuenta definitivamente'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
