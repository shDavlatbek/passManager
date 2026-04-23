import { sha256Hex } from "@/lib/crypto";
import type { DecryptedEntry } from "@/types/vault";
import { analyzeStrength } from "@/lib/strength";

export interface VaultAnalysis {
  reusedIds: Set<string>;
  weakIds: Set<string>;
  oldIds: Set<string>;
  reuseGroups: string[][];
}

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

export async function analyzeVault(entries: DecryptedEntry[]): Promise<VaultAnalysis> {
  const hashes: Record<string, string[]> = {};
  for (const e of entries) {
    if (!e.password) continue;
    const h = await sha256Hex(e.password);
    (hashes[h] ||= []).push(e.id);
  }
  const reusedIds = new Set<string>();
  const reuseGroups: string[][] = [];
  for (const group of Object.values(hashes)) {
    if (group.length > 1) {
      group.forEach((id) => reusedIds.add(id));
      reuseGroups.push(group);
    }
  }
  const weakIds = new Set<string>();
  for (const e of entries) {
    const s = analyzeStrength(e.password);
    if (s.score <= 1) weakIds.add(e.id);
  }
  const oldIds = new Set<string>();
  const now = Date.now();
  for (const e of entries) {
    if (e.passwordChangedAt && now - e.passwordChangedAt > NINETY_DAYS) oldIds.add(e.id);
  }
  return { reusedIds, weakIds, oldIds, reuseGroups };
}
