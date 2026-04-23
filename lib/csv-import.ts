export interface ImportedEntry {
  service: string;
  url?: string;
  username?: string;
  password: string;
  notes?: string;
  totpSecret?: string;
  tags: string[];
}

export type CsvFormat = "bitwarden" | "1password" | "lastpass" | "generic";

export interface DetectedCsv {
  format: CsvFormat;
  headers: string[];
  rows: Record<string, string>[];
  entries: ImportedEntry[];
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  // Reassemble quoted newlines
  const cells: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  const fullText = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (fullText[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (field.length > 0 || cur.length > 0) {
          cur.push(field);
          cells.push(cur);
          cur = [];
          field = "";
        }
        if (ch === "\r" && fullText[i + 1] === "\n") i++;
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    cells.push(cur);
  }
  if (cells.length === 0) return { headers: [], rows: [] };
  const headers = cells[0].map((h) => h.trim());
  const rows = cells.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = row[idx] ?? ""));
    return obj;
  });
  // Also use line count to silence lint on lines
  void lines;
  return { headers, rows };
}

function detectFormat(headers: string[]): CsvFormat {
  const lower = headers.map((h) => h.toLowerCase());
  if (lower.includes("login_uri") && lower.includes("login_username")) return "bitwarden";
  if (lower.includes("title") && lower.includes("website") && lower.includes("username")) return "1password";
  if (lower.includes("url") && lower.includes("username") && lower.includes("password") && lower.includes("name")) return "lastpass";
  return "generic";
}

function mapRow(format: CsvFormat, row: Record<string, string>): ImportedEntry | null {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const match = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
      if (match && row[match]) return row[match];
    }
    return "";
  };

  if (format === "bitwarden") {
    const service = pick("name") || "Untitled";
    const password = pick("login_password");
    if (!password) return null;
    const folder = pick("folder");
    return {
      service,
      url: pick("login_uri") || undefined,
      username: pick("login_username") || undefined,
      password,
      notes: pick("notes") || undefined,
      totpSecret: pick("login_totp") || undefined,
      tags: folder ? [folder] : [],
    };
  }

  if (format === "1password") {
    const service = pick("title") || "Untitled";
    const password = pick("password");
    if (!password) return null;
    return {
      service,
      url: pick("website", "url") || undefined,
      username: pick("username") || undefined,
      password,
      notes: pick("notes") || undefined,
      totpSecret: pick("otpauth", "one-time password") || undefined,
      tags: [],
    };
  }

  if (format === "lastpass") {
    const service = pick("name") || "Untitled";
    const password = pick("password");
    if (!password) return null;
    const grouping = pick("grouping");
    return {
      service,
      url: pick("url") || undefined,
      username: pick("username") || undefined,
      password,
      notes: pick("extra") || undefined,
      tags: grouping ? [grouping] : [],
    };
  }

  const service = pick("service", "name", "title") || "Untitled";
  const password = pick("password");
  if (!password) return null;
  return {
    service,
    url: pick("url", "website") || undefined,
    username: pick("username", "email", "login") || undefined,
    password,
    notes: pick("notes") || undefined,
    tags: [],
  };
}

export function detectAndMap(text: string): DetectedCsv {
  const { headers, rows } = parseCsv(text);
  const format = detectFormat(headers);
  const entries = rows
    .map((r) => mapRow(format, r))
    .filter((e): e is ImportedEntry => e !== null);
  return { format, headers, rows, entries };
}
