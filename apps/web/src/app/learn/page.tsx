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
import { Level } from '@/types/learning';
import { getLevelProgressMap } from '@/lib/learning';

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('levels')
    .select('id, code, title, description, creator_name, order_index')
    .eq('published', true)
    .order('order_index', { ascending: true });

  const progress = await getLevelProgressMap(supabase, user?.id ?? null);

  // Transform DB data to match Level interface
  const dbLevels: Level[] = (data || []).map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    creatorName: row.creator_name || 'Equipo Dialektoz',
    creatorRole: 'Instructor',
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
