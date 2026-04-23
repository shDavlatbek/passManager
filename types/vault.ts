export type EntryId = string;

export interface EntrySecret {
  password: string;
  notes?: string;
  totpSecret?: string;
}

export interface EntryMeta {
  id: EntryId;
  service: string;
  url?: string;
  username?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  hasTotp: boolean;
  passwordChangedAt: number;
}

export interface EncryptedEntry {
  meta: EntryMeta;
  iv: string;
  ciphertext: string;
}

export interface DecryptedEntry extends EntryMeta, EntrySecret {}

export interface VaultMetadata {
  version: 1;
  createdAt: number;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  verification: {
    iv: string;
    ciphertext: string;
  };
  settings: VaultSettings;
}

export interface VaultSettings {
  autoLockMinutes: number;
  clipboardClearSeconds: number;
  theme: "dark" | "light";
  defaultGenerator: {
    length: number;
    upper: boolean;
    lower: boolean;
    digits: boolean;
    symbols: boolean;
    excludeAmbiguous: boolean;
  };
}

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 5,
  clipboardClearSeconds: 30,
  theme: "dark",
  defaultGenerator: {
    length: 20,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
  },
};

export interface BreachCacheEntry {
  prefix: string;
  fetchedAt: number;
  body: string;
}
