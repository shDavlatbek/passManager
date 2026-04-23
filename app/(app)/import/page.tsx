"use client";
import { useState } from "react";
import { detectAndMap, type DetectedCsv, type ImportedEntry } from "@/lib/csv-import";
import { useVaultStore } from "@/lib/vault-store";
import { PageHeader } from "@/components/VaultShell";
import { Upload, Check } from "@/components/icons";

export default function ImportPage() {
  const saveEntry = useVaultStore((s) => s.saveEntry);
  const [detected, setDetected] = useState<DetectedCsv | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  async function onFile(f: File) {
    const text = await f.text();
    const d = detectAndMap(text);
    setDetected(d);
    setFilename(f.name);
    setSelected(new Set(d.entries.map((_, i) => i)));
    setImported(null);
  }

  async function runImport() {
    if (!detected) return;
    setBusy(true);
    try {
      const chosen: ImportedEntry[] = detected.entries.filter((_, i) => selected.has(i));
      for (const entry of chosen) {
        await saveEntry({
          service: entry.service,
          url: entry.url,
          username: entry.username,
          password: entry.password,
          notes: entry.notes,
          totpSecret: entry.totpSecret,
          tags: entry.tags,
        });
      }
      setImported(chosen.length);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Import credentials"
        subtitle="Paste a CSV from Bitwarden, 1Password, or LastPass. Your file never leaves this browser."
        icon={Upload}
      />

      {!detected && (
        <label className="card p-10 border-dashed border-[var(--color-border-strong)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors">
          <Upload className="w-8 h-8 text-[var(--color-muted)] mb-4" />
          <div className="font-display font-bold text-base mb-1">Drop a CSV file or click to choose</div>
          <p className="text-xs text-[var(--color-muted)] max-w-sm">
            Supported: Bitwarden, 1Password, LastPass exports. Generic CSVs with a password column work too.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      )}

      {detected && (
        <>
          <div className="card p-5 mb-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1">{filename}</div>
              <div className="text-sm">
                Detected format: <span className="font-medium capitalize">{detected.format}</span> · {detected.entries.length} entries
              </div>
            </div>
            <button onClick={() => { setDetected(null); setFilename(null); setImported(null); }} className="btn btn-ghost">
              Choose another file
            </button>
          </div>

          {detected.entries.length === 0 ? (
            <div className="card p-6 text-sm text-[var(--color-muted)]">
              No credentials detected. Check that your CSV has a password column.
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] w-10"></th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">Service</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">Username</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {detected.entries.map((e, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/40">
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={(ev) => {
                            const n = new Set(selected);
                            if (ev.target.checked) n.add(i);
                            else n.delete(i);
                            setSelected(n);
                          }}
                          className="accent-[var(--color-accent)]"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium truncate max-w-[260px]">{e.service}</td>
                      <td className="px-4 py-2.5 text-[var(--color-muted-strong)] font-mono text-xs truncate max-w-[220px]">{e.username || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-muted)]">{e.tags.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 justify-end">
            <div className="text-xs text-[var(--color-muted)] mr-auto">
              {selected.size} of {detected.entries.length} selected
            </div>
            <button onClick={runImport} disabled={busy || selected.size === 0 || imported !== null} className="btn btn-primary">
              {imported !== null ? <><Check className="w-4 h-4" /> Imported {imported}</> : busy ? "Importing…" : `Import ${selected.size}`}
            </button>
          </div>
        </>
      )}
    </>
  );
}
