import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import CourseProgress from "@/components/dashboard/CourseProgress";
import TopNavigation from "@/components/layout/TopNavigation";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { createClient } from "@/utils/supabase/server";
import { getCurrentProfile } from "@/utils/supabase/session";
import { getDashboardData, getLeaderboard } from "@/lib/dashboard";
import WelcomeTour from "@/components/dashboard/WelcomeTour";

export const metadata = {
  title: "Dashboard | Dialektoz",
  description: "Tu panel de progreso principal",
};

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  teacher: "Profesor",
  premium: "Estudiante Premium",
  student_premium: "Estudiante Premium",
  free: "Estudiante",
};

export default async function Dashboard() {
  const supabase = await createClient();
  // Deduplicated with the sidebar via React cache — one user+profile fetch.
  const current = await getCurrentProfile();

  const [data, leaderboard] = await Promise.all([
    getDashboardData(supabase, current?.id ?? null),
    getLeaderboard(supabase, 6),
  ]);

  const displayName = current?.name ?? "Estudiante";
  const profile = {
    name: displayName,
    roleLabel: roleLabels[current?.role ?? "free"] ?? "Estudiante",
    avatarUrl: current?.avatarUrl ?? null,
  };

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />
        <CourseProgress currentCourse={data.currentCourse} review={data.review} firstName={displayName.split(" ")[0]} />
      </main>
      <RightPanel
        profile={profile}
        stats={data.stats}
        achievements={data.achievements}
        leaderboard={leaderboard}
        currentUserId={current?.id ?? null}
      />
      <MobileBottomNav />
      <WelcomeTour />
    </div>
  );
}
