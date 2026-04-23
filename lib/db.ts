import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BreachCacheEntry, EncryptedEntry, VaultMetadata } from "@/types/vault";

interface VaultDB extends DBSchema {
  meta: {
    key: "vault";
    value: VaultMetadata;
  };
  entries: {
    key: string;
    value: EncryptedEntry;
    indexes: { "by-service": string; "by-updated": number };
  };
  breach: {
    key: string;
    value: BreachCacheEntry;
  };
}

const DB_NAME = "vaulthaus";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<VaultDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VaultDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("meta");
        const entries = db.createObjectStore("entries", { keyPath: "meta.id" });
        entries.createIndex("by-service", "meta.service");
        entries.createIndex("by-updated", "meta.updatedAt");
        db.createObjectStore("breach", { keyPath: "prefix" });
      },
    });
  }
  return dbPromise;
}

export async function getVaultMeta(): Promise<VaultMetadata | undefined> {
  const db = await getDB();
  return db.get("meta", "vault");
}

export async function setVaultMeta(meta: VaultMetadata): Promise<void> {
  const db = await getDB();
  await db.put("meta", meta, "vault");
}

export async function clearVault(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["meta", "entries", "breach"], "readwrite");
  await Promise.all([tx.objectStore("meta").clear(), tx.objectStore("entries").clear(), tx.objectStore("breach").clear()]);
  await tx.done;
}

export async function listEntries(): Promise<EncryptedEntry[]> {
  const db = await getDB();
  return db.getAll("entries");
}

export async function getEntry(id: string): Promise<EncryptedEntry | undefined> {
  const db = await getDB();
  return db.get("entries", id);
}

export async function putEntry(entry: EncryptedEntry): Promise<void> {
  const db = await getDB();
  await db.put("entries", entry);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("entries", id);
}

export async function getBreachCache(prefix: string): Promise<BreachCacheEntry | undefined> {
  const db = await getDB();
  return db.get("breach", prefix);
}

export async function putBreachCache(entry: BreachCacheEntry): Promise<void> {
  const db = await getDB();
  await db.put("breach", entry);
}
