"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "dark" | "light";
const KEY = "vaulthaus.theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useThemeSync() {
  useEffect(() => {
    applyTheme(readInitial());
  }, []);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = readInitial();
    setTheme(t);
    applyTheme(t);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.setAttribute("data-theme-switching", "1");
    setTheme(next);
    localStorage.setItem(KEY, next);
    applyTheme(next);
    window.setTimeout(() => root.removeAttribute("data-theme-switching"), 320);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="relative inline-flex w-[52px] h-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-colors hover:border-[var(--color-border-strong)]"
    >
      <motion.span
        className="absolute top-1/2 left-[3px] -translate-y-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[var(--color-text)] shadow-sm pointer-events-none"
        initial={false}
        animate={{
          x: theme === "dark" ? 0 : 22,
          backgroundColor: theme === "dark" ? "#0b0d0e" : "#fff7d6",
          rotate: theme === "dark" ? 0 : 360,
        }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        {mounted && (
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.svg
                key="moon"
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                transition={{ duration: 0.18 }}
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-[var(--color-muted-strong)]"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </motion.svg>
            ) : (
              <motion.svg
                key="sun"
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                transition={{ duration: 0.18 }}
                stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
              </motion.svg>
            )}
          </AnimatePresence>
        )}
      </motion.span>
    </button>
  );
}
