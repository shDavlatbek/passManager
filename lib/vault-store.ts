"use client";
import { create } from "zustand";
import {
  createVaultKey,
  decryptJSON,
  encryptJSON,
  unlockVaultKey,
  base64ToBytes,
  bytesToBase64,
  CRYPTO_CONSTANTS,
} from "@/lib/crypto";
import {
  clearVault,
  deleteEntry,
  getVaultMeta,
  listEntries,
  putEntry,
  setVaultMeta,
} from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  type DecryptedEntry,
  type EncryptedEntry,
  type EntrySecret,
  type VaultMetadata,
  type VaultSettings,
} from "@/types/vault";

type VaultStatus = "loading" | "empty" | "locked" | "unlocked";

interface VaultState {
  status: VaultStatus;
  meta: VaultMetadata | null;
  key: CryptoKey | null;
  entries: DecryptedEntry[];
  lastActivity: number;
  init: () => Promise<void>;
  createVault: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  saveEntry: (entry: Omit<DecryptedEntry, "id" | "createdAt" | "updatedAt" | "hasTotp" | "passwordChangedAt"> & { id?: string }) => Promise<DecryptedEntry>;
  removeEntry: (id: string) => Promise<void>;
  touchActivity: () => void;
  updateSettings: (patch: Partial<VaultSettings>) => Promise<void>;
  wipeVault: () => Promise<void>;
  changeMasterPassword: (current: string, next: string) => Promise<boolean>;
  serializeBackup: () => Promise<{ meta: VaultMetadata; entries: EncryptedEntry[] } | null>;
  restoreFromBackup: (payload: unknown) => Promise<void>;
}

function newId(): string {
  return crypto.randomUUID();
}

