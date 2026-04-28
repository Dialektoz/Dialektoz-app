'use client'

import { useState, useTransition } from 'react'
import { Loader2, MailCheck, Send } from 'lucide-react'
import { resendTeacherInvite } from '../actions'

export default function ResendInviteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<'idle' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleResend = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await resendTeacherInvite(userId)
      if (result.error) {
        setFeedback('error')
        setErrorMsg(result.error)
      } else {
        setFeedback('sent')
        setTimeout(() => setFeedback('idle'), 4000)
      }
    })
  }

  if (feedback === 'sent') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-foreground/60 bg-foreground/5 border border-border/50">
        <MailCheck size={12} /> Reenviado
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleResend}
        disabled={isPending}
        title={errorMsg ?? 'Reenviar correo de acceso'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-foreground/60 hover:text-foreground bg-transparent hover:bg-foreground/5 border border-border/50 hover:border-border disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Reenviar
      </button>
      {feedback === 'error' && errorMsg && (
        <span className="text-xs text-red-400 truncate max-w-[180px]" title={errorMsg}>
          {errorMsg}
        </span>
      )}
    </div>
  )
}
