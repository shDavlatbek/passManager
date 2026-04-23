"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "@/components/icons";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function pick(idx: number) {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function onTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKey(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => findNext(options, h, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => findNext(options, h, -1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(findNext(options, -1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(findNext(options, options.length, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlight >= 0) pick(highlight);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const triggerLabel = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        className={`select text-left flex items-center gap-3 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`flex-1 min-w-0 truncate ${isPlaceholder ? "text-[var(--color-muted)]" : "text-[var(--color-text)]"}`}>
          {triggerLabel}
        </span>
        {selected?.hint && !isPlaceholder && (
          <span className="text-xs text-[var(--color-muted)] truncate shrink-0 max-w-[40%]">{selected.hint}</span>
        )}
        <Caret open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute z-30 left-0 right-0 mt-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden"
          >
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              autoFocus
              onKeyDown={onListKey}
              className="max-h-64 overflow-y-auto py-1 focus:outline-none"
            >
              {options.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-[var(--color-muted)]">No options</li>
              )}
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlight;
                return (
                  <li
                    key={opt.value}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => pick(idx)}
                    className={`px-3 py-2.5 text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                      opt.disabled
                        ? "text-[var(--color-muted)] cursor-not-allowed"
                        : isHighlighted
                          ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                          : "text-[var(--color-muted-strong)]"
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className="text-xs text-[var(--color-muted)] truncate shrink-0 max-w-[45%]">{opt.hint}</span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] shrink-0" />}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-muted)] shrink-0"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function findNext(options: SelectOption[], from: number, dir: 1 | -1): number {
  const n = options.length;
  if (n === 0) return -1;
  let i = from;
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n;
    if (!options[i].disabled) return i;
  }
  return from;
}
