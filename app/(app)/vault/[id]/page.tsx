"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useVaultStore } from "@/lib/vault-store";
import { PageHeader } from "@/components/VaultShell";
import { CredentialForm } from "@/components/CredentialForm";
import { CopyButton } from "@/components/CopyButton";
import { TotpDisplay } from "@/components/TotpDisplay";
import { faviconFor, hostnameOf } from "@/lib/favicon";
import { StrengthMeter } from "@/components/StrengthMeter";
import { Eye, EyeOff, Key, Share, Vault as VaultIcon, Tag } from "@/components/icons";

export default function CredentialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const entry = useVaultStore((s) => s.entries.find((e) => e.id === id));
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!entry) {
    return (
      <>
        <PageHeader title="Not found" subtitle="This credential may have been deleted." icon={VaultIcon} />
        <Link href="/vault" className="btn btn-secondary">Back to vault</Link>
      </>
    );
  }

  if (editing) {
    return (
      <>
        <PageHeader title={`Edit ${entry.service}`} icon={Key} />
        <div className="card p-7"><CredentialForm entry={entry} /></div>
      </>
    );
  }

  const host = hostnameOf(entry.url);
  const icon = faviconFor(entry.url);

  return (
    <>
      <PageHeader
        title={entry.service}
        subtitle={entry.username ? entry.username + (host ? ` · ${host}` : "") : host || undefined}
        right={
          <div className="flex items-center gap-2">
            <Link href={`/share?for=${entry.id}`} className="btn btn-secondary"><Share className="w-4 h-4" /> Share</Link>
            <button onClick={() => setEditing(true)} className="btn btn-primary">Edit</button>
          </div>
        }
        icon={Key}
      />

      <div className="space-y-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <Key className="w-5 h-5 text-[var(--color-muted)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-lg">{entry.service}</div>
            {entry.url && (
              <a href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
                 target="_blank" rel="noreferrer"
                 className="text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {entry.url}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            {entry.tags.map((t) => (
              <span key={t} className="chip"><Tag className="w-3 h-3" />{t}</span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1">Username</div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm flex-1 truncate">{entry.username || <span className="text-[var(--color-muted)]">—</span>}</div>
            {entry.username && <CopyButton value={entry.username} variant="secondary" label="Copy" />}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">Password</div>
            <button onClick={() => setRevealed((v) => !v)} className="btn btn-ghost px-2">
              {revealed ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Reveal</>}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm flex-1 tracking-[0.08em] select-all">
              {revealed ? entry.password : "•".repeat(Math.min(entry.password.length, 24))}
            </div>
            <CopyButton value={entry.password} variant="secondary" label="Copy" />
          </div>
          <div className="mt-4"><StrengthMeter password={entry.password} /></div>
        </div>

        {entry.totpSecret && <TotpDisplay secret={entry.totpSecret} />}

        {entry.notes && (
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">Notes</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{entry.notes}</div>
          </div>
        )}

        <div className="text-[11px] text-[var(--color-muted)] px-1 flex items-center gap-4">
          <span>Added {new Date(entry.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>Password set {new Date(entry.passwordChangedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </>
  );
}
