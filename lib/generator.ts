const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?~";
const AMBIGUOUS = /[O0oIl1|`'"]/g;

export interface GeneratorOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function randomFrom(charset: string): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return charset[buf[0] % charset.length];
}

export function generatePassword(options: GeneratorOptions): string {
  let pool = "";
  const required: string[] = [];
  if (options.upper) { pool += UPPER; required.push(randomFrom(UPPER)); }
  if (options.lower) { pool += LOWER; required.push(randomFrom(LOWER)); }
  if (options.digits) { pool += DIGITS; required.push(randomFrom(DIGITS)); }
  if (options.symbols) { pool += SYMBOLS; required.push(randomFrom(SYMBOLS)); }
  if (options.excludeAmbiguous) {
    pool = pool.replace(AMBIGUOUS, "");
  }
  if (!pool) return "";
  const length = Math.max(options.length, required.length, 4);
  const out: string[] = [...required];
  while (out.length < length) {
    out.push(randomFrom(pool));
  }
  // Fisher-Yates with crypto randomness
  for (let i = out.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, length).join("");
}
