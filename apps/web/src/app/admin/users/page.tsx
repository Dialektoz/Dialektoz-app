import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Usuarios | Admin Dialektoz",
};

async function getUsers() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, role");

  if (error) console.error("[admin/users]", error.message);
  return data ?? [];
}

const roleLabel: Record<string, string> = {
  admin: "Admin",
  teacher: "teacher",
  student: "free",
};

const roleBadge: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  teacher: "bg-green-500/15 text-green-600",
  student: "bg-foreground/10 text-foreground/60",
};

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  if (profile?.role !== "admin") redirect("/admin");

  const users = await getUsers();

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-foreground/60 text-sm mt-1">{users.length} usuarios registrados</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-foreground/40">
            <Users size={40} className="mb-3" />
            <p className="font-medium">No hay usuarios aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-foreground/50 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-4 font-medium">Nombre</th>
                <th className="text-left px-6 py-4 font-medium">Apellido</th>
                <th className="text-left px-6 py-4 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {user.first_name ?? "Sin nombre"}
                  </td>
                  <td className="px-6 py-4 text-foreground/70">{user.last_name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role] ?? roleBadge.student}`}>
                      {roleLabel[user.role] ?? user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
