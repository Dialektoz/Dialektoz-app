'use client'

import { useState, useTransition, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Check } from 'lucide-react'
import { setUserRole } from '../actions'
import type { AssignableRole } from '../roles'

const ROLE_OPTIONS: { value: AssignableRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Acceso total al panel' },
  { value: 'premium', label: 'Premium', description: 'Estudiante con suscripción' },
  { value: 'free', label: 'Free', description: 'Estudiante sin suscripción' },
  // 'teacher' is intentionally not exposed here — teachers are managed from /admin/teachers.
]

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-primary/15 text-primary border-primary/30',
  teacher: 'bg-green-500/15 text-green-500 border-green-500/30',
  premium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  free: 'bg-foreground/10 text-foreground/60 border-border',
  student: 'bg-foreground/10 text-foreground/60 border-border',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  premium: 'Premium',
  free: 'Free',
  student: 'Free',
}

const POPOVER_WIDTH = 256 // matches w-64 (16rem * 16px)
const POPOVER_GAP = 8

export default function RoleSelector({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  // Position the popover anchored to the button using viewport coords.
  // The popover lives in a portal at <body>, so it escapes the table's overflow:hidden.
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      // Right-align the popover to the button, but clamp inside viewport.
      let left = rect.right - POPOVER_WIDTH
      if (left < 8) left = 8
      if (left + POPOVER_WIDTH > viewportWidth - 8) left = viewportWidth - POPOVER_WIDTH - 8
      setCoords({ top: rect.bottom + POPOVER_GAP, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  const handleSelect = (newRole: AssignableRole) => {
    if (newRole === currentRole) {
      setIsOpen(false)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setUserRole(userId, newRole)
      if (result.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  const badgeClass = ROLE_BADGE[currentRole] ?? ROLE_BADGE.free
  const label = ROLE_LABEL[currentRole] ?? currentRole

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !isPending && setIsOpen(!isOpen)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 cursor-pointer disabled:opacity-50 ${badgeClass}`}
      >
        {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
        <span>{label}</span>
        <ChevronDown size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {typeof document !== 'undefined' && isOpen && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed w-64 bg-card border border-border rounded-xl shadow-2xl z-[70] overflow-hidden"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="p-2">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-3 py-2">
                Cambiar rol
              </p>
              {ROLE_OPTIONS.map((option) => {
                const isCurrent = option.value === currentRole
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    disabled={isPending || isCurrent}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-primary/5 cursor-default'
                        : 'hover:bg-background/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{option.label}</p>
                      <p className="text-xs text-foreground/50">{option.description}</p>
                    </div>
                    {isCurrent && <Check size={14} className="text-primary mt-0.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
            {error && (
              <div className="border-t border-border bg-red-500/10 text-red-400 text-xs p-3">
                {error}
              </div>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
