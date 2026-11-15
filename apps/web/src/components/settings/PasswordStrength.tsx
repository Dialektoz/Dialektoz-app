// Strength hint shown while typing a new password (not enforced beyond the 8-character minimum).
export default function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ];
  const passed = checks.filter((c) => c.ok).length;

  const color =
    passed === 0 ? 'bg-border'
    : passed === 1 ? 'bg-red-500'
    : passed === 2 ? 'bg-yellow-500'
    : 'bg-green-500';

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passed ? color : 'bg-border'}`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={`text-xs flex items-center gap-1.5 transition-colors ${c.ok ? 'text-green-400' : 'text-foreground/40'}`}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
