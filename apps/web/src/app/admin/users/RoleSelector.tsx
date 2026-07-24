'use client'

import { useState, useTransition, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Check, ShieldAlert } from 'lucide-react'
import { setUserRole } from '../actions'
import { ALL_ROLES, ROLE_LABEL, ROLE_DESCRIPTION, canAssignRole, canManageTarget, type Role } from '../roles'

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  admin: 'bg-primary/15 text-primary border-primary/30',
  teacher: 'bg-green-500/15 text-green-500 border-green-500/30',
  premium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  student_premium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  free: 'bg-foreground/10 text-foreground/60 border-border',
  student: 'bg-foreground/10 text-foreground/60 border-border',
}

const POPOVER_WIDTH = 256
const POPOVER_GAP = 8

export default function RoleSelector({
  userId,
  currentRole,
  actorRole,
}: {
  userId: string
  currentRole: string
  actorRole: string
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const badgeClass = ROLE_BADGE[currentRole] ?? ROLE_BADGE.free
  const label = ROLE_LABEL[currentRole] ?? currentRole
  const editable = canManageTarget(actorRole, currentRole)

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const viewportWidth = window.innerWidth
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

  const handleSelect = (newRole: Role) => {
    if (newRole === currentRole) {
      setIsOpen(false)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setUserRole(userId, newRole)
      if (result.error) setError(result.error)
      else setIsOpen(false)
    })
  }

  // Protected target (e.g. a superadmin, or an admin seen by another admin):
  // show a read-only badge with a shield hint.
  if (!editable) {
    return (
      <span
        title={
          currentRole === 'superadmin'
            ? 'Super Admin — rol irrevocable'
            : 'No tienes permiso para cambiar este rol'
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
      >
        {currentRole === 'superadmin' && <ShieldAlert size={11} />}
        {label}
      </span>
    )
  }

  const options = ALL_ROLES.filter((r) => r === currentRole || canAssignRole(actorRole, currentRole, r))

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
              {options.map((role) => {
                const isCurrent = role === currentRole
                return (
                  <button
                    key={role}
                    onClick={() => handleSelect(role)}
                    disabled={isPending || isCurrent}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isCurrent ? 'bg-primary/5 cursor-default' : 'hover:bg-background/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{ROLE_LABEL[role]}</p>
                      <p className="text-xs text-foreground/50">{ROLE_DESCRIPTION[role]}</p>
                    </div>
                    {isCurrent && <Check size={14} className="text-primary mt-0.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
            {error && (
              <div className="border-t border-border bg-red-500/10 text-red-400 text-xs p-3">{error}</div>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
