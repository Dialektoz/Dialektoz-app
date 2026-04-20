'use client'

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AddTeacherForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (fetchError || !profile) {
      setError("No se encontró ningún usuario con ese email.");
      setLoading(false);
      return;
    }

    if (profile.role === "teacher") {
      setError("Este usuario ya es profesor.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "teacher" })
      .eq("id", profile.id);

    if (updateError) {
      setError("Error al actualizar el rol. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      router.refresh();
    }, 1200);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Plus size={16} />
        Agregar profesor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Agregar profesor</h2>
              <button onClick={() => { setOpen(false); setError(null); setEmail(""); }} className="text-foreground/50 hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-1.5">
                  Email del usuario
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-foreground/50 mt-1.5">
                  El usuario debe tener una cuenta registrada en la plataforma.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  Rol actualizado correctamente.
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
