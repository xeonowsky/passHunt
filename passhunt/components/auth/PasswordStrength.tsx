import { checkStrength } from "@/lib/auth/password-strength";

const BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-accent",
  "bg-accent",
];

export function PasswordStrength({ password }: { password: string }) {
  const s = checkStrength(password);
  const filled = password ? s.score + 1 : 0;

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filled ? BAR_COLORS[s.score] : "bg-line"
            }`}
          />
        ))}
      </div>
      {password && (
        <div className="mt-2 flex items-start justify-between gap-4 text-xs">
          <ul className="space-y-0.5 text-muted">
            {s.hints.slice(0, 2).map((h) => (
              <li key={h}>· {h}</li>
            ))}
          </ul>
          <span className="shrink-0 font-mono text-foreground">
            {s.label} <span className="text-muted">~{s.bits} bit</span>
          </span>
        </div>
      )}
    </div>
  );
}
