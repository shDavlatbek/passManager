"use client";
import { useEffect, useState } from "react";
import { generateTotp } from "@/lib/totp";
import { CopyButton } from "@/components/CopyButton";

export function TotpDisplay({ secret }: { secret: string }) {
  const [state, setState] = useState<{ code: string; progress: number; secondsLeft: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await generateTotp(secret);
        if (alive) setState(r);
      } catch {
        if (alive) setError("Invalid secret");
      }
    }
    void tick();
    const id = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(id); };
  }, [secret]);

  if (error) {
    return (
      <div className="card p-5 border-[rgba(240,84,79,0.3)] text-sm text-[var(--color-danger)]">
        {error}
      </div>
    );
  }
  if (!state) {
    return <div className="card p-5 text-sm text-[var(--color-muted)]">Computing code…</div>;
  }

  return (
    <div className="card p-5 flex items-center gap-5">
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1">Two-factor code</div>
        <div className="font-mono font-medium text-3xl tracking-[0.25em] tabular-nums">
          {state.code.slice(0, 3)}&nbsp;{state.code.slice(3)}
        </div>
      </div>
      <div
        className="ring-progress"
        style={{ "--progress": state.progress, "--size": "44px" } as React.CSSProperties}
        aria-label={`${state.secondsLeft} seconds remaining`}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[var(--color-muted-strong)]">
          {state.secondsLeft}
        </span>
      </div>
      <CopyButton value={state.code} variant="secondary" label="Copy" />
    </div>
  );
}
