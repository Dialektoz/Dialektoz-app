'use client'

import { useState } from "react";
import { Loader2, UserMinus } from "lucide-react";
import { setUserRole } from "../actions";

export default function RevokeButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!confirm("¿Revocar rol de profesor? El usuario pasará a ser free.")) return;
    setLoading(true);
    await setUserRole(userId, "free");
    setLoading(false);
  };

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      title="Revocar rol"
      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors cursor-pointer"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
      Revocar
    </button>
  );
}
