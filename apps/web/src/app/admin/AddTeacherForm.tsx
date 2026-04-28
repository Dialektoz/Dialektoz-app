'use client'

import { useState } from 'react'
import { UserPlus, Loader2, X, ChevronDown, MailCheck } from 'lucide-react'
import { createTeacher } from './actions'

export default function AddTeacherForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createTeacher(formData)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      if (result.email) setSentTo(null)
    } else if (result.success && result.email) {
      setSentTo(result.email)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handleClose = () => {
    setSentTo(null)
    setError(null)
    setIsOpen(false)
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-background/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <UserPlus size={16} />
          </div>
          <span className="font-bold text-base">Agregar Teacher</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border/50 p-5 md:p-6">
          {sentTo ? (
            <div className="space-y-5">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex items-start gap-3">
                <MailCheck className="text-green-400 shrink-0 mt-0.5" size={22} />
                <div className="text-sm text-green-400/90 leading-relaxed">
                  <p className="font-bold mb-1">Profesor creado y correo enviado</p>
                  <p>
                    Enviamos un enlace a <span className="font-semibold text-green-300">{sentTo}</span> para
                    que el profesor establezca su contraseña inicial.
                  </p>
                  <p className="mt-2 text-xs text-foreground/40">
                    Si no llega en unos minutos, pídele que revise spam o vuelve a invitarlo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={14} /> Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Nombre</label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    placeholder="Ej. María"
                    className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Apellido</label>
                  <input
                    name="last_name"
                    type="text"
                    placeholder="Ej. García"
                    className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Correo electrónico</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="teacher@dialektoz.com"
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <p className="text-xs text-foreground/40 leading-relaxed">
                  Recibirá un correo automático con un enlace para crear su contraseña.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-primary hover:bg-accent text-black font-bold text-sm py-2.5 px-6 rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {isLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Creando...</>
                    : <><UserPlus size={15} /> Crear Teacher</>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
