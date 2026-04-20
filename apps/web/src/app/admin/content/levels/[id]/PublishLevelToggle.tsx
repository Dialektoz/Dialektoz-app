'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function PublishLevelToggle({
  levelId,
  initialPublished,
}: {
  levelId: string
  initialPublished: boolean
}) {
  const [published, setPublished] = useState(initialPublished)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    const next = !published
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('levels').update({ published: next }).eq('id', levelId)
    setLoading(false)
    if (error) {
      alert('Error al actualizar el estado: ' + error.message)
      return
    }
    setPublished(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        published
          ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25'
          : 'bg-muted text-foreground/70 hover:bg-muted/80'
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : published ? (
        <Eye size={14} />
      ) : (
        <EyeOff size={14} />
      )}
      {published ? 'Publicado' : 'Borrador'}
    </button>
  )
}
