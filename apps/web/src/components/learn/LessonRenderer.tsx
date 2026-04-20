'use client'

import { useState } from 'react'
import { CheckSquare, HelpCircle, Image as ImageIcon, Check, X } from 'lucide-react'
import type { BlockData } from '@/components/editor/LessonBuilder'

function RichTextView({ content }: { content: any }) {
  // Minimal TipTap-compatible JSON renderer. Handles doc > paragraph > text with marks.
  if (!content || typeof content !== 'object') return null

  const renderNode = (node: any, key: number): React.ReactNode => {
    if (!node) return null
    if (node.type === 'doc' || node.type === 'paragraph') {
      const children = (node.content || []).map((n: any, i: number) => renderNode(n, i))
      if (node.type === 'paragraph') {
        return <p key={key} className="text-foreground/80 leading-relaxed my-3">{children}</p>
      }
      return <div key={key}>{children}</div>
    }
    if (node.type === 'text') {
      let el: React.ReactNode = node.text
      for (const mark of node.marks || []) {
        if (mark.type === 'bold') el = <strong key={key}>{el}</strong>
        else if (mark.type === 'italic') el = <em key={key}>{el}</em>
        else if (mark.type === 'underline') el = <u key={key}>{el}</u>
        else if (mark.type === 'link') el = <a key={key} href={mark.attrs?.href} className="text-primary underline">{el}</a>
      }
      return <span key={key}>{el}</span>
    }
    return null
  }

  return <>{renderNode(content, 0)}</>
}

function FillBlankBlock({ content }: { content: string }) {
  const parts = (content || '').split(/(\{\{.*?\}\})/)
  const answers = parts.filter(p => p.startsWith('{{') && p.endsWith('}}')).map(p => p.slice(2, -2))

  const [values, setValues] = useState<string[]>(answers.map(() => ''))
  const [checked, setChecked] = useState(false)

  let blankIndex = -1

  return (
    <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs tracking-wide uppercase">
        <CheckSquare className="w-4 h-4" />
        <span>Fill in the Blanks</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-foreground">
        {parts.map((part, i) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            blankIndex++
            const idx = blankIndex
            const isCorrect = checked && values[idx].trim().toLowerCase() === answers[idx].trim().toLowerCase()
            const isWrong = checked && !isCorrect
            return (
              <input
                key={i}
                type="text"
                value={values[idx]}
                onChange={(e) => {
                  const next = [...values]
                  next[idx] = e.target.value
                  setValues(next)
                }}
                disabled={checked && isCorrect}
                className={`inline-block min-w-[100px] px-3 py-1 border-b-2 bg-background/50 rounded-sm text-center outline-none transition-colors ${
                  isCorrect
                    ? 'border-green-500 text-green-600'
                    : isWrong
                    ? 'border-red-500 text-red-600'
                    : 'border-primary text-primary focus:bg-background'
                }`}
              />
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setChecked(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Comprobar
        </button>
        {checked && (
          <button
            onClick={() => {
              setChecked(false)
              setValues(answers.map(() => ''))
            }}
            className="text-xs font-semibold text-foreground/60 hover:text-foreground"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}

function QuizBlock({ content }: { content: { question?: string; options?: string[]; correctIndex?: number } }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const options = content?.options || []
  const correct = content?.correctIndex

  return (
    <div className="p-6 rounded-2xl border border-secondary/30 bg-secondary/5">
      <div className="flex items-center gap-2 mb-4 text-secondary font-bold text-xs tracking-wide uppercase">
        <HelpCircle className="w-4 h-4" />
        <span>Quiz</span>
      </div>
      <p className="text-lg font-semibold text-foreground mb-4">{content?.question || ''}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = checked && i === correct
          const isWrong = checked && isSelected && i !== correct
          return (
            <button
              key={i}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isCorrect
                  ? 'border-green-500 bg-green-500/10 text-green-700'
                  : isWrong
                  ? 'border-red-500 bg-red-500/10 text-red-700'
                  : isSelected
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border hover:border-secondary/50 bg-background/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-secondary' : 'border-border'}`}>
                {isSelected && <div className="w-2 h-2 bg-secondary rounded-full" />}
              </div>
              <span className="flex-1 text-sm">{opt}</span>
              {isCorrect && <Check className="w-4 h-4" />}
              {isWrong && <X className="w-4 h-4" />}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={selected === null || checked}
          onClick={() => setChecked(true)}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Comprobar
        </button>
        {checked && (
          <button
            onClick={() => {
              setChecked(false)
              setSelected(null)
            }}
            className="text-xs font-semibold text-foreground/60 hover:text-foreground"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}

function Block({ block }: { block: BlockData }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="text-3xl font-bold text-foreground mt-8 mb-4 tracking-tight">{block.content || ''}</h2>
    case 'text':
      return <div className="prose prose-invert max-w-none"><RichTextView content={block.content} /></div>
    case 'image':
      if (typeof block.content === 'string' && block.content) {
        return (
          <figure className="my-6">
            <img src={block.content} alt="" className="w-full rounded-xl border border-border" />
          </figure>
        )
      }
      return (
        <div className="w-full h-48 border-2 border-dashed border-border flex items-center justify-center bg-muted/20 rounded-xl text-muted-foreground my-6">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm">Imagen sin configurar</p>
          </div>
        </div>
      )
    case 'fill-blank':
      return <div className="my-6"><FillBlankBlock content={block.content || ''} /></div>
    case 'quiz':
      return <div className="my-6"><QuizBlock content={block.content || {}} /></div>
    case 'grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-xl border border-border/40 bg-background/20 min-h-[120px]" />
          <div className="p-4 rounded-xl border border-border/40 bg-background/20 min-h-[120px]" />
        </div>
      )
    default:
      return null
  }
}

export default function LessonRenderer({ blocks }: { blocks: BlockData[] }) {
  return (
    <div className="max-w-3xl mx-auto">
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  )
}
