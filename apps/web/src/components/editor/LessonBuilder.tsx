'use client';

import { useState } from 'react';
import { Plus, GripVertical, FileText, Image as ImageIcon, Type, LayoutGrid, CheckSquare, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from './RichTextEditor';

// Tipos de Bloques Soportados
export type BlockType = 'heading' | 'text' | 'image' | 'grid' | 'fill-blank' | 'quiz';

export interface BlockData {
  id: string;
  type: BlockType;
  content?: any;
  columns?: number;
  items?: BlockData[];
}

interface LessonBuilderProps {
  initialBlocks?: BlockData[];
  onChange?: (blocks: BlockData[]) => void;
}

export function LessonBuilder({ initialBlocks = [], onChange }: LessonBuilderProps) {
  const [blocks, setBlocks] = useState<BlockData[]>(
    initialBlocks.length > 0 ? initialBlocks : [{ id: crypto.randomUUID(), type: 'heading', content: 'Título de la Lección' }]
  );

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const addBlock = (index: number, type: BlockType) => {
    const newBlock: BlockData = {
      id: crypto.randomUUID(),
      type,
      content: type === 'text' ? { type: 'doc', content: [{ type: 'paragraph' }] } : '',
    };
    
    const newBlocks = [...blocks];
    // Insertar el nuevo bloque después del index actual
    newBlocks.splice(index + 1, 0, newBlock);
    
    setBlocks(newBlocks);
    setActiveMenuIndex(null);
    onChange?.(newBlocks);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return; // No permitir borrar si solo hay 1
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const updateBlock = (id: string, newContent: any) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content: newContent } : b);
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  // Renderer Switch basado en el tipo
  const renderBlockEditor = (block: BlockData) => {
    switch (block.type) {
      case 'heading':
        return (
          <input 
            type="text" 
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0"
            placeholder="Escribe el Título..."
            value={block.content || ''}
            onChange={(e) => updateBlock(block.id, e.target.value)}
          />
        );
      case 'text':
        return (
          <div className="min-h-[100px]">
            <RichTextEditor 
              content={block.content} 
              onChange={(json) => updateBlock(block.id, json)} 
            />
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-48 border-2 border-dashed border-border flex items-center justify-center bg-muted/20 rounded-xl cursor-pointer hover:bg-muted/40 transition">
            <div className="text-center text-muted-foreground">
               <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-60" />
               <p className="text-sm">Click para subir una imagen o arrástrala aquí</p>
            </div>
          </div>
        );
      case 'fill-blank':
        return (
          <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 shadow-inner">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold text-sm tracking-wide uppercase">
               <CheckSquare className="w-5 h-5" />
               <span>Ejercicio: Fill in the Blanks</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Escribe la frase y usa <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs font-bold">{"{{Respuesta}}"}</code> para crear el hueco. 
            </p>
            <div className="relative">
              <textarea 
                rows={2}
                className="w-full text-lg bg-background border border-border outline-none text-foreground px-5 py-4 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                placeholder="Ex: The cat is {{on}} the table."
                value={block.content || ''}
                onChange={(e) => updateBlock(block.id, e.target.value)}
              />
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Vista previa:</span>
                <div className="flex items-center gap-2 text-foreground font-medium p-3 bg-background/50 rounded-lg border border-border/40">
                  {block.content ? block.content.split(/(\{\{.*?\}\})/).map((part: string, i: number) => {
                    if (part.startsWith('{{') && part.endsWith('}}')) {
                      return <span key={i} className="inline-block px-3 py-1 bg-primary/10 border-b-2 border-primary text-primary min-w-[60px] text-center rounded-sm">...</span>;
                    }
                    return <span key={i}>{part}</span>;
                  }) : <span className="italic text-muted-foreground text-sm">Empieza a escribir...</span>}
                </div>
              </div>
            </div>
          </div>
        );
      case 'grid':
         return (
             <div className="p-6 rounded-2xl border border-border border-dashed bg-muted/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-wider">
                     <LayoutGrid className="w-5 h-5" />
                     <span>Layout: 2 Columnas</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4 p-4 rounded-xl border border-border/40 bg-background/20 min-h-[150px] flex flex-col items-center justify-center text-center">
                     <div className="opacity-40 flex flex-col items-center">
                        <Plus className="w-8 h-8 mb-2" />
                        <p className="text-xs uppercase font-bold tracking-tighter">Bloque Izquierdo</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Configuración en desarrollo</p>
                     </div>
                  </div>
                  
                  {/* Columna Derecha */}
                  <div className="space-y-4 p-4 rounded-xl border border-border/40 bg-background/20 min-h-[150px] flex flex-col items-center justify-center text-center">
                     <div className="opacity-40 flex flex-col items-center">
                        <Plus className="w-8 h-8 mb-2" />
                        <p className="text-xs uppercase font-bold tracking-tighter">Bloque Derecho</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Configuración en desarrollo</p>
                     </div>
                  </div>
                </div>
             </div>
         )
      case 'quiz':
        return (
          <div className="p-6 rounded-2xl border border-secondary/30 bg-secondary/5 shadow-inner">
            <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-sm tracking-wide uppercase">
               <HelpCircle className="w-5 h-5" />
               <span>Ejercicio: Checkbox Quiz</span>
            </div>
            <input 
              type="text" 
              className="w-full text-lg font-bold bg-background border border-border outline-none text-foreground px-4 py-3 rounded-xl focus:border-secondary mb-4"
              placeholder="¿Cuál es la pregunta?"
              value={block.content?.question || ''}
              onChange={(e) => updateBlock(block.id, { ...block.content, question: e.target.value })}
            />
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 bg-background/40 p-2 rounded-lg border border-border/40">
                  <div className={`w-5 h-5 rounded-full border-2 border-secondary/50 flex items-center justify-center ${block.content?.correctIndex === i ? 'bg-secondary' : ''}`}>
                    {block.content?.correctIndex === i && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input 
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    placeholder={`Opción ${i + 1}`}
                    value={block.content?.options?.[i] || ''}
                    onChange={(e) => {
                      const newOptions = [...(block.content?.options || ['', '', ''])];
                      newOptions[i] = e.target.value;
                      updateBlock(block.id, { ...block.content, options: newOptions });
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] uppercase font-bold text-secondary"
                    onClick={() => updateBlock(block.id, { ...block.content, correctIndex: i })}
                  >
                    Marcar Correcta
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <div className="p-4 border">Bloque No Soportado</div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      
      {blocks.map((block, index) => (
        <div key={block.id} className="relative group mb-2">
          
          {/* El Bloque en sí */}
          <div className="flex items-start gap-4">
            {/* Controles Laterales (Escondidos hasta Hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex flex-col gap-1 items-center shrink-0 w-8">
              <button className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab">
                <GripVertical className="w-4 h-4" />
              </button>
              <button 
                onClick={() => removeBlock(block.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-50"
                disabled={blocks.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido Renderizado */}
            <div className="flex-1 min-w-0">
               {renderBlockEditor(block)}
            </div>
          </div>

          {/* Separador Intermedio + Botón Añadir Sección */}
          <div className="relative h-10 w-full flex items-center justify-center my-2 group/separator">
            {/* Línea Divisoria que aparece al hacer hover sobre la separación */}
            <div className="absolute inset-0 flex items-center px-12 opacity-0 group-hover/separator:opacity-100 transition-opacity">
               <div className="w-full border-t-2 border-primary/20 border-dashed"></div>
            </div>
            
            {/* Botón flotante (+) */}
            <Button
              variant="outline"
              size="icon"
              className="absolute z-10 w-8 h-8 rounded-full bg-background border-primary text-primary opacity-0 group-hover/separator:opacity-100 shadow-sm transition-all hover:scale-110"
              onClick={() => setActiveMenuIndex(activeMenuIndex === index ? null : index)}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Menú de Tipos de Bloque emergente */}
            <AnimatePresence>
              {activeMenuIndex === index && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-10 z-20 w-[400px] bg-card border border-border shadow-xl rounded-xl p-4 grid grid-cols-2 gap-3"
                >
                  <button onClick={() => addBlock(index, 'heading')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left border border-transparent hover:border-border transition-colors">
                    <div className="bg-primary/10 text-primary p-2 rounded-md"><Type className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-medium text-sm">Subtítulo</h4>
                      <p className="text-xs text-muted-foreground">Encabezado principal</p>
                    </div>
                  </button>
                  <button onClick={() => addBlock(index, 'text')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left border border-transparent hover:border-border transition-colors">
                    <div className="bg-primary/10 text-primary p-2 rounded-md"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-medium text-sm">Texto Largo</h4>
                      <p className="text-xs text-muted-foreground">Párrafo con formato</p>
                    </div>
                  </button>
                  <button onClick={() => addBlock(index, 'image')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left border border-transparent hover:border-border transition-colors">
                    <div className="bg-secondary/10 text-secondary p-2 rounded-md"><ImageIcon className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-medium text-sm">Multimedia</h4>
                      <p className="text-xs text-muted-foreground">Imagen, audio o video</p>
                    </div>
                  </button>
                  <button onClick={() => addBlock(index, 'quiz')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/10 text-left border border-transparent hover:border-secondary transition-colors">
                    <div className="bg-secondary/10 text-secondary p-2 rounded-md"><HelpCircle className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-medium text-sm">Quiz Rápido</h4>
                      <p className="text-xs text-muted-foreground">Pregunta multichoce</p>
                    </div>
                  </button>
                  <button onClick={() => addBlock(index, 'fill-blank')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 text-left border border-primary/20 transition-colors col-span-2">
                    <div className="bg-primary text-primary-foreground p-2 rounded-md"><CheckSquare className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-medium text-sm text-primary">Fill in the Blanks (Interactivo)</h4>
                      <p className="text-xs text-primary/70">Crea un espacio vacío que el alumno escriba</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}
      
    </div>
  );
}
