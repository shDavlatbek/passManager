import { describe, it, expect } from "vitest";
import { detectAndMap } from "@/lib/csv-import";

const BITWARDEN = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
Finance,,login,Stripe,,,0,https://stripe.com,ops@acme.co,s3cret,`;

const ONEPASSWORD = `title,website,username,password,notes,otpauth
Stripe,https://stripe.com,ops@acme.co,s3cret,,`;

describe("csv-import", () => {
  it("detects Bitwarden format", () => {
    const d = detectAndMap(BITWARDEN);
    expect(d.format).toBe("bitwarden");
    expect(d.entries[0]).toMatchObject({
      service: "Stripe",
      username: "ops@acme.co",
      password: "s3cret",
      tags: ["Finance"],
    });
  });

  it("detects 1Password format", () => {
    const d = detectAndMap(ONEPASSWORD);
    expect(d.format).toBe("1password");
    expect(d.entries[0]).toMatchObject({ service: "Stripe", username: "ops@acme.co", password: "s3cret" });
  });
});
