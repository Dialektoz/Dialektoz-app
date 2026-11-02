'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react'

// Confirmation step for admin-generated recovery links. The token is only
// redeemed when the person clicks the button (never on page load), so link
// previews and email/chat scanners can't consume the single-use token.
export default function RecoverPage() {
  return (
    <Suspense fallback={null}>
      <RecoverInner />
    </Suspense>
  )
}

function RecoverInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenHash = searchParams.get('token_hash')
  const isValidLink = !!tokenHash && searchParams.get('type') === 'recovery'

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!tokenHash) return
    setError(null)
    setIsLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })

    if (verifyError) {
      setError('Este enlace ya fue usado o venció. Pide a un administrador que genere uno nuevo.')
      setIsLoading(false)
      return
    }

    router.push('/change-password?recovery=1')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl p-8 sm:p-12 shadow-2xl z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary mb-5">
            <KeyRound size={26} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Recupera tu acceso</h1>
          <p className="text-foreground/60 text-sm leading-relaxed">
            {isValidLink
              ? 'Pulsa continuar para crear una nueva contraseña para tu cuenta de Dialektoz.'
              : 'Este enlace no es válido. Pide a un administrador que genere uno nuevo.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        {isValidLink && (
          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-accent text-black font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Continuar'}
          </button>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-xl text-sm font-semibold text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
