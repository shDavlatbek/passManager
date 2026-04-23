"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVaultStore } from "@/lib/vault-store";
import { encodeShareLink, decodeShareLink, type SharePayload } from "@/lib/share-link";
import { analyzeStrength } from "@/lib/strength";
import { PageHeader } from "@/components/VaultShell";
import { CopyButton } from "@/components/CopyButton";
import { Share, Upload, Check } from "@/components/icons";

function ShareInner() {
  const params = useSearchParams();
  const entries = useVaultStore((s) => s.entries);
  const saveEntry = useVaultStore((s) => s.saveEntry);
  const forId = params.get("for");

  const [tab, setTab] = useState<"out" | "in">("out");
  const [selectedId, setSelectedId] = useState<string>(forId ?? entries[0]?.id ?? "");
  const [sharePassword, setSharePassword] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [outBusy, setOutBusy] = useState(false);

  const [incoming, setIncoming] = useState("");
  const [inPassword, setInPassword] = useState("");
  const [inBusy, setInBusy] = useState(false);
  const [decoded, setDecoded] = useState<SharePayload | null>(null);
  const [inError, setInError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (forId) {
      setTab("out");
      setSelectedId(forId);
    }
  }, [forId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#s=")) {
      setTab("in");
      setIncoming(window.location.hash.slice(3));
    }
  }, []);

  const selected = entries.find((e) => e.id === selectedId);
  const strength = analyzeStrength(sharePassword);

  async function generateLink() {
    if (!selected || !sharePassword) return;
    setOutBusy(true);
    try {
      const payload: SharePayload = {
        service: selected.service,
        url: selected.url,
        username: selected.username,
        password: selected.password,
        notes: selected.notes,
        totpSecret: selected.totpSecret,
        sharedAt: Date.now(),
      };
      const token = await encodeShareLink(payload, sharePassword);
      const base = typeof window !== "undefined" ? `${window.location.origin}/share` : "/share";
      setLink(`${base}#s=${token}`);
    } finally {
      setOutBusy(false);
    }
  }

  const incomingToken = useMemo(() => {
    if (!incoming) return "";
    try {
      if (incoming.includes("#s=")) return new URL(incoming).hash.slice(3);
    } catch { /* not a URL */ }
    return incoming.replace(/^#?s=/, "").trim();
  }, [incoming]);

  async function openIncoming() {
    if (!incomingToken || !inPassword) return;
    setInBusy(true);
    setInError(null);
    const payload = await decodeShareLink(incomingToken, inPassword);
    setInBusy(false);
    if (!payload) {
      setInError("Wrong share password or invalid link.");
      setDecoded(null);
      return;
    }
    setDecoded(payload);
  }

  async function importDecoded() {
    if (!decoded) return;
    await saveEntry({
      service: decoded.service,
      url: decoded.url,
      username: decoded.username,
      password: decoded.password,
      notes: decoded.notes,
      totpSecret: decoded.totpSecret,
      tags: ["shared"],
    });
    setImported(true);
  }

  return (
    <>
      <PageHeader
        title="Share credentials"
        subtitle="Hand a credential to a teammate without leaking it over chat. Everything stays encrypted."
        icon={Share}
      />

      <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)]">
        <TabButton active={tab === "out"} onClick={() => setTab("out")}>Export share link</TabButton>
        <TabButton active={tab === "in"} onClick={() => setTab("in")}>Import share link</TabButton>
      </div>

      {tab === "out" && (
        <div className="card p-7 space-y-6">
          <Label>Select a credential to share</Label>
          <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>{e.service}{e.username ? ` — ${e.username}` : ""}</option>
            ))}
          </select>

          <div>
            <Label>Share password</Label>
            <input
              type="password"
              className="input input-mono"
              value={sharePassword}
              onChange={(e) => setSharePassword(e.target.value)}
              placeholder="A one-time secret. Share it out-of-band."
            />
            {sharePassword && (
              <div className="mt-3 h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((strength.score + 1) / 5) * 100}%`,
                    background: strength.label === "weak" ? "var(--color-danger)" : strength.label === "fair" ? "var(--color-warning)" : "var(--color-accent)",
                  }}
                />
              </div>
            )}
            <p className="text-[11px] text-[var(--color-muted)] mt-2">
              Send the link in one channel (email, chat) and the password in another (voice, Signal).
            </p>
          </div>

          <button disabled={!selected || !sharePassword || outBusy} onClick={generateLink} className="btn btn-primary w-full">
            {outBusy ? "Encrypting…" : "Generate share link"}
          </button>

          {link && (
            <div className="pt-5 border-t border-[var(--color-border)]">
              <Label>Share link</Label>
              <div className="flex items-center gap-2">
                <input readOnly value={link} className="input input-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <CopyButton value={link} variant="secondary" label="Copy" />
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-2">
                Anyone with this link plus the share password you chose can decrypt and view the credential.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "in" && (
        <div className="card p-7 space-y-6">
          <Label>Share link or token</Label>
          <input
            className="input input-mono text-xs"
            value={incoming}
            onChange={(e) => { setIncoming(e.target.value); setDecoded(null); setImported(false); }}
            placeholder="https://vaulthaus/share#s=…  or  token"
          />

          <div>
            <Label>Share password</Label>
            <input
              type="password"
              className="input input-mono"
              value={inPassword}
              onChange={(e) => { setInPassword(e.target.value); setDecoded(null); setImported(false); }}
            />
          </div>

          {inError && <div className="text-xs text-[var(--color-danger)]">{inError}</div>}

          <button disabled={!incomingToken || !inPassword || inBusy} onClick={openIncoming} className="btn btn-primary w-full">
            {inBusy ? "Decrypting…" : "Decrypt"}
          </button>

          {decoded && (
            <div className="pt-5 border-t border-[var(--color-border)] space-y-3">
              <div className="font-display font-bold text-lg">{decoded.service}</div>
              <Row k="Username" v={decoded.username || "—"} />
              <Row k="URL" v={decoded.url || "—"} />
              <Row k="Password" v={decoded.password} mono />
              {decoded.notes && <Row k="Notes" v={decoded.notes} />}
              <button disabled={imported} onClick={importDecoded} className="btn btn-primary w-full">
                {imported ? <><Check className="w-4 h-4" /> Imported into vault</> : <><Upload className="w-4 h-4" /> Save to my vault</>}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <ShareInner />
    </Suspense>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
        active
          ? "text-[var(--color-text)] border-[var(--color-accent)]"
          : "text-[var(--color-muted)] border-transparent hover:text-[var(--color-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] mb-1.5">{children}</div>;
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-4">
      <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] w-24">{k}</div>
      <div className={`text-sm flex-1 min-w-0 truncate ${mono ? "font-mono tracking-[0.05em]" : ""}`}>{v}</div>
    </div>
  );
}
