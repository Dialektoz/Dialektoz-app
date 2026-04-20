'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, ImagePlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function CreateLevelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.title) {
      alert('El Código del Nivel y el Título son obligatorios.');
      return;
    }

    setIsLoading(true);

    const { error, data } = await supabase
      .from('levels')
      .insert({
        code: formData.code.toUpperCase().trim(),
        title: formData.title,
        description: formData.description,
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error creating level:', JSON.stringify(error, null, 2));
      if (error.code === '23505') {
        alert(`Ya existe un nivel con el código "${formData.code}". Usa otro código.`);
      } else if (error.message?.includes('policy')) {
        alert('Acceso Denegado: Revisa los permisos RLS en Supabase.');
      } else {
        alert(`Error de base de datos: ${error.message || 'Desconocido'}`);
      }
    } else if (data) {
      alert('Nivel Creado Exitosamente!');
      router.push(`/admin/content/levels/${data.code}`);
    }
  };

  return (
    <div className="py-8 px-6 lg:px-10 max-w-3xl mx-auto w-full">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Atrás
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary drop-shadow-sm mb-2">
          Crear Nuevo Nivel
        </h1>
        <p className="text-muted-foreground text-lg">
          Personaliza la tarjeta e información principal del Nivel antes de añadir contenido.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                CÓDIGO (Ej: A1)
              </label>
              <select
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-background border border-border p-3 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground uppercase font-bold text-xl appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                TÍTULO DEL NIVEL
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Fundamentos Básicos"
                className="w-full bg-background border border-border p-3 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground font-semibold text-lg drop-shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            DESCRIPCIÓN DE LA TARJETA
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Escribe una descripción épica para motivar a los estudiantes. Aparecerá en la tarjeta principal del Nivel."
            className="w-full bg-background border border-border p-4 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground resize-none"
          />
        </div>

        <div className="mb-10 opacity-50 pointer-events-none">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            PORTADA O ICONO (PRÓXIMAMENTE)
          </label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col justify-center items-center text-muted-foreground bg-muted/10">
            <ImagePlus className="w-8 h-8 mb-3 opacity-50" />
            <span className="text-sm">Función de multimedia en desarrollo</span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="min-w-[200px] text-lg font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isLoading ? 'Creando Nivel...' : 'Guardar y Continuar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
