import Sidebar from "@/components/layout/Sidebar";
import LearnDashboard from "@/components/learn/LearnDashboard";
import TopNavigation from "@/components/layout/TopNavigation";

export const metadata = {
  title: "Aprender | Dialektoz",
  description: "Ruta de aprendizaje estructurado Dialektoz",
};

export default function LearnPage() {
  return (
    <div className="flex w-full h-screen bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-6 border-x border-border/50 custom-scrollbar relative">
        <TopNavigation />
        <LearnDashboard />
      </main>
    </div>
  );
}
