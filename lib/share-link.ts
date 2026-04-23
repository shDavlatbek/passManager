import {
  base64UrlDecode,
  base64UrlEncode,
  deriveKey,
  randomBytes,
} from "@/lib/crypto";

const MAGIC = "VHSL";
const VERSION = 1;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ITERATIONS = 200_000;

export interface SharePayload {
  service: string;
  url?: string;
  username?: string;
  password: string;
  notes?: string;
  totpSecret?: string;
  sharedBy?: string;
  sharedAt: number;
}

export async function encodeShareLink(
  payload: SharePayload,
  sharePassword: string,
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(sharePassword, salt, ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext,
  );
  const ct = new Uint8Array(ctBuf);

  const header = new TextEncoder().encode(MAGIC);
  const buf = new Uint8Array(header.length + 1 + 2 + salt.length + iv.length + ct.length);
  let o = 0;
  buf.set(header, o); o += header.length;
  buf[o++] = VERSION;
  buf[o++] = salt.length;
  buf[o++] = iv.length;
  buf.set(salt, o); o += salt.length;
  buf.set(iv, o); o += iv.length;
  buf.set(ct, o);
  return base64UrlEncode(buf);
}

export async function decodeShareLink(
  encoded: string,
  sharePassword: string,
): Promise<SharePayload | null> {
  let bytes: Uint8Array;
  try {
    bytes = base64UrlDecode(encoded);
  } catch {
    return null;
  }
  const header = new TextDecoder().decode(bytes.slice(0, MAGIC.length));
  if (header !== MAGIC) return null;
  let o = MAGIC.length;
  const version = bytes[o++];
  if (version !== VERSION) return null;
  const saltLen = bytes[o++];
  const ivLen = bytes[o++];
  const salt = bytes.slice(o, o + saltLen); o += saltLen;
  const iv = bytes.slice(o, o + ivLen); o += ivLen;
  const ct = bytes.slice(o);
  try {
    const key = await deriveKey(sharePassword, salt, ITERATIONS);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(pt)) as SharePayload;
  } catch {
    return null;
  }
}
