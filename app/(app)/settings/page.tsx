"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/lib/vault-store";
import { PageHeader } from "@/components/VaultShell";
import { useConfirm } from "@/components/ConfirmDialog";
import { Settings, Download, Lock, Trash } from "@/components/icons";
import { analyzeStrength } from "@/lib/strength";
import { listEntries, getVaultMeta } from "@/lib/db";

export default function SettingsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { meta, entries, updateSettings, changeMasterPassword, wipeVault } = useVaultStore();
  const [autoLock, setAutoLock] = useState(meta?.settings.autoLockMinutes ?? 5);
  const [clip, setClip] = useState(meta?.settings.clipboardClearSeconds ?? 30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");

  async function saveLockPrefs() {
    await updateSettings({ autoLockMinutes: autoLock, clipboardClearSeconds: clip });
    setMessage({ kind: "ok", text: "Preferences saved." });
  }

  async function exportEncrypted() {
    const m = await getVaultMeta();
    const es = await listEntries();
    const blob = new Blob([JSON.stringify({ meta: m, entries: es }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaulthaus-backup-${new Date().toISOString().split("T")[0]}.vault.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPlain() {
    const ok = await confirm({
      title: "Export passwords in plain text?",
      description: "The file will contain every password unencrypted. Store it only on a device you fully trust and delete it once you're done.",
      confirmLabel: "Export plaintext",
      tone: "warning",
    });
    if (!ok) return;
    const rows = entries.map((e) => ({
      service: e.service, url: e.url, username: e.username, password: e.password,
      notes: e.notes, totpSecret: e.totpSecret, tags: e.tags,
    }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaulthaus-plaintext-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportCsv() {
    const ok = await confirm({
      title: "Export passwords as CSV?",
      description: "The CSV will contain every password unencrypted — compatible with imports in most password managers. Store it only on a device you fully trust and delete it once you're done.",
      confirmLabel: "Export CSV",
      tone: "warning",
    });
    if (!ok) return;
    const header = ["service", "url", "username", "password", "notes", "totpSecret", "tags"] as const;
    const esc = (v: unknown) => {
      if (v === undefined || v === null) return "";
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const e of entries) {
      lines.push([
        esc(e.service),
        esc(e.url),
        esc(e.username),
        esc(e.password),
        esc(e.notes),
        esc(e.totpSecret),
        esc((e.tags ?? []).join("; ")),
      ].join(","));
    }
    const csv = "﻿" + lines.join("\r\n") + "\r\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaulthaus-plaintext-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function changePassword() {
    setMessage(null);
    if (!current || !next) return;
    if (next !== confirmNext) { setMessage({ kind: "err", text: "New passwords do not match." }); return; }
    if (next.length < 10 || analyzeStrength(next).score < 2) {
      setMessage({ kind: "err", text: "Choose a longer, stronger master password." });
      return;
    }
    setBusy(true);
    const ok = await changeMasterPassword(current, next);
    setBusy(false);
    if (ok) {
      setMessage({ kind: "ok", text: "Master password changed. All data re-encrypted." });
      setCurrent(""); setNext(""); setConfirmNext("");
    } else {
      setMessage({ kind: "err", text: "Current password incorrect." });
    }
  }

  async function wipe() {
    const ok = await confirm({
      title: "Wipe vault on this device?",
      description: "Removes vault metadata and every encrypted entry from this browser. This cannot be undone. Your Google Drive backup (if any) is not affected.",
      confirmLabel: "Wipe vault",
      tone: "danger",
    });
    if (!ok) return;
    await wipeVault();
    router.replace("/");
  }

  return (
    <>
      <PageHeader title="Settings" icon={Settings} subtitle="Customize lock behavior, change master password, manage backups." />

      {message && (
        <div className={`card p-3 mb-6 text-sm ${message.kind === "ok" ? "border-[rgba(47,182,127,0.3)] text-[var(--color-accent)]" : "border-[rgba(240,84,79,0.3)] text-[var(--color-danger)]"}`}>
          {message.text}
        </div>
      )}

      <Section title="Lock behavior">
        <div className="space-y-4">
          <Field label={`Auto-lock after ${autoLock} minute${autoLock === 1 ? "" : "s"} of inactivity`}>
            <input
              type="range" min={1} max={60} value={autoLock}
              onChange={(e) => setAutoLock(parseInt(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`Clipboard auto-clear after ${clip} seconds`}>
            <input
              type="range" min={5} max={120} step={5} value={clip}
              onChange={(e) => setClip(parseInt(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <button onClick={saveLockPrefs} className="btn btn-primary">Save preferences</button>
        </div>
      </Section>

      <Section title="Master password">
        <div className="space-y-4">
          <Field label="Current master password">
            <input type="password" className="input input-mono" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="New master password">
            <input type="password" className="input input-mono" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field label="Confirm new master password">
            <input type="password" className="input input-mono" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} />
          </Field>
          <button disabled={busy} onClick={changePassword} className="btn btn-primary">
            <Lock className="w-4 h-4" /> {busy ? "Re-encrypting…" : "Change master password"}
          </button>
          <p className="text-[11px] text-[var(--color-muted)]">
            All entries will be re-encrypted with a key derived from the new password. Your data never leaves the browser.
          </p>
        </div>
      </Section>

      <Section title="Export & backup">
        <div className="flex flex-col items-start gap-3">
          <button onClick={exportEncrypted} className="btn btn-secondary">
            <Download className="w-4 h-4" /> Download encrypted backup (.vault.json)
          </button>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportPlain} className="btn btn-ghost">
              <Download className="w-4 h-4" /> Export plaintext JSON
            </button>
            <button onClick={exportCsv} className="btn btn-ghost">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-muted)]">
            Encrypted backups can only be restored by re-importing the file into a vault that knows your master password.
            Plaintext exports contain every password unencrypted — use with caution.
          </p>
        </div>
      </Section>

      <Section title="Danger zone" tone="danger">
        <button onClick={wipe} className="btn btn-danger">
          <Trash className="w-4 h-4" /> Wipe vault on this device
        </button>
        <p className="text-[11px] text-[var(--color-muted)] mt-3">
          Removes the vault metadata and all encrypted entries from this browser. Cannot be undone.
        </p>
      </Section>
    </>
  );
}

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "danger" }) {
  return (
    <div className={`card p-6 mb-5 ${tone === "danger" ? "border-[rgba(240,84,79,0.25)]" : ""}`}>
      <h2 className="font-display text-base font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
