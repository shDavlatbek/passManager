"use client";
import Link from "next/link";
import { useState } from "react";
import type { DecryptedEntry } from "@/types/vault";
import { faviconFor, hostnameOf } from "@/lib/favicon";
import { StrengthMeter } from "@/components/StrengthMeter";
import { CopyButton } from "@/components/CopyButton";
import { Key, Tag, Shield } from "@/components/icons";

export function CredentialCard({
  entry,
  reused,
  breached,
}: {
  entry: DecryptedEntry;
  reused?: boolean;
  breached?: number;
}) {
  const host = hostnameOf(entry.url);
  const icon = faviconFor(entry.url);
  const [iconBad, setIconBad] = useState(false);

  return (
    <Link
      href={`/vault/${entry.id}`}
      className="card px-5 py-4 flex items-center gap-4 hover:border-[var(--color-border-strong)] transition-all group fade-up"
    >
      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
        {icon && !iconBad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => setIconBad(true)}
          />
        ) : (
          <Key className="w-4 h-4 text-[var(--color-muted)]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="font-medium text-sm truncate">{entry.service}</div>
          {entry.hasTotp && <span className="chip chip-accent">2FA</span>}
          {reused && <span className="chip chip-warn">Reused</span>}
          {typeof breached === "number" && breached > 0 && <span className="chip chip-danger">Breached</span>}
        </div>
        <div className="text-xs text-[var(--color-muted)] flex items-center gap-2 truncate">
          {entry.username && <span className="truncate">{entry.username}</span>}
          {host && entry.username && <span>·</span>}
          {host && <span className="truncate font-mono text-[11px]">{host}</span>}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {entry.tags.slice(0, 2).map((t) => (
          <span key={t} className="chip"><Tag className="w-3 h-3" />{t}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StrengthMeter password={entry.password} compact />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          {entry.username && <CopyButton value={entry.username} variant="ghost" />}
          <CopyButton value={entry.password} variant="ghost" />
        </div>
      </div>
    </Link>
  );
}

export function SafetyBadge({ reusedCount, breachedCount }: { reusedCount: number; breachedCount: number }) {
  const all = reusedCount === 0 && breachedCount === 0;
  return (
    <div className={`chip ${all ? "chip-accent" : "chip-warn"}`}>
      <Shield className="w-3 h-3" />
      {all ? "All clear" : `${reusedCount + breachedCount} issue${reusedCount + breachedCount === 1 ? "" : "s"}`}
    </div>
  );
}
