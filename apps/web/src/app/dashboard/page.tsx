import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import CourseProgress from "@/components/dashboard/CourseProgress";
import TopNavigation from "@/components/layout/TopNavigation";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const metadata = {
  title: "Dashboard | Dialektoz",
  description: "Tu panel de progreso principal",
};

export default function Dashboard() {
  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />
        <CourseProgress />
      </main>
      <div className="hidden xl:block">
        <RightPanel />
      </div>
      <MobileBottomNav />
    </div>
  );
}
