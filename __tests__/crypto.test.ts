import { describe, it, expect } from "vitest";
import { createVaultKey, unlockVaultKey, encryptJSON, decryptJSON, base64ToBytes } from "@/lib/crypto";

describe("crypto", () => {
  it("round-trips JSON via AES-GCM", async () => {
    const { key } = await createVaultKey("correct horse battery staple");
    const { iv, ciphertext } = await encryptJSON(key, { hello: "world", n: 42 });
    const out = await decryptJSON<{ hello: string; n: number }>(key, iv, ciphertext);
    expect(out).toEqual({ hello: "world", n: 42 });
  });

  it("rejects wrong master password", async () => {
    const { salt, verification } = await createVaultKey("good-password-123!");
    const wrong = await unlockVaultKey("bad-password", salt, verification);
    expect(wrong).toBeNull();
    const right = await unlockVaultKey("good-password-123!", salt, verification);
    expect(right).not.toBeNull();
  });

  it("produces unique IVs per encryption", async () => {
    const { key } = await createVaultKey("pw");
    const a = await encryptJSON(key, { v: 1 });
    const b = await encryptJSON(key, { v: 1 });
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
    expect(base64ToBytes(a.iv).length).toBe(12);
  });
});
