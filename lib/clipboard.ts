"use client";

let clearTimer: ReturnType<typeof setTimeout> | null = null;
let lastCopied: string | null = null;

export async function copyWithAutoClear(text: string, seconds = 30): Promise<void> {
  await navigator.clipboard.writeText(text);
  lastCopied = text;
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText().catch(() => "");
      if (current === lastCopied) {
        await navigator.clipboard.writeText("");
      }
    } catch {
      // Read permission denied; best-effort overwrite.
      try { await navigator.clipboard.writeText(""); } catch { /* noop */ }
    }
    clearTimer = null;
    lastCopied = null;
  }, seconds * 1000);
}

export function cancelAutoClear(): void {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
    lastCopied = null;
  }
}
