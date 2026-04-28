'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // The recovery email Supabase sends will link back to /auth/callback?type=recovery,
    // which forwards the user to /change-password where they set a new one.
    // NOTE: when we migrate to Zoho SMTP, the sender swaps automatically — no code change here.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="bg-card/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-inner">
              <Logo className="text-primary" size={36} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-foreground/50 bg-clip-text text-transparent mb-2">
              Recupera tu acceso
            </h1>
            <p className="text-foreground/50 text-sm">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-start gap-3">
                <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-green-400/90 leading-relaxed">
                  <p className="font-bold mb-1">Correo enviado</p>
                  <p>
                    Revisa la bandeja de <span className="font-semibold text-green-300">{email}</span> y haz
                    clic en el enlace para crear una nueva contraseña.
                  </p>
                  <p className="mt-2 text-xs text-foreground/40">
                    ¿No lo ves? Revisa la carpeta de spam o vuelve a solicitarlo en unos minutos.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-white/5 transition-all text-sm font-bold text-foreground/80"
              >
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-primary/80 uppercase tracking-widest ml-1">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/30 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-4 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-accent text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Mail size={18} />
                    <span>Enviar enlace</span>
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </Link>
            </form>
          )}

          <p className="mt-8 text-center text-foreground/30 text-[10px] uppercase tracking-tighter">
            © 2026 Dialektoz Language School. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
