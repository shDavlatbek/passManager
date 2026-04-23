const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  if (!clean) return new Uint8Array();
  const bytes: number[] = [];
  let bits = 0;
  let buffer = 0;
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32 character: " + ch);
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export function parseOtpAuthUrl(url: string): { secret: string; issuer?: string; label?: string; digits: number; period: number; algorithm: string } | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "otpauth:") return null;
    if (u.host !== "totp") return null;
    const params = u.searchParams;
    const secret = params.get("secret");
    if (!secret) return null;
    return {
      secret: secret.trim(),
      issuer: params.get("issuer") || undefined,
      label: decodeURIComponent(u.pathname.replace(/^\//, "")) || undefined,
      digits: parseInt(params.get("digits") || "6", 10),
      period: parseInt(params.get("period") || "30", 10),
      algorithm: (params.get("algorithm") || "SHA1").toUpperCase(),
    };
  } catch {
    return null;
  }
}

export async function generateTotp(
  base32Secret: string,
  options: { digits?: number; period?: number; at?: number } = {},
): Promise<{ code: string; secondsLeft: number; progress: number }> {
  const digits = options.digits ?? 6;
  const period = options.period ?? 30;
  const nowMs = options.at ?? Date.now();
  const counter = Math.floor(nowMs / 1000 / period);

  const key = base32Decode(base32Secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(4, counter);
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterBytes));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = String(binary % 10 ** digits).padStart(digits, "0");
  const secondsIntoPeriod = Math.floor(nowMs / 1000) % period;
  const secondsLeft = period - secondsIntoPeriod;
  const progress = secondsLeft / period;
  return { code, secondsLeft, progress };
}

export function isValidBase32(secret: string): boolean {
  const clean = secret.replace(/\s+/g, "").replace(/=+$/, "").toUpperCase();
  if (!clean) return false;
  return /^[A-Z2-7]+$/.test(clean);
}
