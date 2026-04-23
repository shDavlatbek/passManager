import { getBreachCache, putBreachCache } from "@/lib/db";
import { sha1Hex } from "@/lib/crypto";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ENDPOINT = "https://api.pwnedpasswords.com/range/";

export interface BreachResult {
  password: string;
  count: number;
  checkedAt: number;
}

async function fetchRange(prefix: string): Promise<string> {
  const cached = await getBreachCache(prefix);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.body;
  const res = await fetch(ENDPOINT + prefix, { headers: { "Add-Padding": "true" } });
  if (!res.ok) throw new Error("HIBP request failed: " + res.status);
  const body = await res.text();
  await putBreachCache({ prefix, fetchedAt: Date.now(), body });
  return body;
}

export async function checkPasswordBreach(password: string): Promise<BreachResult> {
  if (!password) return { password, count: 0, checkedAt: Date.now() };
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  let body: string;
  try {
    body = await fetchRange(prefix);
  } catch {
    return { password, count: -1, checkedAt: Date.now() };
  }
  let count = 0;
  for (const line of body.split(/\r?\n/)) {
    const [hashSuffix, countStr] = line.split(":");
    if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
      count = parseInt(countStr, 10) || 0;
      break;
    }
  }
  return { password, count, checkedAt: Date.now() };
}

export async function checkPasswordsBreach(passwords: string[]): Promise<Map<string, BreachResult>> {
  const unique = Array.from(new Set(passwords.filter(Boolean)));
  const out = new Map<string, BreachResult>();
  await Promise.all(
    unique.map(async (pw) => {
      out.set(pw, await checkPasswordBreach(pw));
    }),
  );
  return out;
}
