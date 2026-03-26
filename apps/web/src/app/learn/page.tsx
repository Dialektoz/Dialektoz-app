import Sidebar from "@/components/layout/Sidebar";
import LearnDashboard from "@/components/learn/LearnDashboard";
import TopNavigation from "@/components/layout/TopNavigation";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
export const metadata = {
  title: "Aprender | Dialektoz",
  description: "Ruta de aprendizaje estructurado Dialektoz",
};

export default function LearnPage() {
  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />
        <LearnDashboard />
      </main>
      <MobileBottomNav />
    </div>
  );
}
