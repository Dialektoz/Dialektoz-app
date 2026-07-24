'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'
import { isAdult, maxBirthDateFor18 } from '@/lib/age'

export default function OnboardingPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Prefill the birth date if it was already captured at signup.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('birth_date').eq('id', user.id).single()
      if (data?.birth_date) setBirthDate(data.birth_date)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!birthDate) {
      setError('Ingresa tu fecha de nacimiento.')
      return
    }
    if (!isAdult(birthDate)) {
      setError('Debes ser mayor de 18 años para usar Dialektoz.')
      return
    }

    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    // Update the profile in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        birth_date: birthDate,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error(updateError)
      // Fallback: If the trigger didn't create the profile, let's upsert
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          birth_date: birthDate,
          onboarding_completed: true,
        })
      
      if (upsertError) {
        setError('Ocurrió un error al guardar tus datos. Intenta de nuevo.')
        setIsLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[150px] -z-10"></div>

      <div className="w-full max-w-lg bg-card border border-border/50 rounded-3xl p-8 sm:p-12 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-3">Último paso</h1>
          <p className="text-foreground/60 text-sm">
            Queremos conocerte mejor para personalizar tu experiencia en Dialektoz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Nombre</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Ej. Juan"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Apellido</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Ej. Pérez"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold">Fecha de nacimiento</label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={maxBirthDateFor18()}
              className="w-full bg-background/50 border border-border/60 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="text-[11px] text-foreground/40">Debes ser mayor de 18 años.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold">Número de Teléfono <span className="text-foreground/40 font-normal">(opcional)</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background/50 border border-border/60 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="+57 300 000 0000"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-accent text-black font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 mt-8 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  )
}
