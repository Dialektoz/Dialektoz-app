import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import CourseProgress from "@/components/dashboard/CourseProgress";

export default function Home() {
  return (
    <div className="flex w-full h-screen bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-6 border-x border-border/50 custom-scrollbar">
        <CourseProgress />
      </main>
      <RightPanel />
    </div>
  );
}
