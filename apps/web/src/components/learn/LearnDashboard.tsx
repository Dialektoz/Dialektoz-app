'use client'

import React from 'react'
import LevelCard from './LevelCard'
import { Level } from '@/types/learning'
import { useRouter } from 'next/navigation'

interface LearnDashboardProps {
  levels: Level[]
}

export default function LearnDashboard({ levels = [] }: LearnDashboardProps) {
  const router = useRouter()

  const handleLevelClick = (code: string) => {
    router.push(`/learn/${code.toLowerCase()}`);
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
          Ruta de <span className="text-primary">Aprendizaje</span>
        </h1>
        <p className="text-foreground/60 text-lg max-w-2xl">
          Sigue el currículo estructurado de Dialektoz diseñado para llevarte desde tus primeras palabras hasta la fluidez nativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} onClick={handleLevelClick} />
        ))}
      </div>
    </div>
  )
}
