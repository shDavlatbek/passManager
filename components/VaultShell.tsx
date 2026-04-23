"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useVaultStore } from "@/lib/vault-store";
import { TransitionShell } from "@/lib/transition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Vault, Sparkle, Shield, Settings, Share, Upload, Plus, Lock, Key } from "@/components/icons";

const nav = [
  { href: "/vault", label: "Vault", icon: Vault },
  { href: "/generator", label: "Generator", icon: Sparkle },
  { href: "/health", label: "Health", icon: Shield },
  { href: "/share", label: "Share", icon: Share },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function VaultShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, entries, lock } = useVaultStore();

  useEffect(() => {
    if (status === "empty" || status === "locked") {
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "unlocked") return null;

  return (
    <div className="min-h-dvh">
      <aside className="fixed top-0 left-0 h-dvh w-60 border-r border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur px-4 py-6 flex flex-col overflow-hidden z-20">
        <Link href="/vault" className="flex items-center gap-2.5 px-2 mb-8 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] border border-[rgba(47,182,127,0.3)] flex items-center justify-center text-[var(--color-accent)]">
            <Shield className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-[15px] leading-none">Vaulthaus</div>
        </Link>

        <nav className="flex-1 space-y-1 min-h-0 overflow-hidden">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/vault" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "text-[var(--color-muted-strong)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active && <span className="ml-auto w-1 h-4 rounded-full bg-[var(--color-accent)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3 shrink-0">
          <Link href="/vault/new" className="btn btn-primary w-full">
            <Plus className="w-4 h-4" /> New credential
          </Link>
          <div className="text-[11px] text-[var(--color-muted)] px-2 flex items-center justify-between">
            <span>{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => { lock(); router.replace("/"); }}
                className="flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors"
                aria-label="Lock vault"
              >
                <Lock className="w-3.5 h-3.5" /> Lock
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-60 min-h-dvh overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-10 py-10">
          <TransitionShell>{children}</TransitionShell>
        </div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-6 mb-8 pb-6 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-strong)]">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

export { Key };
