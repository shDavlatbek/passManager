"use client";
import { useState } from "react";
import { copyWithAutoClear } from "@/lib/clipboard";
import { Copy, Check } from "@/components/icons";
import { useVaultStore } from "@/lib/vault-store";

export function CopyButton({
  value,
  label,
  className = "",
  variant = "ghost",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "secondary";
}) {
  const [copied, setCopied] = useState(false);
  const settings = useVaultStore((s) => s.meta?.settings);

  async function handle() {
    if (!value) return;
    const seconds = settings?.clipboardClearSeconds ?? 30;
    await copyWithAutoClear(value, seconds);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={handle}
      type="button"
      className={`btn ${variant === "ghost" ? "btn-ghost" : "btn-secondary"} ${className}`}
      title={`Copy${label ? " " + label : ""} (auto-clears in ${settings?.clipboardClearSeconds ?? 30}s)`}
    >
      {copied ? <Check className="w-4 h-4 text-[var(--color-accent)]" /> : <Copy className="w-4 h-4" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
