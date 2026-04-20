'use client'

import { useState } from 'react'
import { UserPlus, Copy, Check, Loader2, Eye, EyeOff, X, ChevronDown } from 'lucide-react'
import { createTeacher } from './actions'

export default function AddTeacherForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createTeacher(formData)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.password) {
      setGeneratedPassword(result.password)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handleCopy = async () => {
    if (!generatedPassword) return
    await navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setGeneratedPassword(null)
    setError(null)
    setIsOpen(false)
    setShowPassword(false)
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm mb-6">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-background/40 transition-colors"
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

      {/* Collapsible body */}
      {isOpen && (
        <div className="border-t border-border/50 p-5 md:p-6">
          {/* Password reveal — shown after successful creation */}
          {generatedPassword ? (
            <div className="space-y-5">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400 font-semibold">
                Teacher creado exitosamente. Comparte esta contraseña ahora — no se volverá a mostrar.
              </div>

              <div>
                <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">
                  Contraseña temporal
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono text-sm tracking-widest">
                    {showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors shrink-0"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center text-foreground/60 hover:text-primary transition-colors shrink-0"
                    title="Copiar"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={14} /> Cerrar
              </button>
            </div>
          ) : (
            /* Creation form */
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
                  className="flex items-center gap-2 bg-primary hover:bg-accent text-black font-bold text-sm py-2.5 px-6 rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-60 disabled:pointer-events-none"
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
