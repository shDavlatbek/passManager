"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield } from "@/components/icons";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] border border-[rgba(47,182,127,0.3)] flex items-center justify-center text-[var(--color-accent)]">
              <Shield className="w-4 h-4" />
            </div>
            <div className="font-display font-bold text-[15px] leading-none">Vaulthaus</div>
          </Link>
          <nav className="flex items-center gap-5 text-xs">
            <Link href="/privacy-policy" className="text-[var(--color-muted-strong)] hover:text-[var(--color-text)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[var(--color-muted-strong)] hover:text-[var(--color-text)] transition-colors">
              Terms
            </Link>
            <Link href="/" className="text-[var(--color-muted-strong)] hover:text-[var(--color-text)] transition-colors">
              Open app
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-14">{children}</main>

      <footer className="border-t border-[var(--color-border)] mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--color-muted)]">
          <span>© {new Date().getFullYear()} Vaulthaus · Zero-knowledge password manager</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[var(--color-text)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalPage({
  title,
  effective,
  children,
}: {
  title: string;
  effective: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <div className="mb-10 pb-6 border-b border-[var(--color-border)]">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">
          Effective {effective}
        </div>
      </div>
      {children}
    </article>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="font-display text-lg font-bold mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">
        {children}
      </div>
    </section>
  );
}
