import Sidebar from "@/components/layout/Sidebar";
import LearnDashboard from "@/components/learn/LearnDashboard";
import TopNavigation from "@/components/layout/TopNavigation";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
export const metadata = {
  title: "Aprender | Dialektoz",
  description: "Ruta de aprendizaje estructurado Dialektoz",
};

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/session';
import { Level } from '@/types/learning';
import { getLevelProgressMap } from '@/lib/learning';
import { summarizeAuthors } from '@/lib/authors';

export default async function LearnPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ data }, { data: authorRows }, progress] = await Promise.all([
    supabase
      .from('levels')
      .select('id, code, title, description, creator_name, order_index, icon_url')
      .eq('published', true)
      .order('order_index', { ascending: true }),
    supabase.from('lessons').select('level_id, author_name').eq('published', true).not('author_name', 'is', null),
    getLevelProgressMap(supabase, user?.id ?? null),
  ]);

  const authorsByLevel = new Map<string, string[]>();
  (authorRows ?? []).forEach((r) => {
    if (!authorsByLevel.has(r.level_id)) authorsByLevel.set(r.level_id, []);
    authorsByLevel.get(r.level_id)!.push(r.author_name);
  });

  // Transform DB data to match Level interface
  const dbLevels: Level[] = (data || []).map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    // Main author = whoever wrote the most published lessons; falls back to the level creator.
    creatorName:
      summarizeAuthors(authorsByLevel.get(row.id) ?? [])[0]?.name || row.creator_name || 'Equipo Dialektoz',
    creatorRole: 'Instructor',
    iconUrl: row.icon_url ?? undefined,
    progressPercentage: progress.get(row.id)?.percent ?? 0,
    skills: [],
    bucket: { grammar: [], vocabulary: [], expressions: [] }
  }));

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />
        <LearnDashboard levels={dbLevels} />
      </main>
      <MobileBottomNav />
    </div>
  );
}
