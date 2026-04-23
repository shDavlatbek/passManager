"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "@/components/icons";

export type ConfirmTone = "default" | "danger" | "warning";

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmBtn = useRef<HTMLButtonElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      lastFocus.current = (document.activeElement as HTMLElement) || null;
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    if (!pending) return;
    pending.resolve(result);
    setPending(null);
    requestAnimationFrame(() => lastFocus.current?.focus?.());
  }

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); settle(false); }
      else if (e.key === "Enter") { e.preventDefault(); settle(true); }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => confirmBtn.current?.focus(), 30);
    return () => { document.removeEventListener("keydown", onKey); window.clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const tone = pending?.tone ?? "default";
  const accent =
    tone === "danger" ? "text-[var(--color-danger)]"
      : tone === "warning" ? "text-[var(--color-warning)]"
        : "text-[var(--color-accent)]";
  const ring =
    tone === "danger" ? "border-[rgba(240,84,79,0.35)]"
      : tone === "warning" ? "border-[rgba(242,181,68,0.35)]"
        : "border-[var(--color-border)]";
  const confirmBtnClass =
    tone === "danger" ? "btn btn-danger"
      : tone === "warning" ? "btn btn-primary"
        : "btn btn-primary";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div
            key="confirm-root"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm"
              onClick={() => settle(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className={`relative card ${ring} w-full max-w-[440px] p-6`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <button
                type="button"
                onClick={() => settle(false)}
                aria-label="Close"
                className="absolute top-3 right-3 btn btn-ghost px-2 py-2 text-[var(--color-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 ${accent}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 id="confirm-title" className="font-display font-bold text-base leading-tight">
                    {pending.title}
                  </h2>
                  {pending.description && (
                    <div className="text-sm text-[var(--color-muted-strong)] mt-2 leading-relaxed">
                      {pending.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button type="button" onClick={() => settle(false)} className="btn btn-ghost">
                  {pending.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  ref={confirmBtn}
                  onClick={() => settle(true)}
                  className={confirmBtnClass}
                >
                  {pending.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
