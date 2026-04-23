const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;
const VERIFICATION_PLAINTEXT = "vault-check-v1";

export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return base64ToBytes(b64);
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON<T>(
  key: CryptoKey,
  value: T,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = randomBytes(IV_BYTES);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plaintext);
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ct)) };
}

export async function decryptJSON<T>(
  key: CryptoKey,
  iv: string,
  ciphertext: string,
): Promise<T> {
  const ivBytes = base64ToBytes(iv);
  const ctBytes = base64ToBytes(ciphertext);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as BufferSource },
    key,
    ctBytes as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(pt));
}

export interface CreatedVault {
  key: CryptoKey;
  salt: Uint8Array;
  verification: { iv: string; ciphertext: string };
}

export async function createVaultKey(password: string): Promise<CreatedVault> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt);
  const verification = await encryptJSON(key, VERIFICATION_PLAINTEXT);
  return { key, salt, verification };
}

export async function unlockVaultKey(
  password: string,
  salt: Uint8Array,
  verification: { iv: string; ciphertext: string },
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey | null> {
  const key = await deriveKey(password, salt, iterations);
  try {
    const plaintext = await decryptJSON<string>(key, verification.iv, verification.ciphertext);
    if (plaintext !== VERIFICATION_PLAINTEXT) return null;
    return key;
  } catch {
    return null;
  }
}

export async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const CRYPTO_CONSTANTS = { PBKDF2_ITERATIONS, SALT_BYTES, IV_BYTES, KEY_BITS } as const;
