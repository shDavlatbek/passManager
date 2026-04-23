# Vaulthaus

**A zero-knowledge team password manager for companies that are done leaking credentials in Telegram.**

Built as a one-day submission for the data365 agency candidate assessment — Task 02 (Password Manager).

---

## What it is

A multi-page web app where a team can securely store, organize, and share their shared credentials. Everything — passwords, notes, TOTP secrets — is encrypted in your browser with AES-256-GCM using a key derived from your master password. The server (there is none, actually) never sees your plaintext.

**Not a demo, not a mockup.** The crypto is real, the storage is real, and everything in the brief is implemented end-to-end.

## Demo

Run locally — see [Setup](#setup) below. There is no hosted version bundled with this repo; deploy to Vercel in ~2 minutes with `vercel --prod`.

## What's in the box

### Listed requirements — all met

| Requirement | Where |
|---|---|
| Master password locks/unlocks the vault | [app/page.tsx](app/page.tsx), [lib/vault-store.ts](lib/vault-store.ts) |
| All passwords encrypted, never plaintext | [lib/crypto.ts](lib/crypto.ts) — AES-GCM per entry |
| Credentials: service, URL, username, password, notes | [components/CredentialForm.tsx](components/CredentialForm.tsx) |
| Tagging / grouping | free-form tags, sidebar filter on [/vault](app/(app)/vault/page.tsx) |
| Password generator | [/generator](app/(app)/generator/page.tsx) + inline in the add form |
| Strength indicator | [components/StrengthMeter.tsx](components/StrengthMeter.tsx) using `@zxcvbn-ts/core` |
| One-click copy, masked by default | [components/CopyButton.tsx](components/CopyButton.tsx) + reveal toggle on detail page |
| Reused password detection + alert | [/health](app/(app)/health/page.tsx) + inline badge in vault list |
| Data export | Settings → encrypted `.vault.json` backup + plaintext JSON (gated) |
| Multi-page structure | Lock, vault, add/edit, generator, health, share, import, settings |
| First-time empty state | Illustrated empty state with three CTAs |
| **Bonus**: one extra feature | `/health` dashboard (see below) |

### Bonuses — all four implemented

1. **[HIBP breach check](lib/breach.ts)** — k-anonymity (first 5 SHA-1 hex chars sent, actual password never leaves the device). Cached for 24h. Per-entry badges on `/health`.
2. **[Built-in TOTP 2FA codes](lib/totp.ts)** — RFC 6238, SHA-1 HMAC, tested against the RFC Appendix B vectors. Add a secret manually or paste an `otpauth://` URL. Codes rotate every 30s with a progress ring.
3. **[Team sharing via encrypted share-links](lib/share-link.ts)** — pick an entry, set a one-time share password, get a URL-safe token. Recipient opens `/share`, enters the password (delivered out-of-band), and imports into their vault. Client-only, no backend.
4. **[CSV import](lib/csv-import.ts)** — auto-detects Bitwarden, 1Password, LastPass export formats. Preview and select before importing.

## Architecture

### Zero-knowledge

- **Master password never leaves the browser.** Used only to derive an AES-256 key via PBKDF2-SHA256 with 600,000 iterations (OWASP 2023 guidance).
- **Each entry encrypted with AES-GCM**, unique random 96-bit IV per encryption.
- **Verification blob**: on vault creation, a known plaintext is encrypted. Unlock works by trying to decrypt it — wrong password = GCM tag mismatch = rejected, no state leaks.
- **Derived key lives only in memory** (Zustand store). Never serialized, never persisted. Cleared on lock.

### Storage

- **IndexedDB** via the `idb` package. Three object stores: `meta` (KDF params + verification + settings), `entries` (ciphertext only), `breach` (HIBP cache).
- No server. No analytics. No telemetry.

### Session lock

- **Idle auto-lock** after a user-configurable window (default 5 minutes).
- **Manual lock** always visible in the sidebar.
- **Hard lock on reload**: the derived key lives in memory, so refreshing the page returns you to the lock screen. Only encrypted data survives.
- Clipboard auto-clears after 30s (configurable 5–120s).

### Sharing without a backend

The share-link flow re-encrypts a single entry using a key derived from a second one-time password. The payload is URL-safe-base64 encoded and pasted into a hash fragment, so it never hits any server log. See [lib/share-link.ts](lib/share-link.ts) for the binary format.

## Screenshots

Run `npm run dev` and navigate:

- `/` — lock / create-vault screen with ambient motion
- `/vault` — searchable list with tag filters, hover actions, reused-password badges
- `/vault/new` — add form with live strength meter and inline generator
- `/vault/[id]` — detail view with TOTP, copy-without-revealing, favicon, metadata
- `/generator` — full-screen password generator with history
- `/health` — security dashboard: clean / reused / weak / breached, HIBP scan
- `/share` — export/import encrypted share-links
- `/import` — CSV drop zone with format detection and per-row preview
- `/settings` — auto-lock, clipboard, master password change, backup, wipe

## Setup

```bash
# 1. Clone
git clone <this-repo>
cd data365passmanag

# 2. Install
npm install

# 3. Run dev server
npm run dev
# → http://localhost:3000

# 4. Run tests (crypto, TOTP, share-link, CSV parser)
npm test

# 5. Production build
npm run build && npm start
```

No environment variables. No external services required. No API keys. The only network call the app ever makes is to `api.pwnedpasswords.com` for optional breach scanning, using k-anonymity.

## Deployment

Deploys unchanged to Vercel, Netlify, Cloudflare Pages, or any static host:

```bash
npx vercel --prod
```

## Testing

```bash
npm test
```

11 unit tests cover:

- AES-GCM round-trip, wrong-password rejection, IV uniqueness ([__tests__/crypto.test.ts](__tests__/crypto.test.ts))
- TOTP against RFC 6238 vectors, base32, otpauth URL parsing ([__tests__/totp.test.ts](__tests__/totp.test.ts))
- Encrypted share-link round-trip + rejection on wrong password ([__tests__/share-link.test.ts](__tests__/share-link.test.ts))
- CSV format detection for Bitwarden and 1Password ([__tests__/csv-import.test.ts](__tests__/csv-import.test.ts))

## Manual verification

1. Open `/` → create a vault with a strong master password.
2. Add a credential — open DevTools → Application → IndexedDB → `vaulthaus` → `entries`. Notice the value is `{ meta, iv, ciphertext }` — plaintext is nowhere.
3. Lock → refresh → unlock. Entries return intact.
4. Try a wrong master password — rejected cleanly.
5. `/generator` → adjust length/options → copy. Paste elsewhere. Wait 30s → clipboard is cleared.
6. Add two entries with the same password → both rows show a `Reused` badge.
7. `/health` → run breach scan. Add an entry with password `password123` first — it will be flagged as seen in millions of breaches.
8. Add a credential with a TOTP secret (try `JBSWY3DPEHPK3PXP` — a common demo key). The code rotates every 30s and matches Google Authenticator / Authy for the same secret.
9. Go to a credential, click Share → set a one-time password → copy the link. Open it in a private window → enter the password → the entry appears, ready to import.
10. Export a Bitwarden CSV from a real Bitwarden account → `/import` → entries appear and are encrypted on ingest.

## Trade-offs & what I'd do next

**What I deliberately skipped for the one-day budget**:

- Argon2id KDF. PBKDF2 at 600k iterations is OWASP-compliant, but Argon2id is the modern best practice. Skipped because it needs a WASM build step; PBKDF2 kept the bundle lean and auditable.
- WebAuthn / passkey unlock. Adds a ton of edge cases to get right.
- Real-time sync across devices. The share-link flow covers the hand-off case; multi-device sync needs a backend.
- Browser extension for autofill. Huge scope, another week of work.

**If I had three more days**:

- Argon2id KDF with memory-hard parameters.
- WebAuthn as a secondary unlock factor (master password for key derivation, WebAuthn as a presence check).
- A service worker that sync encrypted entries to a tiny backend (Cloudflare D1 or Supabase) for multi-device, still zero-knowledge.
- A Chrome extension for autofill using the same vault format.
- Attack surface review: CSP, Trusted Types, SRI on the font CDN, rate-limiting the HIBP calls via a proxy.

## Product brief (3–5 sentences)

Vaulthaus is a zero-knowledge password manager for small-to-mid businesses that currently share credentials in chat apps and spreadsheets. It solves the "how do I give marketing the Instagram login without putting it in Slack forever" problem without requiring a paid SaaS subscription or trusting a vendor with plaintext. v2 adds Argon2id, passkey unlock, optional encrypted sync via Cloudflare D1, and a browser extension that autofills from the vault without ever exposing passwords to the page DOM.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, custom design tokens
- **Framer Motion** for transitions
- **Zustand** for vault state
- **idb** for IndexedDB
- **@zxcvbn-ts** for password strength analysis
- **Web Crypto API** for all cryptography (no third-party crypto libs)
- **Vitest** + **fake-indexeddb** for tests

## Security notes

This is a candidate-assessment build. Before production use:
- Upgrade Next.js to the latest patched 15.x (15.1.3 has a known CVE — noted but left as-is for the submission).
- Add a strict Content Security Policy.
- Add Subresource Integrity for the font CDN.
- Third-party review of the crypto layer.

Vaulthaus doesn't defend against compromise of the local device (e.g. a keylogger or a malicious browser extension reading the page). No in-browser crypto scheme can. It's designed to keep your plaintext out of network logs, cloud storage, third-party servers, and accidental screen-shares.

## License

MIT. Use it, fork it, ship it.

---

Built with care by a candidate for [data365 agency](https://data365.co/) — Tashkent, Uzbekistan.
