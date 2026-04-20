import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";
import AddTeacherForm from "../AddTeacherForm";
import RevokeButton from "./RevokeButton";

export const metadata = {
  title: "Profesores | Admin Dialektoz",
};

async function getTeachers() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, onboarding_completed")
    .eq("role", "teacher");

  if (error) console.error("[admin/teachers]", error.message);
  return data ?? [];
}

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  if (profile?.role !== "admin") redirect("/admin");

  const teachers = await getTeachers();

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profesores</h1>
        <p className="text-foreground/60 text-sm mt-1">{teachers.length} profesores registrados</p>
      </div>

      <AddTeacherForm />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-foreground/40">
            <GraduationCap size={40} className="mb-3" />
            <p className="font-medium">No hay profesores aún</p>
            <p className="text-sm mt-1">Agrega el primer profesor con el botón de arriba</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-foreground/50 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-4 font-medium">Nombre</th>
                <th className="text-left px-6 py-4 font-medium">Apellido</th>
                <th className="text-left px-6 py-4 font-medium">Rol</th>
                <th className="text-left px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {teacher.first_name ?? "Sin nombre"}
                  </td>
                  <td className="px-6 py-4 text-foreground/70">
                    {teacher.last_name ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-600">
                      teacher
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {teacher.onboarding_completed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-500">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RevokeButton userId={teacher.id} />
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
