"use client";
import { useEffect } from "react";
import { useVaultStore } from "@/lib/vault-store";
import { ConfirmProvider } from "@/components/ConfirmDialog";

function IdleLock() {
  const { meta, status, lastActivity, lock } = useVaultStore();
  useEffect(() => {
    if (status !== "unlocked" || !meta) return;
    const handler = () => useVaultStore.getState().touchActivity();
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    const interval = setInterval(() => {
      const { lastActivity: latest, status: s, meta: m } = useVaultStore.getState();
      if (s !== "unlocked" || !m) return;
      const idleMs = Date.now() - latest;
      if (idleMs > m.settings.autoLockMinutes * 60 * 1000) {
        useVaultStore.getState().lock();
      }
    }, 5000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [status, meta, lastActivity, lock]);
  return null;
}

function InitVault() {
  const init = useVaultStore((s) => s.init);
  useEffect(() => { void init(); }, [init]);
  return null;
}

function LockOnHide() {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") {
        // Soft-lock: leave locked if tab closed. The store survives reload (meta), key does not.
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <InitVault />
      <IdleLock />
      <LockOnHide />
      {children}
    </ConfirmProvider>
  );
}
