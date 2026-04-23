import { describe, it, expect } from "vitest";
import { generateTotp, base32Decode, parseOtpAuthUrl, isValidBase32 } from "@/lib/totp";

// RFC 6238 Appendix B test vectors (SHA-1, key = "12345678901234567890" as ASCII)
// 20-byte ASCII key "12345678901234567890" in base32 = GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp", () => {
  it("decodes base32", () => {
    const bytes = base32Decode(RFC_SECRET);
    expect(bytes.length).toBe(20);
    const ascii = Array.from(bytes).map((b) => String.fromCharCode(b)).join("");
    expect(ascii).toBe("12345678901234567890");
  });

  it("matches RFC 6238 SHA-1 vectors", async () => {
    // time 59s -> code 94287082 -> 8-digit; 6-digit truncation = 287082
    const r1 = await generateTotp(RFC_SECRET, { digits: 6, at: 59_000 });
    expect(r1.code).toBe("287082");
    // time 1111111109 -> 07081804 (8-digit) -> 081804 (6-digit)
    const r2 = await generateTotp(RFC_SECRET, { digits: 6, at: 1_111_111_109_000 });
    expect(r2.code).toBe("081804");
    // time 1234567890 -> 89005924 (8-digit) -> 005924
    const r3 = await generateTotp(RFC_SECRET, { digits: 6, at: 1_234_567_890_000 });
    expect(r3.code).toBe("005924");
  });

  it("parses otpauth:// URLs", () => {
    const p = parseOtpAuthUrl("otpauth://totp/Vaulthaus:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Vaulthaus&period=30&digits=6");
    expect(p?.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(p?.issuer).toBe("Vaulthaus");
  });

  it("validates base32", () => {
    expect(isValidBase32("JBSWY3DPEHPK3PXP")).toBe(true);
    expect(isValidBase32("not valid!")).toBe(false);
  });
});
