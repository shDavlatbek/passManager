"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/lib/vault-store";
import { analyzeStrength } from "@/lib/strength";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, LockOpen, Sparkle, ArrowRight, Shield } from "@/components/icons";

export default function LockScreen() {
  const router = useRouter();
  const { status, unlock, createVault } = useVaultStore();
  const [mode, setMode] = useState<"unlock" | "create">("unlock");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unlocked") router.replace("/vault");
    if (status === "empty") setMode("create");
    if (status === "locked") setMode("unlock");
  }, [status, router]);

  const strength = mode === "create" ? analyzeStrength(password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        if (password.length < 10) {
          setError("Master password must be at least 10 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        if (strength && strength.score < 2) {
          setError("Please choose a stronger master password.");
          return;
        }
        await createVault(password);
      } else {
        const ok = await unlock(password);
        if (!ok) {
          setError("Wrong password.");
          return;
        }
      }
      router.replace("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="ambient-glow" aria-hidden />

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-soft)] border border-[rgba(47,182,127,0.3)] flex items-center justify-center text-[var(--color-accent)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Vaulthaus</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] mt-1">Team credential vault</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card p-7"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-strong)]">
                {mode === "create" ? <Sparkle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h1 className="font-display text-lg font-bold leading-tight">
                  {mode === "create" ? "Create your vault" : "Unlock your vault"}
                </h1>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {mode === "create"
                    ? "Your master password never leaves this device."
                    : "Enter your master password to continue."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] block mb-1.5">
                  Master password
                </label>
                <input
                  type="password"
                  className="input input-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete={mode === "create" ? "new-password" : "current-password"}
                  placeholder="••••••••••••"
                  disabled={busy}
                />
              </div>

              {mode === "create" && (
                <>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] block mb-1.5">
                      Confirm
                    </label>
                    <input
                      type="password"
                      className="input input-mono"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      disabled={busy}
                    />
                  </div>

                  {strength && strength.label !== "empty" && (
                    <StrengthHint strength={strength} />
                  )}
                </>
              )}

              {error && (
                <div className="text-xs text-[var(--color-danger)] bg-[rgba(240,84,79,0.08)] border border-[rgba(240,84,79,0.25)] rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !password}
                className="btn btn-primary w-full"
              >
                {busy ? (
                  "Working…"
                ) : (
                  <>
                    <LockOpen className="w-4 h-4" />
                    {mode === "create" ? "Create vault" : "Unlock"}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>
            </form>

            {status !== "empty" && (
              <p className="text-[11px] text-[var(--color-muted)] mt-5 text-center">
                Forgotten your master password? It cannot be recovered — by design.
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center text-[11px] text-[var(--color-muted)] space-x-3">
          <span>Zero-knowledge</span>
          <span>·</span>
          <span>AES-256-GCM</span>
          <span>·</span>
          <span>PBKDF2 / 600k</span>
        </div>
      </div>
    </main>
  );
}

function StrengthHint({ strength }: { strength: ReturnType<typeof analyzeStrength> }) {
  const width = `${((strength.score + 1) / 5) * 100}%`;
  const color =
    strength.label === "weak"
      ? "var(--color-danger)"
      : strength.label === "fair"
      ? "var(--color-warning)"
      : "var(--color-accent)";
  return (
    <div>
      <div className="h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width, background: color }}
        />
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color }}>
          {strength.label}
        </span>
        {strength.warning && <span className="text-[11px] text-[var(--color-muted)] truncate ml-3">{strength.warning}</span>}
      </div>
    </div>
  );
}
