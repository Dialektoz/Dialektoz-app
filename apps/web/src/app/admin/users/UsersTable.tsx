'use client'

import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import RoleSelector from './RoleSelector'

type UserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: string | null
  email: string | null
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState('')

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [users, query])

  const isFiltering = query.trim().length > 0

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <p className="text-foreground/50 text-xs whitespace-nowrap">
          {isFiltering
            ? `${filteredUsers.length} de ${users.length}`
            : `${users.length} usuarios`}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-foreground/40">
            <Users size={40} className="mb-3" />
            <p className="font-medium">
              {isFiltering ? 'Sin coincidencias' : 'No hay usuarios aún'}
            </p>
            {isFiltering && (
              <p className="text-sm mt-1">Prueba con otro nombre o correo</p>
            )}
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
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {u.first_name ?? 'Sin nombre'}
                  </td>
                  <td className="px-6 py-4 text-foreground/70">{u.last_name ?? '—'}</td>
                  <td className="px-6 py-4 text-foreground/70">{u.email ?? '—'}</td>
                  <td className="px-6 py-4">
                    <RoleSelector userId={u.id} currentRole={u.role ?? 'free'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
