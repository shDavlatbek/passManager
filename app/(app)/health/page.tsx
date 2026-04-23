"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useVaultStore } from "@/lib/vault-store";
import { analyzeVault, type VaultAnalysis } from "@/lib/vault-analysis";
import { checkPasswordsBreach, type BreachResult } from "@/lib/breach";
import { PageHeader } from "@/components/VaultShell";
import { EmptyState } from "@/components/EmptyState";
import { Shield, AlertTriangle, Refresh, ChartPie, Key } from "@/components/icons";
import { faviconFor } from "@/lib/favicon";

type BreachMap = Map<string, BreachResult>;

export default function HealthPage() {
  const entries = useVaultStore((s) => s.entries);
  const [analysis, setAnalysis] = useState<VaultAnalysis | null>(null);
  const [breaches, setBreaches] = useState<BreachMap | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    void analyzeVault(entries).then(setAnalysis);
  }, [entries]);

  async function runScan() {
    if (scanning) return;
    setScanError(null);
    setScanning(true);
    try {
      const r = await checkPasswordsBreach(entries.map((e) => e.password));
      setBreaches(r);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  if (entries.length === 0) {
    return (
      <>
        <PageHeader title="Health" icon={Shield} subtitle="Monitor the security posture of your vault." />
        <EmptyState
          title="Nothing to check yet."
          body="Once you add credentials, the health dashboard will flag reused, weak, and breached passwords."
          actions={<Link href="/vault/new" className="btn btn-primary">Add a credential</Link>}
        />
      </>
    );
  }

  const reusedCount = analysis?.reusedIds.size ?? 0;
  const weakCount = analysis?.weakIds.size ?? 0;
  const oldCount = analysis?.oldIds.size ?? 0;
  const breachedCount = breaches
    ? Array.from(breaches.values()).filter((b) => b.count > 0).length
    : 0;
  const totalPassword = entries.length;
  const clean = totalPassword - new Set<string>([
    ...(analysis?.reusedIds ?? []),
    ...(analysis?.weakIds ?? []),
    ...(breaches ? entries.filter((e) => (breaches.get(e.password)?.count ?? 0) > 0).map((e) => e.id) : []),
  ]).size;

  return (
    <>
      <PageHeader
        title="Health"
        subtitle="Weak, reused, stale, and breached passwords in one place."
        icon={Shield}
        right={
          <button onClick={runScan} disabled={scanning} className="btn btn-primary">
            <Refresh className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : breaches ? "Re-scan breaches" : "Scan for breaches"}
          </button>
        }
      />

      {scanError && (
        <div className="card border-[rgba(240,84,79,0.3)] p-4 mb-4 text-sm text-[var(--color-danger)]">
          {scanError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clean" value={clean} accent="accent" icon={Shield} />
        <StatCard label="Reused" value={reusedCount} accent="warn" icon={ChartPie} />
        <StatCard label="Weak" value={weakCount} accent="warn" icon={Key} />
        <StatCard label="Breached" value={breaches ? breachedCount : "—"} accent="danger" icon={AlertTriangle} note={breaches ? undefined : "Run scan"} />
      </div>

      <Section
        title="Breached passwords"
        subtitle="Found in public breach databases via HIBP (k-anonymity — only the first 5 SHA-1 hex characters are sent)."
      >
        {!breaches ? (
          <EmptyRow text="Run the breach scan to check every password." />
        ) : breachedCount === 0 ? (
          <EmptyRow text="No breached passwords found." accent="accent" />
        ) : (
          entries
            .filter((e) => (breaches.get(e.password)?.count ?? 0) > 0)
            .map((e) => (
              <IssueRow
                key={e.id}
                entry={e}
                tag={`Seen in ${breaches.get(e.password)?.count.toLocaleString()} breaches`}
                tagClass="chip-danger"
              />
            ))
        )}
      </Section>

      <Section title="Reused passwords" subtitle="The same password protects multiple accounts.">
        {analysis?.reuseGroups.length
          ? analysis.reuseGroups.map((group, i) => (
              <div key={i} className="card p-4 mb-2">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-warning)] mb-2">
                  {group.length} accounts share a password
                </div>
                <div className="space-y-1.5">
                  {group.map((id) => {
                    const e = entries.find((x) => x.id === id);
                    if (!e) return null;
                    return (
                      <Link
                        key={id}
                        href={`/vault/${id}`}
                        className="flex items-center gap-3 text-sm hover:text-[var(--color-text)] text-[var(--color-muted-strong)] transition-colors"
                      >
                        <FaviconDot url={e.url} />
                        <span className="flex-1 truncate">{e.service}</span>
                        <span className="text-xs text-[var(--color-muted)]">{e.username}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          : <EmptyRow text="No reused passwords." accent="accent" />}
      </Section>

      <Section title="Weak passwords" subtitle="Score of weak by strength heuristics.">
        {weakCount === 0 ? (
          <EmptyRow text="No weak passwords." accent="accent" />
        ) : (
          entries
            .filter((e) => analysis?.weakIds.has(e.id))
            .map((e) => <IssueRow key={e.id} entry={e} tag="Weak" tagClass="chip-warn" />)
        )}
      </Section>

      <Section title="Older than 90 days" subtitle="Passwords that haven't been rotated in a while.">
        {oldCount === 0 ? (
          <EmptyRow text="All passwords are fresh." accent="accent" />
        ) : (
          entries
            .filter((e) => analysis?.oldIds.has(e.id))
            .map((e) => (
              <IssueRow
                key={e.id}
                entry={e}
                tag={`${Math.round((Date.now() - e.passwordChangedAt) / (1000 * 60 * 60 * 24))} days old`}
                tagClass="chip"
              />
            ))
        )}
      </Section>
    </>
  );
}

function StatCard({ label, value, accent, icon: Icon, note }: { label: string; value: number | string; accent: "accent" | "warn" | "danger"; icon: React.ComponentType<{ className?: string }>; note?: string }) {
  const color = accent === "accent" ? "text-[var(--color-accent)]" : accent === "warn" ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]";
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="font-display text-3xl font-bold leading-none">{value}</div>
      {note && <div className="text-[11px] text-[var(--color-muted)] mt-1">{note}</div>}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

function EmptyRow({ text, accent }: { text: string; accent?: "accent" }) {
  return (
    <div className={`card p-4 text-sm ${accent === "accent" ? "text-[var(--color-accent)] border-[rgba(47,182,127,0.2)]" : "text-[var(--color-muted)]"}`}>
      {text}
    </div>
  );
}

function IssueRow({ entry, tag, tagClass }: { entry: { id: string; service: string; username?: string; url?: string }; tag: string; tagClass: string }) {
  return (
    <Link href={`/vault/${entry.id}`} className="card p-4 mb-2 flex items-center gap-3 hover:border-[var(--color-border-strong)] transition">
      <FaviconDot url={entry.url} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entry.service}</div>
        {entry.username && <div className="text-xs text-[var(--color-muted)] truncate">{entry.username}</div>}
      </div>
      <span className={`chip ${tagClass}`}>{tag}</span>
    </Link>
  );
}

function FaviconDot({ url }: { url?: string }) {
  const icon = faviconFor(url);
  return (
    <div className="w-8 h-8 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="w-4 h-4 object-contain" />
      ) : (
        <Key className="w-3.5 h-3.5 text-[var(--color-muted)]" />
      )}
    </div>
  );
}
