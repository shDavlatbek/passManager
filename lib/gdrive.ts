"use client";

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "vaulthaus.vault.json";
const MIME = "application/json";
const TOKEN_KEY = "vaulthaus.gdrive.token";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string; error_description?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (overrideConfig?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

export interface DriveAuth {
  accessToken: string;
  expiresAt: number;
}

export interface DriveFileInfo {
  id: string;
  modifiedTime: string;
  size?: number;
}

export function getClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return id && id.trim() ? id.trim() : null;
}

export function readStoredToken(): DriveAuth | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DriveAuth;
    if (!parsed.accessToken || Date.now() >= parsed.expiresAt - 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GIS script failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS script failed to load"));
    document.head.appendChild(script);
  });
}

export type DriveErrorKind = "missing-client" | "denied" | "popup-closed" | "popup-blocked" | "other";

export class DriveError extends Error {
  kind: DriveErrorKind;
  raw?: string;
  constructor(kind: DriveErrorKind, message: string, raw?: string) {
    super(message);
    this.kind = kind;
    this.raw = raw;
    this.name = "DriveError";
  }
}

export async function connectGoogleDrive(prompt: "" | "consent" = ""): Promise<DriveAuth> {
  const clientId = getClientId();
  if (!clientId) {
    throw new DriveError(
      "missing-client",
      "Google Client ID missing. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID — see README › Google Drive sync.",
    );
  }
  await loadGsi();
  return new Promise<DriveAuth>((resolve, reject) => {
    let settled = false;
    let lostFocus = false;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
    };
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };
    function onBlur() { lostFocus = true; }
    function onFocus() {
      if (!lostFocus || settled) return;
      // Popup was closed (or user tabbed back). Give GSI's callbacks ~2s to land;
      // if nothing settles in that window, treat it as popup-closed.
      if (graceTimer) clearTimeout(graceTimer);
      graceTimer = setTimeout(() => {
        settle(() => reject(
          new DriveError("popup-closed", "You closed the Google sign-in window.", "focus_timeout"),
        ));
      }, 2000);
    }
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          const raw = response.error || "unknown";
          if (raw === "access_denied") {
            settle(() => reject(
              new DriveError(
                "denied",
                "Google didn't grant Drive access. You can try again below.",
                raw,
              ),
            ));
          } else if (raw === "popup_closed" || raw === "popup_closed_by_user") {
            settle(() => reject(new DriveError("popup-closed", "You closed the Google sign-in window.", raw)));
          } else if (raw === "popup_blocked_by_browser") {
            settle(() => reject(new DriveError("popup-blocked", "Your browser blocked the Google sign-in popup. Allow popups for this site and retry.", raw)));
          } else {
            settle(() => reject(new DriveError("other", response.error_description || raw, raw)));
          }
          return;
        }
        const auth: DriveAuth = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        };
        try { localStorage.setItem(TOKEN_KEY, JSON.stringify(auth)); } catch { /* noop */ }
        settle(() => resolve(auth));
      },
      error_callback: (err) => {
        const type = err?.type || "unknown";
        if (type === "popup_closed") {
          settle(() => reject(new DriveError("popup-closed", "You closed the Google sign-in window.", type)));
        } else if (type === "popup_failed_to_open") {
          settle(() => reject(new DriveError("popup-blocked", "Your browser blocked the Google sign-in popup. Allow popups for this site and retry.", type)));
        } else {
          settle(() => reject(new DriveError("other", err?.message || type, type)));
        }
      },
    });
    client.requestAccessToken({ prompt });
  });
}

export async function disconnectGoogleDrive(): Promise<void> {
  const stored = readStoredToken();
  clearStoredToken();
  if (stored && window.google?.accounts?.oauth2?.revoke) {
    await new Promise<void>((resolve) => window.google!.accounts.oauth2.revoke(stored.accessToken, resolve));
  }
}

async function ensureToken(): Promise<string> {
  const stored = readStoredToken();
  if (stored) return stored.accessToken;
  const fresh = await connectGoogleDrive();
  return fresh.accessToken;
}

async function driveFetch(url: string, init: RequestInit, token: string): Promise<Response> {
  const r = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (r.status === 401) {
    clearStoredToken();
    throw new Error("Google session expired. Click Connect again.");
  }
  return r;
}

export async function getRemoteInfo(): Promise<DriveFileInfo | null> {
  const token = await ensureToken();
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(`name='${FILE_NAME}'`)}&fields=${encodeURIComponent("files(id,name,modifiedTime,size)")}`;
  const r = await driveFetch(url, { method: "GET" }, token);
  if (!r.ok) throw new Error("Drive query failed: " + r.status);
  const data = (await r.json()) as { files?: Array<{ id: string; modifiedTime: string; size?: string }> };
  const f = data.files?.[0];
  if (!f) return null;
  return { id: f.id, modifiedTime: f.modifiedTime, size: f.size ? parseInt(f.size, 10) : undefined };
}

export async function uploadVaultToDrive(payload: object): Promise<DriveFileInfo> {
  const token = await ensureToken();
  const body = JSON.stringify(payload);
  const existing = await getRemoteInfo();

  if (existing) {
    const r = await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media&fields=id,modifiedTime,size`,
      { method: "PATCH", headers: { "Content-Type": MIME }, body },
      token,
    );
    if (!r.ok) throw new Error("Upload failed: " + r.status);
    const f = (await r.json()) as { id: string; modifiedTime: string; size?: string };
    return { id: f.id, modifiedTime: f.modifiedTime, size: f.size ? parseInt(f.size, 10) : undefined };
  }

  const boundary = "vaulthaus" + Math.random().toString(36).slice(2);
  const metadata = { name: FILE_NAME, parents: ["appDataFolder"] };
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${MIME}\r\n\r\n` +
    body +
    `\r\n--${boundary}--`;
  const r = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime,size`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipart,
    },
    token,
  );
  if (!r.ok) throw new Error("Upload failed: " + r.status);
  const f = (await r.json()) as { id: string; modifiedTime: string; size?: string };
  return { id: f.id, modifiedTime: f.modifiedTime, size: f.size ? parseInt(f.size, 10) : undefined };
}

export async function deleteVaultFromDrive(): Promise<boolean> {
  const token = await ensureToken();
  const info = await getRemoteInfo();
  if (!info) return false;
  const r = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${info.id}`,
    { method: "DELETE" },
    token,
  );
  if (!r.ok && r.status !== 204) throw new Error("Delete failed: " + r.status);
  return true;
}

export async function downloadVaultFromDrive(): Promise<unknown | null> {
  const token = await ensureToken();
  const info = await getRemoteInfo();
  if (!info) return null;
  const r = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${info.id}?alt=media`,
    { method: "GET" },
    token,
  );
  if (!r.ok) throw new Error("Download failed: " + r.status);
  return await r.json();
}
