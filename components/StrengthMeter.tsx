"use client";
import { analyzeStrength } from "@/lib/strength";

export function StrengthMeter({ password, compact = false }: { password: string; compact?: boolean }) {
  const s = analyzeStrength(password);
  if (s.label === "empty") return null;
  const segments = [0, 1, 2, 3, 4];

  const color =
    s.label === "weak" ? "var(--color-danger)" : s.label === "fair" ? "var(--color-warning)" : "var(--color-accent)";

  if (compact) {
    return (
      <span
        className={`strength-dot ${
          s.label === "weak" ? "strength-weak" : s.label === "fair" ? "strength-fair" : "strength-strong"
        }`}
        title={`${s.label} password`}
        aria-label={`Password strength: ${s.label}`}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {segments.map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i <= s.score ? color : "var(--color-surface-2)" }}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.15em] font-medium" style={{ color }}>
          {s.label}
        </span>
        {s.crackSeconds > 0 && (
          <span className="text-[11px] text-[var(--color-muted)] font-mono">
            {formatDuration(s.crackSeconds)} to crack
          </span>
        )}
      </div>
      {s.warning && <p className="text-[11px] text-[var(--color-muted)]">{s.warning}</p>}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} yr`;
  if (years < 1e6) return `${(years / 1000).toFixed(0)}k yr`;
  if (years < 1e9) return `${(years / 1e6).toFixed(0)}M yr`;
  return "centuries";
}
