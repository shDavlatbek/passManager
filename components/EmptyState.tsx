"use client";
import { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  illustration,
  actions,
}: {
  title: string;
  body: string;
  illustration?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="card px-10 py-16 flex flex-col items-center text-center">
      {illustration && <div className="mb-6">{illustration}</div>}
      <h2 className="font-display text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-[var(--color-muted)] max-w-sm leading-relaxed">{body}</p>
      {actions && <div className="mt-6 flex flex-wrap gap-3 justify-center">{actions}</div>}
    </div>
  );
}

export function VaultEmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <defs>
        <linearGradient id="v-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(47,182,127,0.25)" />
          <stop offset="100%" stopColor="rgba(47,182,127,0.02)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill="url(#v-grad)" />
      <rect x="35" y="50" width="50" height="40" rx="4" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
      <path d="M44 50v-8a16 16 0 0 1 32 0v8" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="60" cy="70" r="4" fill="var(--color-accent)" />
      <rect x="58" y="72" width="4" height="8" rx="1" fill="var(--color-accent)" />
    </svg>
  );
}
