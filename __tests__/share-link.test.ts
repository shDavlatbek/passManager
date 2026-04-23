import { describe, it, expect } from "vitest";
import { encodeShareLink, decodeShareLink } from "@/lib/share-link";

describe("share-link", () => {
  it("round-trips an entry under the share password", async () => {
    const payload = {
      service: "Stripe",
      username: "ops@acme.co",
      password: "s3cretKey!@#",
      url: "https://dashboard.stripe.com",
      notes: "Finance team access",
      sharedAt: Date.now(),
    };
    const token = await encodeShareLink(payload, "hand-off-code-1234");
    const decoded = await decodeShareLink(token, "hand-off-code-1234");
    expect(decoded).toMatchObject({ service: "Stripe", username: "ops@acme.co", password: "s3cretKey!@#" });
  });

  it("rejects wrong share password", async () => {
    const token = await encodeShareLink(
      { service: "x", password: "p", sharedAt: 0 },
      "correct",
    );
    const result = await decodeShareLink(token, "wrong");
    expect(result).toBeNull();
  });
});
