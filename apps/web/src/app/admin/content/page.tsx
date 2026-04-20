import Link from 'next/link';
import { createAdminClient } from '@/utils/supabase/admin';
import { Plus, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Contenido | Admin Dialektoz',
};

async function getLevels() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('levels')
    .select('id, code, title, description, published');

  if (error) console.error('[admin/content]', error.message);
  return data ?? [];
}

export default async function ContentPage() {
  const levels = await getLevels();

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contenido</h1>
          <p className="text-foreground/60 text-sm mt-1">
            {levels.length} niveles creados — gestiona los cursos y lecciones.
          </p>
        </div>
        <Link
          href="/admin/content/levels/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Crear Nivel
        </Link>
      </div>

      {levels.length === 0 ? (
        <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 text-foreground/40">
          <BookOpen size={40} className="mb-3" />
          <p className="font-medium">No hay niveles aún</p>
          <p className="text-sm mt-1">Crea el primer nivel para empezar a construir el currículo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => (
            <Link
              key={level.id}
              href={`/admin/content/levels/${level.code}`}
              className="bg-card border border-border hover:border-primary/50 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-black text-primary">{level.code}</span>
                {level.published ? (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-500/15 text-green-600 font-bold">
                    Publicado
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-bold">
                    Borrador
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                {level.title}
              </h3>
              <p className="text-sm text-foreground/60 line-clamp-2">
                {level.description || 'Sin descripción'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
