'use client'

import React from 'react'
import LevelCard from './LevelCard'
import { Level } from '@/types/learning'

// Mock Data for presentation
const LEVELS_MOCK: Level[] = [
  {
    id: 'l-a1',
    code: 'A1',
    title: 'Fundamentos Básicos',
    description: 'Descubre los fundamentos absolutos del inglés. Aprende a presentarte, comprende expresiones cotidianas y domina el vocabulario esencial para sobrevivir en entornos de habla inglesa. ¡Comienza tu viaje en Dialektoz aquí!',
    creatorName: 'Sarah Jenkins',
    creatorRole: 'Diseñadora de Currículo Principal',
    progressPercentage: 45,
    skills: [],
    bucket: {
      grammar: ['Verbo To Be', 'Presente Simple', 'Pronombres Personales'],
      vocabulary: ['Saludos', 'Números', 'Colores', 'Familia'],
      expressions: ['Hola, ¿cómo estás?', '¿Dónde está el baño?']
    }
  },
  {
    id: 'l-a2',
    code: 'A2',
    title: 'Comunicación Elemental',
    description: 'Amplía tu vocabulario y comienza a hablar con confianza en situaciones diarias de rutina. Aprende a describir experiencias pasadas y planes futuros.',
    creatorName: 'Mark Robertson',
    creatorRole: 'Educador Senior',
    progressPercentage: 12,
    skills: [],
    bucket: {
      grammar: ['Pasado Simple', 'Futuro (Going to)', 'Comparativos'],
      vocabulary: ['Viajes y Transporte', 'Comida y Bebida', 'Rutina Diaria'],
      expressions: ['Me gustaría ordenar...', '¿Cuánto cuesta esto?']
    }
  },
  {
    id: 'l-b1',
    code: 'B1',
    title: 'Fluidez Intermedia',
    description: 'Desbloquea tu habilidad para mantener conversaciones sobre temas familiares. Navega situaciones de viaje, describe sueños y expresa opiniones claramente.',
    creatorName: 'Elena Velez',
    creatorRole: 'Experta Bilingüe',
    progressPercentage: 0,
    skills: [],
    bucket: {
      grammar: ['Presente Perfecto', 'Primer Condicional', 'Modales de Deducción'],
      vocabulary: ['Trabajo y Profesiones', 'Sentimientos', 'Tecnología'],
      expressions: ['En mi opinión...', 'Eso me recuerda a...']
    }
  },
  {
    id: 'l-b2',
    code: 'B2',
    title: 'Interacciones Avanzadas',
    description: 'Alcanza la independencia. Comprende ideas principales de textos complejos, interactúa con hablantes nativos con fluidez y produce textos detallados sobre diversos temas.',
    creatorName: 'Sarah Jenkins',
    creatorRole: 'Diseñadora de Currículo Principal',
    progressPercentage: 0,
    skills: [],
    bucket: {
      grammar: ['Pasado Perfecto', 'Voz Pasiva', 'Estilo Indirecto (Reported Speech)'],
      vocabulary: ['Medio Ambiente', 'Política', 'Conceptos Abstractos'],
      expressions: ['Por otro lado...', 'A tener en cuenta']
    }
  },
  {
    id: 'l-c1',
    code: 'C1',
    title: 'Dominio y Maestría',
    description: 'Alcanza una competencia operativa casi nativa. Exprésate con fluidez sin buscar palabras. Domina los matices y modismos del inglés real.',
    creatorName: 'Dr. James Ford',
    creatorRole: 'Experto Lingüístico',
    progressPercentage: 0,
    skills: [],
    bucket: {
      grammar: ['Inversión', 'Oraciones Hendidas (Cleft Sentences)', 'Condicionales Mixtos'],
      vocabulary: ['Colocaciones', 'Modismos', 'Inglés Académico'],
      expressions: ['Andarse por las ramas', 'En general...']
    }
  }
];

export default function LearnDashboard() {
  const handleLevelClick = (id: string) => {
    // In the future this will navigate to /learn/[id]
    console.log('Navigating to level:', id);
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
        {LEVELS_MOCK.map((level) => (
          <LevelCard key={level.id} level={level} onClick={handleLevelClick} />
        ))}
      </div>
    </div>
  )
}
