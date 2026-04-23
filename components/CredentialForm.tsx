"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/lib/vault-store";
import { StrengthMeter } from "@/components/StrengthMeter";
import { generatePassword } from "@/lib/generator";
import { isValidBase32, parseOtpAuthUrl } from "@/lib/totp";
import type { DecryptedEntry } from "@/types/vault";
import { Eye, EyeOff, Refresh, Trash, Key, X } from "@/components/icons";

export function CredentialForm({ entry }: { entry?: DecryptedEntry }) {
  const router = useRouter();
  const { saveEntry, removeEntry, meta } = useVaultStore();
  const genDefaults = meta?.settings.defaultGenerator;

  const [service, setService] = useState(entry?.service ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [password, setPassword] = useState(entry?.password ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [totp, setTotp] = useState(entry?.totpSecret ?? "");
  const [tagsText, setTagsText] = useState((entry?.tags ?? []).join(", "));
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    if (!genDefaults) return;
    setPassword(generatePassword(genDefaults));
    setShow(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!service.trim()) { setError("Service name is required."); return; }
    if (!password) { setError("Password is required."); return; }
    let totpClean = totp.trim();
    if (totpClean.startsWith("otpauth://")) {
      const parsed = parseOtpAuthUrl(totpClean);
      if (!parsed) { setError("Invalid otpauth:// URL."); return; }
      totpClean = parsed.secret;
    }
    if (totpClean && !isValidBase32(totpClean)) {
      setError("TOTP secret must be a valid base32 string.");
      return;
    }
    setBusy(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const saved = await saveEntry({
        id: entry?.id,
        service: service.trim(),
        url: url.trim() || undefined,
        username: username.trim() || undefined,
        password,
        notes: notes.trim() || undefined,
        totpSecret: totpClean || undefined,
        tags,
      });
      router.replace(`/vault/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    if (!confirm(`Delete ${entry.service}? This cannot be undone.`)) return;
    await removeEntry(entry.id);
    router.replace("/vault");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Service" required>
          <input className="input" value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Stripe, Figma, AWS" autoFocus />
        </Field>
        <Field label="URL">
          <input className="input input-mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </Field>
      </div>

      <Field label="Username or email">
        <input className="input input-mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="team@company.com" />
      </Field>

      <Field label="Password" required>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            className="input input-mono pr-28"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button type="button" onClick={() => setShow((s) => !s)} className="btn btn-ghost px-2" title="Show / hide">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button type="button" onClick={generate} className="btn btn-ghost px-2" title="Generate strong password">
              <Refresh className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <StrengthMeter password={password} />
        </div>
      </Field>

      <Field label="Tags" hint="Comma separated. Use these to group by team, project, or purpose.">
        <input className="input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="finance, production, shared" />
      </Field>

      <Field label="TOTP secret (optional)" hint="Base32 secret or an otpauth:// URL for 2FA code generation.">
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input className="input input-mono pl-10" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="JBSWY3DPEHPK3PXP" />
        </div>
      </Field>

      <Field label="Notes">
        <textarea className="textarea min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recovery codes, security questions, etc." />
      </Field>

      {error && (
        <div className="text-xs text-[var(--color-danger)] bg-[rgba(240,84,79,0.08)] border border-[rgba(240,84,79,0.25)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
        <div>
          {entry && (
            <button type="button" onClick={handleDelete} className="btn btn-danger">
              <Trash className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Saving…" : entry ? "Save changes" : "Add credential"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {label} {required && <span className="text-[var(--color-accent)]">*</span>}
        </span>
        {hint && <span className="text-[11px] text-[var(--color-muted)] ml-3">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
