'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, KeyRound, Loader2, X } from 'lucide-react'
import { generateRecoveryLink } from './actions'

export default function GenerateRecoveryLinkButton({ userId, userName }: { userId: string; userName?: string }) {
  const [isPending, startTransition] = useTransition()
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateRecoveryLink(userId)
      if (result.error || !result.link) {
        setError(result.error ?? 'No se pudo generar el enlace.')
      } else {
        setLink(result.link)
      }
    })
  }

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked: the input below is selectable, so copying by hand still works.
    }
  }

  const close = () => {
    setLink(null)
    setCopied(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          title={error ?? 'Generar enlace de recuperación'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-foreground/60 hover:text-foreground bg-transparent hover:bg-foreground/5 border border-border/50 hover:border-border disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
          Generar enlace
        </button>
        {error && (
          <span className="text-xs text-red-400 truncate max-w-[180px]" title={error}>
            {error}
          </span>
        )}
      </div>

      {link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-4 top-4 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex items-center gap-3 text-primary">
              <div className="rounded-lg bg-primary/10 p-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Enlace de recuperación</h3>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Envíaselo{userName ? <> a <strong className="text-foreground">{userName}</strong></> : ' al usuario'} por un
              canal privado (por ejemplo WhatsApp). Es de un solo uso, vence pronto (por defecto en 1 hora) y solo le
              permite crear su propia contraseña. Quien tenga el enlace puede entrar a esa cuenta, así que no lo
              compartas en grupos.
            </p>

            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="mb-4 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none"
            />

            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black transition-all hover:bg-accent cursor-pointer"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
