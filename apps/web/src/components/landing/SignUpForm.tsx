'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else if (error.message.includes('Password')) {
        setError('La contraseña es demasiado débil.')
      } else {
        setError(error.message)
      }
      setIsLoading(false)
    } else if (data.session) {
      router.refresh()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.session.user.id)
        .single()
        
      if (profile && !profile.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } else {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card w-full rounded-2xl shadow-2xl border border-border/50 p-8 sm:p-10 relative z-20">
      <h2 className="text-2xl font-bold text-center mb-8 tracking-tight">Crea tu Cuenta Gratis</h2>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button 
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
          className="flex items-center justify-center p-3 border border-border/60 hover:border-primary/50 hover:bg-white/5 rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </button>
        <button 
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading}
          className="flex items-center justify-center p-3 border border-border/60 hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
        <button 
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoading}
          className="flex items-center justify-center p-3 border border-border/60 hover:border-white/50 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-[22px] h-[22px] fill-foreground" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.453 3.608-2.91 1.15-1.685 1.626-3.321 1.654-3.414-.037-.014-3.203-1.226-3.235-4.908-.027-3.085 2.518-4.576 2.636-4.653-1.432-2.09-3.663-2.37-4.48-2.417h-.012zM15.589 4.312c.843-1.018 1.41-2.435 1.256-3.842-1.186.048-2.671.785-3.546 1.815-.776.904-1.457 2.359-1.267 3.743 1.328.102 2.712-.686 3.557-1.716z"/>
          </svg>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <hr className="w-full border-border/60" />
        <span className="absolute px-3 bg-card text-foreground/50 text-sm font-medium">o</span>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-background/50 border border-border/60 rounded-xl py-3 px-4 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Introduce tu correo"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background/50 border border-border/60 rounded-xl py-3 pl-4 pr-12 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Min. 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-secondary text-black font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Empieza a Aprender Gratis'}
        </button>
      </form>

      <p className="text-center text-xs text-foreground/40 mt-6 leading-relaxed">
        Al continuar, aceptas nuestros <Link href="/terms" className="text-primary hover:underline">Términos de Uso</Link>, 
        nuestra <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link> y el uso de la data en EEUU.
      </p>
    </div>
  )
}
