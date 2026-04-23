"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/lib/vault-store";
import {
  connectGoogleDrive,
  deleteVaultFromDrive,
  disconnectGoogleDrive,
  downloadVaultFromDrive,
  DriveError,
  getClientId,
  getRemoteInfo,
  readStoredToken,
  uploadVaultToDrive,
  type DriveFileInfo,
} from "@/lib/gdrive";
import { PageHeader } from "@/components/VaultShell";
import { useConfirm } from "@/components/ConfirmDialog";
import { Cloud, CloudUp, CloudDown, LinkBreak, Refresh, AlertTriangle, Check, Trash } from "@/components/icons";

type Status = { kind: "ok" | "err" | "info"; text: string } | null;

export default function SyncPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { entries, serializeBackup, restoreFromBackup, lock } = useVaultStore();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<null | "connect" | "upload" | "download" | "delete" | "info">(null);
  const [remote, setRemote] = useState<DriveFileInfo | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [denied, setDenied] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; raw?: string } | null>(null);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const clientId = typeof window !== "undefined" ? getClientId() : null;

  useEffect(() => {
    setConnected(!!readStoredToken());
    setLastUpload(localStorage.getItem("vaulthaus.gdrive.lastUpload"));
  }, []);

  async function refreshRemote() {
    setBusy("info");
    setStatus(null);
    try {
      const info = await getRemoteInfo();
      setRemote(info);
      if (!info) setStatus({ kind: "info", text: "No vault file in your Drive yet." });
    } catch (err) {
      setConnected(!!readStoredToken());
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Lookup failed" });
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (connected) void refreshRemote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  async function handleConnect() {
    setBusy("connect");
    setStatus(null);
    setDenied(false);
    setServerError(null);
    try {
      await connectGoogleDrive();
      setConnected(true);
    } catch (err) {
      if (err instanceof DriveError) {
        if (err.kind === "denied") {
          setDenied(true);
        } else if (err.kind === "popup-closed") {
          setStatus({ kind: "info", text: err.message });
        } else if (err.kind === "missing-client" || err.kind === "popup-blocked") {
          setStatus({ kind: "err", text: err.message });
        } else {
          setServerError({ message: err.message, raw: err.raw });
        }
      } else {
        setStatus({ kind: "err", text: err instanceof Error ? err.message : "Connect failed" });
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    const ok = await confirm({
      title: "Disconnect Google Drive?",
      description: "Your cloud backup stays put — only this device forgets the access token. You can reconnect anytime.",
      confirmLabel: "Disconnect",
      tone: "warning",
    });
    if (!ok) return;
    setBusy("connect");
    try {
      await disconnectGoogleDrive();
    } catch { /* noop */ }
    setConnected(false);
    setRemote(null);
    setStatus({ kind: "info", text: "Disconnected." });
    setBusy(null);
  }

  async function handleUpload() {
    setBusy("upload");
    setStatus(null);
    try {
      const payload = await serializeBackup();
      if (!payload) throw new Error("No vault to upload.");
      const wrapped = {
        app: "vaulthaus",
        version: 1,
        uploadedAt: new Date().toISOString(),
        ...payload,
      };
      const info = await uploadVaultToDrive(wrapped);
      setRemote(info);
      const ts = new Date().toISOString();
      localStorage.setItem("vaulthaus.gdrive.lastUpload", ts);
      setLastUpload(ts);
      setStatus({ kind: "ok", text: `Uploaded ${entries.length} ${entries.length === 1 ? "entry" : "entries"} to Drive.` });
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    if (entries.length > 0) {
      const ok = await confirm({
        title: "Replace local vault with cloud copy?",
        description: (
          <>
            This replaces your local vault (<strong>{entries.length} {entries.length === 1 ? "entry" : "entries"}</strong>) with the backup stored in Drive.
            You&apos;ll be sent to the lock screen and need to unlock with the master password used at upload time.
          </>
        ),
        confirmLabel: "Restore from Drive",
        tone: "warning",
      });
      if (!ok) return;
    }
    setBusy("download");
    setStatus(null);
    try {
      const payload = await downloadVaultFromDrive();
      if (!payload) {
        setStatus({ kind: "info", text: "No vault file in Drive to restore." });
        return;
      }
      await restoreFromBackup(payload);
      setStatus({ kind: "ok", text: "Restored. Redirecting to lock screen…" });
      lock();
      setTimeout(() => router.replace("/"), 600);
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Restore failed" });
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteRemote() {
    const ok = await confirm({
      title: "Delete backup from Drive?",
      description: (
        <>
          This permanently removes your encrypted vault file from Google Drive.
          Your local vault on this device is <strong>not</strong> affected, and you can re-upload at any time.
        </>
      ),
      confirmLabel: "Delete from Drive",
      tone: "danger",
    });
    if (!ok) return;
    setBusy("delete");
    setStatus(null);
    try {
      const deleted = await deleteVaultFromDrive();
      setRemote(null);
      localStorage.removeItem("vaulthaus.gdrive.lastUpload");
      setLastUpload(null);
      setStatus(
        deleted
          ? { kind: "ok", text: "Backup removed from Drive." }
          : { kind: "info", text: "Nothing to delete — no backup in Drive." },
      );
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setBusy(null);
    }
  }

  if (!clientId) {
    return (
      <>
        <PageHeader title="Cloud sync" subtitle="Back up and restore your vault via Google Drive." icon={Cloud} />
        <div className="card p-7">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-warning)] flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-3 text-sm">
              <h2 className="font-display font-bold text-base">Google Client ID not configured</h2>
              <p className="text-[var(--color-muted-strong)] leading-relaxed">
                To enable Drive sync, set <span className="font-mono text-xs bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> in your <span className="font-mono text-xs">.env.local</span>.
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[var(--color-muted-strong)]">
                <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[var(--color-accent)] underline">Google Cloud Console → Credentials</a>.</li>
                <li>Enable the <strong>Google Drive API</strong> in your project.</li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> — type: <em>Web application</em>.</li>
                <li>Add your dev URL (e.g. <span className="font-mono text-xs">http://localhost:3001</span>) under <em>Authorized JavaScript origins</em>.</li>
                <li>Copy the Client ID into <span className="font-mono text-xs">.env.local</span> and restart the dev server.</li>
              </ol>
              <p className="text-[var(--color-muted)] text-xs pt-2">
                Vaulthaus uses the <span className="font-mono">drive.appdata</span> scope — the file lives in a hidden per-app folder, not your main Drive.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Cloud sync"
        subtitle="Back up and restore your encrypted vault via Google Drive."
        icon={Cloud}
        right={
          connected && (
            <div className="flex items-center gap-2">
              <button onClick={refreshRemote} disabled={busy !== null} className="btn btn-ghost" title="Refresh remote info">
                <Refresh className={`w-4 h-4 ${busy === "info" ? "animate-spin" : ""}`} />
              </button>
              <button onClick={handleDisconnect} disabled={busy !== null} className="btn btn-ghost text-xs">
                <LinkBreak className="w-4 h-4" /> Disconnect
              </button>
            </div>
          )
        }
      />

      {status && (
        <div className={`card p-3 mb-5 text-sm flex items-center gap-2 ${
          status.kind === "ok" ? "border-[rgba(47,182,127,0.3)] text-[var(--color-accent)]"
            : status.kind === "err" ? "border-[rgba(240,84,79,0.3)] text-[var(--color-danger)]"
            : "text-[var(--color-muted-strong)]"
        }`}>
          {status.kind === "ok" && <Check className="w-4 h-4" />}
          {status.kind === "err" && <AlertTriangle className="w-4 h-4" />}
          <span>{status.text}</span>
        </div>
      )}

      {denied && <DeniedHelpPanel onRetry={handleConnect} onDismiss={() => setDenied(false)} />}
      {serverError && (
        <ServerErrorPanel
          message={serverError.message}
          raw={serverError.raw}
          onRetry={handleConnect}
          onDismiss={() => setServerError(null)}
        />
      )}

      {!connected && (
        <div className="card p-7">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] flex-shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="font-display font-bold text-base">Connect Google Drive</h2>
              <p className="text-sm text-[var(--color-muted-strong)] leading-relaxed">
                One-click backup of your encrypted vault to your own Google Drive. Vaulthaus only touches its own
                hidden app folder — it can't see or modify any other file in your Drive.
              </p>
              <ul className="text-xs text-[var(--color-muted)] space-y-1 leading-relaxed">
                <li>· Only AES-GCM ciphertext is uploaded — Google can't decrypt it.</li>
                <li>· Master password never leaves this browser.</li>
                <li>· Restore on any device by signing into the same Google account.</li>
              </ul>
              <button onClick={handleConnect} disabled={busy !== null} className="btn btn-primary mt-2">
                {busy === "connect" ? "Connecting…" : (<><Cloud className="w-4 h-4" /> Connect Google Drive</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {connected && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-accent)]">Connected</div>
            </div>
            <div className="text-sm text-[var(--color-muted-strong)]">
              {remote ? (
                <>Remote vault last modified <strong className="text-[var(--color-text)]">{new Date(remote.modifiedTime).toLocaleString()}</strong>{remote.size ? ` · ${(remote.size / 1024).toFixed(1)} KB` : ""}</>
              ) : (
                <>No vault file in Drive yet — upload to create the first backup.</>
              )}
            </div>
            {lastUpload && (
              <div className="text-[11px] text-[var(--color-muted)] mt-1">
                Last upload from this device: {new Date(lastUpload).toLocaleString()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              icon={CloudUp}
              title="Upload to Drive"
              body={`Push the local vault (${entries.length} ${entries.length === 1 ? "entry" : "entries"}) to your Drive. Replaces any previous backup.`}
              action={
                <button onClick={handleUpload} disabled={busy !== null || entries.length === 0} className="btn btn-primary w-full">
                  {busy === "upload" ? "Uploading…" : (<><CloudUp className="w-4 h-4" /> Upload now</>)}
                </button>
              }
            />
            <ActionCard
              icon={CloudDown}
              title="Restore from Drive"
              body="Replace this device's vault with the cloud copy. You'll be sent to the lock screen — unlock with the master password used at upload time."
              destructive
              action={
                <button onClick={handleDownload} disabled={busy !== null || !remote} className="btn btn-secondary w-full">
                  {busy === "download" ? "Restoring…" : (<><CloudDown className="w-4 h-4" /> Restore now</>)}
                </button>
              }
            />
          </div>

          <div className="card p-5 border-[rgba(240,84,79,0.25)]">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-danger)] shrink-0">
                <Trash className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm">Delete backup from Drive</div>
                <p className="text-xs text-[var(--color-muted-strong)] leading-relaxed mt-1">
                  Permanently remove the encrypted vault file from your Drive. Your local vault on this device is not affected.
                </p>
              </div>
              <button
                onClick={handleDeleteRemote}
                disabled={busy !== null || !remote}
                className="btn btn-danger shrink-0"
              >
                {busy === "delete" ? "Deleting…" : (<><Trash className="w-4 h-4" /> Delete backup</>)}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-muted)] px-2 leading-relaxed">
            Vaulthaus uses the <span className="font-mono">drive.appdata</span> scope. The backup file is invisible from
            drive.google.com — find it via Drive&apos;s API only. Revoke access anytime at{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline hover:text-[var(--color-text)]">myaccount.google.com/permissions</a>.
          </p>
        </div>
      )}
    </>
  );
}

function ServerErrorPanel({
  message,
  raw,
  onRetry,
  onDismiss,
}: {
  message: string;
  raw?: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="card border-[rgba(240,84,79,0.35)] p-6 mb-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-danger)] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="font-display font-bold text-base">Couldn&apos;t connect to Google Drive</h2>
            <p className="text-sm text-[var(--color-muted-strong)] mt-1 leading-relaxed">
              Google returned an error while authorizing. This is usually temporary — please try again in a moment.
              If it keeps happening, try a different browser or an incognito window.
            </p>
            {raw && (
              <p className="text-[11px] font-mono text-[var(--color-muted)] mt-2">
                {message}
                {raw !== message && <> · code: {raw}</>}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button onClick={onRetry} className="btn btn-primary">
              <Refresh className="w-4 h-4" /> Try again
            </button>
            <button onClick={onDismiss} className="btn btn-ghost text-xs">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeniedHelpPanel({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="card border-[rgba(242,181,68,0.35)] p-6 mb-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-warning)] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="font-display font-bold text-base">Access wasn&apos;t granted</h2>
            <p className="text-sm text-[var(--color-muted-strong)] mt-1 leading-relaxed">
              Google didn&apos;t grant Drive access — either the permission was declined, or the sign-in was canceled before it finished.
              Vaulthaus only needs its own hidden app folder and never reads the rest of your Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button onClick={onRetry} className="btn btn-primary">
              <Refresh className="w-4 h-4" /> Try again
            </button>
            <button onClick={onDismiss} className="btn btn-ghost text-xs">Dismiss</button>
          </div>

          <p className="text-[11px] text-[var(--color-muted)] pt-1 leading-relaxed">
            Using a work or school Google account? Your administrator may block third-party apps — try signing in with a personal Google account instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  action,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${destructive ? "border-[rgba(242,181,68,0.2)]" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center ${destructive ? "text-[var(--color-warning)]" : "text-[var(--color-accent)]"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="font-display font-bold text-sm">{title}</div>
      </div>
      <p className="text-xs text-[var(--color-muted-strong)] leading-relaxed flex-1">{body}</p>
      {action}
    </div>
  );
}