async function decryptAll(key: CryptoKey, encrypted: EncryptedEntry[]): Promise<DecryptedEntry[]> {
  const out: DecryptedEntry[] = [];
  for (const e of encrypted) {
    try {
      const secret = await decryptJSON<EntrySecret>(key, e.iv, e.ciphertext);
      out.push({ ...e.meta, ...secret });
    } catch {
      // Skip corrupted entry; report via UI later if needed
    }
  }
  return out;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  status: "loading",
  meta: null,
  key: null,
  entries: [],
  lastActivity: Date.now(),

  init: async () => {
    const meta = await getVaultMeta();
    if (!meta) {
      set({ status: "empty", meta: null });
    } else {
      set({ status: "locked", meta });
    }
  },

  createVault: async (password) => {
    const { key, salt, verification } = await createVaultKey(password);
    const meta: VaultMetadata = {
      version: 1,
      createdAt: Date.now(),
      kdf: {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
        salt: bytesToBase64(salt),
      },
      verification,
      settings: DEFAULT_SETTINGS,
    };
    await setVaultMeta(meta);
    set({ status: "unlocked", meta, key, entries: [], lastActivity: Date.now() });
  },

  unlock: async (password) => {
    const { meta } = get();
    if (!meta) return false;
    const salt = base64ToBytes(meta.kdf.salt);
    const key = await unlockVaultKey(password, salt, meta.verification, meta.kdf.iterations);
    if (!key) return false;
    const encrypted = await listEntries();
    const entries = await decryptAll(key, encrypted);
    set({ status: "unlocked", key, entries, lastActivity: Date.now() });
    return true;
  },

  lock: () => {
    set({ status: "locked", key: null, entries: [] });
  },

  saveEntry: async (input) => {
    const { key, entries } = get();
    if (!key) throw new Error("Vault is locked");
    const now = Date.now();
    const existing = input.id ? entries.find((e) => e.id === input.id) : undefined;
    const entry: DecryptedEntry = existing
      ? {
          ...existing,
          service: input.service,
          url: input.url,
          username: input.username,
          tags: input.tags,
          password: input.password,
          notes: input.notes,
          totpSecret: input.totpSecret,
          updatedAt: now,
          hasTotp: Boolean(input.totpSecret),
          passwordChangedAt: input.password !== existing.password ? now : existing.passwordChangedAt,
          lastUsedAt: existing.lastUsedAt,
        }
      : {
          id: newId(),
          service: input.service,
          url: input.url,
          username: input.username,
          tags: input.tags,
          password: input.password,
          notes: input.notes,
          totpSecret: input.totpSecret,
          createdAt: now,
          updatedAt: now,
          hasTotp: Boolean(input.totpSecret),
          passwordChangedAt: now,
        };

    const secret: EntrySecret = {
      password: entry.password,
      notes: entry.notes,
      totpSecret: entry.totpSecret,
    };
    const { iv, ciphertext } = await encryptJSON(key, secret);
    const { password, notes, totpSecret, ...metaOnly } = entry;
    void password; void notes; void totpSecret;
    const encrypted: EncryptedEntry = { meta: metaOnly, iv, ciphertext };
    await putEntry(encrypted);

    const next = existing
      ? entries.map((e) => (e.id === entry.id ? entry : e))
      : [entry, ...entries];
    set({ entries: next, lastActivity: now });
    return entry;
  },

  removeEntry: async (id) => {
    await deleteEntry(id);
    set({ entries: get().entries.filter((e) => e.id !== id), lastActivity: Date.now() });
  },

  touchActivity: () => set({ lastActivity: Date.now() }),

  updateSettings: async (patch) => {
    const { meta } = get();
    if (!meta) return;
    const nextMeta: VaultMetadata = { ...meta, settings: { ...meta.settings, ...patch } };
    await setVaultMeta(nextMeta);
    set({ meta: nextMeta });
  },

  wipeVault: async () => {
    await clearVault();
    set({ status: "empty", meta: null, key: null, entries: [] });
  },

  serializeBackup: async () => {
    const meta = await getVaultMeta();
    if (!meta) return null;
    const entries = await listEntries();
    return { meta, entries };
  },

  restoreFromBackup: async (payload: unknown) => {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid backup payload.");
    }
    const p = payload as { meta?: unknown; entries?: unknown };
    const m = p.meta as VaultMetadata | undefined;
    const es = p.entries as EncryptedEntry[] | undefined;
    if (!m || !Array.isArray(es)) throw new Error("Backup is missing meta or entries.");
    if (m.version !== 1) throw new Error("Unsupported backup version.");
    if (!m.kdf || m.kdf.name !== "PBKDF2") throw new Error("Backup KDF not recognized.");
    if (!m.verification?.iv || !m.verification?.ciphertext) throw new Error("Backup verification blob missing.");
    await clearVault();
    await setVaultMeta(m);
    for (const e of es) {
      if (!e?.meta?.id || !e.iv || !e.ciphertext) throw new Error("Corrupted entry in backup.");
      await putEntry(e);
    }
    set({ status: "locked", meta: m, key: null, entries: [] });
  },

  changeMasterPassword: async (current, next) => {
    const { meta, entries } = get();
    if (!meta) return false;
    const salt = base64ToBytes(meta.kdf.salt);
    const currentKey = await unlockVaultKey(current, salt, meta.verification, meta.kdf.iterations);
    if (!currentKey) return false;
    const { key: newKey, salt: newSalt, verification } = await createVaultKey(next);
    const newMeta: VaultMetadata = {
      ...meta,
      kdf: { ...meta.kdf, salt: bytesToBase64(newSalt), iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS },
      verification,
    };
    await setVaultMeta(newMeta);
    for (const entry of entries) {
      const secret: EntrySecret = {
        password: entry.password,
        notes: entry.notes,
        totpSecret: entry.totpSecret,
      };
      const { iv, ciphertext } = await encryptJSON(newKey, secret);
      const { password, notes, totpSecret, ...metaOnly } = entry;
      void password; void notes; void totpSecret;
      await putEntry({ meta: metaOnly, iv, ciphertext });
    }
    set({ meta: newMeta, key: newKey });
    return true;
  },
}));
