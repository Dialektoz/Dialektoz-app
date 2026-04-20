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

export default async function LearnPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('levels')
    .select('*')
    .eq('published', true)
    .order('order_index', { ascending: true });
  
  // Transform DB data to match Level interface
  const dbLevels: Level[] = (data || []).map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    creatorName: 'Sarah Jenkins', // Hardcoded for now as per DB schema
    creatorRole: 'Diseñadora de Currículo Principal',
    progressPercentage: 0,
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
