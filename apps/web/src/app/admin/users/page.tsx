import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import RoleSelector from "./RoleSelector";

export const metadata = {
  title: "Usuarios | Admin Dialektoz",
};

async function getUsers() {
  const adminClient = createAdminClient();
  // Teachers are managed from /admin/teachers — exclude them here.
  const [profilesRes, authRes] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, first_name, last_name, role")
      .neq("role", "teacher"),
    // listUsers reads from auth.users, the only place email lives.
    // perPage 1000 covers us until we need real pagination.
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesRes.error) console.error("[admin/users] profiles:", profilesRes.error.message);
  if (authRes.error) console.error("[admin/users] auth:", authRes.error.message);

  const emailById = new Map(
    (authRes.data?.users ?? []).map((u) => [u.id, u.email ?? null]),
  );

  return (profilesRes.data ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? null,
  }));
}

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
        <p className="text-foreground/60 text-sm mt-1">
          {users.length} usuarios registrados (sin contar profesores)
        </p>
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
                <th className="text-left px-6 py-4 font-medium">Correo</th>
                <th className="text-left px-6 py-4 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {u.first_name ?? "Sin nombre"}
                  </td>
                  <td className="px-6 py-4 text-foreground/70">{u.last_name ?? "—"}</td>
                  <td className="px-6 py-4 text-foreground/70">{u.email ?? "—"}</td>
                  <td className="px-6 py-4">
                    <RoleSelector userId={u.id} currentRole={u.role ?? "free"} />
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
