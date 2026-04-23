"use client";
import { useEffect, useState } from "react";
import { generatePassword, type GeneratorOptions } from "@/lib/generator";
import { useVaultStore } from "@/lib/vault-store";
import { PageHeader } from "@/components/VaultShell";
import { StrengthMeter } from "@/components/StrengthMeter";
import { CopyButton } from "@/components/CopyButton";
import { Sparkle, Refresh } from "@/components/icons";

export default function GeneratorPage() {
  const settings = useVaultStore((s) => s.meta?.settings);
  const updateSettings = useVaultStore((s) => s.updateSettings);
  const [options, setOptions] = useState<GeneratorOptions>(
    settings?.defaultGenerator ?? {
      length: 20, upper: true, lower: true, digits: true, symbols: true, excludeAmbiguous: false,
    },
  );
  const [password, setPassword] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setPassword(generatePassword(options));
  }, [options]);

  function regen() {
    const p = generatePassword(options);
    setPassword(p);
    setHistory((h) => [p, ...h.filter((x) => x !== p)].slice(0, 10));
  }

  async function saveAsDefault() {
    await updateSettings({ defaultGenerator: options });
  }

  return (
    <>
      <PageHeader
        title="Password generator"
        subtitle="Cryptographically random. Never transmitted. Copied with auto-clear."
        icon={Sparkle}
      />

      <div className="card p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="font-mono text-xl md:text-2xl tracking-[0.08em] flex-1 truncate select-all break-all">
            {password || "—"}
          </div>
          <button onClick={regen} className="btn btn-secondary" aria-label="Regenerate"><Refresh className="w-4 h-4" /></button>
          <CopyButton value={password} variant="secondary" label="Copy" />
        </div>

        <div className="mb-8"><StrengthMeter password={password} /></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">Length</span>
              <span className="font-mono text-sm">{options.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            <Toggle label="Uppercase (A–Z)" value={options.upper} onChange={(v) => setOptions({ ...options, upper: v })} />
            <Toggle label="Lowercase (a–z)" value={options.lower} onChange={(v) => setOptions({ ...options, lower: v })} />
            <Toggle label="Digits (0–9)" value={options.digits} onChange={(v) => setOptions({ ...options, digits: v })} />
            <Toggle label="Symbols (!@#$…)" value={options.symbols} onChange={(v) => setOptions({ ...options, symbols: v })} />
            <Toggle label="Exclude ambiguous (O 0 I l 1)" value={options.excludeAmbiguous} onChange={(v) => setOptions({ ...options, excludeAmbiguous: v })} />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center gap-3">
          <button onClick={saveAsDefault} className="btn btn-ghost text-xs">Save as default</button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-3">Recent</div>
          <div className="space-y-1.5">
            {history.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-mono text-[var(--color-muted-strong)] hover:text-[var(--color-text)] transition-colors">
                <div className="flex-1 truncate">{p}</div>
                <CopyButton value={p} variant="ghost" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer select-none group">
      <span className="text-sm text-[var(--color-muted-strong)] group-hover:text-[var(--color-text)] transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-2)] border border-[var(--color-border)]"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#0b0d0e] transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}
