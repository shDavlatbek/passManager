"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useVaultStore } from "@/lib/vault-store";
import { PageHeader } from "@/components/VaultShell";
import { CredentialCard } from "@/components/CredentialCard";
import { EmptyState, VaultEmptyIllustration } from "@/components/EmptyState";
import { analyzeVault } from "@/lib/vault-analysis";
import { Vault, Plus, Search, Sparkle, Upload, Tag, AlertTriangle, ArrowRight, Shield } from "@/components/icons";

export default function VaultPage() {
  const entries = useVaultStore((s) => s.entries);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [reusedIds, setReusedIds] = useState<Set<string>>(new Set());
  const [weakIds, setWeakIds] = useState<Set<string>>(new Set());
  const [oldIds, setOldIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    analyzeVault(entries).then((a) => {
      if (cancelled) return;
      setReusedIds(a.reusedIds);
      setWeakIds(a.weakIds);
      setOldIds(a.oldIds);
    });
    return () => { cancelled = true; };
  }, [entries]);

  const tagCounts = useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach((e) => e.tags.forEach((t) => (m[t] = (m[t] || 0) + 1)));
    return m;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeTag && !e.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        e.service.toLowerCase().includes(q) ||
        (e.username?.toLowerCase().includes(q) ?? false) ||
        (e.url?.toLowerCase().includes(q) ?? false) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [entries, query, activeTag]);

  if (entries.length === 0) {
    return (
      <>
        <PageHeader title="Your vault" subtitle="Every credential, one place, end-to-end encrypted." icon={Vault} />
        <EmptyState
          title="Your vault is ready — but empty."
          body="Add your first credential, generate a strong password, or import an export from another password manager."
          illustration={<VaultEmptyIllustration />}
          actions={
            <>
              <Link href="/vault/new" className="btn btn-primary"><Plus className="w-4 h-4" /> Add first credential</Link>
              <Link href="/generator" className="btn btn-secondary"><Sparkle className="w-4 h-4" /> Generate a password</Link>
              <Link href="/import" className="btn btn-ghost"><Upload className="w-4 h-4" /> Import from CSV</Link>
            </>
          }
        />
      </>
    );
  }

  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Your vault"
        subtitle={`${entries.length} ${entries.length === 1 ? "credential" : "credentials"} encrypted on this device.`}
        icon={Vault}
        right={
          <Link href="/vault/new" className="btn btn-primary"><Plus className="w-4 h-4" /> Add new</Link>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className="input pl-10"
            placeholder="Search by service, username, URL, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <HealthBanner weak={weakIds.size} reused={reusedIds.size} old={oldIds.size} />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <button
            onClick={() => setActiveTag(null)}
            className={`chip ${!activeTag ? "chip-accent" : ""}`}
          >
            All · {entries.length}
          </button>
          {tags.map(([t, n]) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`chip ${activeTag === t ? "chip-accent" : ""}`}
            >
              <Tag className="w-3 h-3" />{t} · {n}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card px-8 py-12 text-center text-sm text-[var(--color-muted)]">
            No credentials match your filter.
          </div>
        ) : (
          filtered.map((e) => (
            <CredentialCard key={e.id} entry={e} reused={reusedIds.has(e.id)} />
          ))
        )}
      </div>
    </>
  );
}

function HealthBanner({ weak, reused, old }: { weak: number; reused: number; old: number }) {
  const total = weak + reused + old;
  if (total === 0) return null;

  const parts: string[] = [];
  if (weak > 0) parts.push(`${weak} weak`);
  if (reused > 0) parts.push(`${reused} reused`);
  if (old > 0) parts.push(`${old} older than 90 days`);

  const tone = weak > 0 ? "danger" : "warning";
  const accent =
    tone === "danger"
      ? { border: "border-[rgba(240,84,79,0.35)]", icon: "text-[var(--color-danger)]" }
      : { border: "border-[rgba(242,181,68,0.35)]", icon: "text-[var(--color-warning)]" };

  return (
    <Link
      href="/health"
      className={`card ${accent.border} p-4 mb-5 flex items-center gap-4 hover:bg-[var(--color-surface-hover)] transition-colors group`}
    >
      <div className={`w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 ${accent.icon}`}>
        {tone === "danger" ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-sm">
          {weak > 0 ? "Weak passwords detected" : "Some credentials need attention"}
        </div>
        <div className="text-xs text-[var(--color-muted-strong)] mt-0.5 truncate">
          {parts.join(" · ")} — review in Health to fix them.
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[var(--color-muted)] shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
