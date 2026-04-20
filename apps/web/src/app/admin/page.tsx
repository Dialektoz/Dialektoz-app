import { createAdminClient } from "@/utils/supabase/admin";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Resumen | Admin Dialektoz",
};

async function getStats() {
  const adminClient = createAdminClient();
  const [{ count: totalUsers }, { count: totalTeachers }] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalTeachers: totalTeachers ?? 0,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Usuarios totales",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Profesores",
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Estudiantes",
      value: stats.totalUsers - stats.totalTeachers,
      icon: BookOpen,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Crecimiento",
      value: "—",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Resumen</h1>
        <p className="text-foreground/60 text-sm mt-1">Vista general de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-foreground/60 text-xs font-medium">{label}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
