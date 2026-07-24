import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UsersTable from "./UsersTable";

export const metadata = {
  title: "Usuarios | Admin Dialektoz",
};

async function getUsers() {
  const adminClient = createAdminClient();
  const [profilesRes, authRes] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, first_name, last_name, role"),
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
  const actorRole = profile?.role ?? "free";
  if (actorRole !== "admin" && actorRole !== "superadmin") redirect("/admin");

  const users = await getUsers();

  return (
    <div className="px-6 lg:px-10 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Administración
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-foreground/60 text-sm mt-1">
          Gestiona los roles y membresías de los usuarios
        </p>
      </div>

      <UsersTable users={users} actorRole={actorRole} />
    </div>
  );
}
