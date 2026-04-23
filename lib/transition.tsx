"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const EXIT_MS = 220;

type Phase = "idle" | "exiting" | "loading";

interface TransitionCtx {
  navigate: (href: string) => void;
  phase: Phase;
}

const Ctx = createContext<TransitionCtx>({ navigate: () => {}, phase: "idle" });

export function useTransition() {
  return useContext(Ctx);
}

export function TransitionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [displayPath, setDisplayPath] = useState(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      try { router.prefetch(href); } catch { /* noop */ }
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setPhase("exiting");
      exitTimer.current = setTimeout(() => {
        setPhase("loading");
        router.push(href);
      }, EXIT_MS);
    },
    [router, pathname],
  );

  useEffect(() => {
    if (pathname !== displayPath) {
      setDisplayPath(pathname);
      setPhase("idle");
    }
  }, [pathname, displayPath]);

  useEffect(() => {
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  // Intercept same-origin anchor clicks so every Link gets the transition.
  // Must run in the CAPTURE phase + stopPropagation so we preempt
  // Next.js Link's React onClick (which would otherwise call router.push first
  // and skip our optimistic exit animation).
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.getAttribute("target") === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (/^(https?:|mailto:|tel:|blob:|data:|javascript:)/i.test(href)) return;
      if (href.startsWith("#")) return;
      // Resolve to a same-origin path; bail if the URL parses to a different origin.
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const path = url.pathname + url.search + url.hash;
      const here = window.location.pathname + window.location.search + window.location.hash;
      if (path === here) return;
      e.preventDefault();
      e.stopPropagation();
      navigate(path);
    }
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, [navigate]);

  const showContent = phase === "idle";

  return (
    <Ctx.Provider value={{ navigate, phase }}>
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          {showContent && (
            <motion.div
              key={displayPath}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "loading" && <Loader />}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function Loader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-center py-20"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-[var(--color-muted)]">
        <span className="w-4 h-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
        <span className="text-xs uppercase tracking-[0.15em]">Loading</span>
      </div>
    </motion.div>
  );
}
