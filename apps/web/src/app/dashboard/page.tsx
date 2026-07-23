import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import CourseProgress from "@/components/dashboard/CourseProgress";
import TopNavigation from "@/components/layout/TopNavigation";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { createClient } from "@/utils/supabase/server";
import { getDashboardData, getLeaderboard } from "@/lib/dashboard";

export const metadata = {
  title: "Dashboard | Dialektoz",
  description: "Tu panel de progreso principal",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  teacher: "Profesor",
  premium: "Estudiante Premium",
  student_premium: "Estudiante Premium",
  free: "Estudiante",
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileRow: { full_name: string | null; email: string | null; avatar_url: string | null; role: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url, role")
      .eq("id", user.id)
      .single();
    profileRow = data;
  }

  const [data, leaderboard] = await Promise.all([
    getDashboardData(supabase, user?.id ?? null),
    getLeaderboard(supabase, 6),
  ]);

  const displayName =
    profileRow?.full_name?.trim() ||
    profileRow?.email?.split("@")[0] ||
    "Estudiante";
  const profile = {
    name: displayName,
    roleLabel: roleLabels[profileRow?.role ?? "free"] ?? "Estudiante",
    avatarUrl: profileRow?.avatar_url ?? null,
  };

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />
        <CourseProgress currentCourse={data.currentCourse} review={data.review} firstName={displayName.split(" ")[0]} />
      </main>
      <div className="hidden xl:block">
        <RightPanel
          profile={profile}
          stats={data.stats}
          achievements={data.achievements}
          leaderboard={leaderboard}
          currentUserId={user?.id ?? null}
        />
      </div>
      <MobileBottomNav />
    </div>
  );
}
