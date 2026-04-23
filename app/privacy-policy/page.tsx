import type { Metadata } from "next";
import { LegalPage, PublicShell, Section } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Vaulthaus",
  description:
    "Vaulthaus is a zero-knowledge password manager. We do not collect, store, transmit, or process your data on any server we control.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <LegalPage title="Privacy Policy" effective="January 1, 2026">
        <Section id="overview" title="Overview">
          <p>
            Vaulthaus is a zero-knowledge password manager that runs entirely in your browser. We
            do not operate a server, we do not have a database, and we have no ability to read,
            recover, or transmit your passwords or any other vault contents. This Privacy Policy
            describes the limited ways the application interacts with your device and any
            third-party services you choose to enable.
          </p>
          <p>
            For the purposes of this policy, &quot;Vaulthaus&quot;, &quot;the app&quot;, or
            &quot;we&quot; refers to the Vaulthaus open-source web application. &quot;You&quot;
            refers to the individual using the app in their own browser.
          </p>
        </Section>

        <Section id="data-we-collect" title="Information We Collect">
          <p>
            <strong>None on a server.</strong> Vaulthaus does not transmit credentials, vault
            contents, master passwords, usage analytics, telemetry, error reports, or any
            personally identifying information to any server controlled by us. We do not have a
            backend.
          </p>
          <p>
            <strong>Stored locally on your device:</strong>
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1.5">
            <li>
              <strong>Encrypted vault data</strong> — every credential, note, and TOTP secret you
              save is encrypted with AES-256-GCM using a key derived from your master password
              (PBKDF2-SHA256, 600,000 iterations). The ciphertext is stored in your browser&apos;s
              IndexedDB. The plaintext is never written to disk.
            </li>
            <li>
              <strong>Vault metadata</strong> — KDF parameters (iteration count, random salt) and a
              small encrypted verification blob used to detect an incorrect master password.
            </li>
            <li>
              <strong>User preferences</strong> — your theme choice (dark or light), auto-lock
              timeout, clipboard auto-clear duration, and default password generator settings.
            </li>
            <li>
              <strong>Optional cached lookups</strong> — anonymized SHA-1 prefix responses from the
              breach-check service (see below), retained for up to 24 hours to avoid repeat
              network calls.
            </li>
            <li>
              <strong>Optional Google access token</strong> — if you enable Cloud Sync, the OAuth
              access token Google issues is cached in <span className="font-mono text-xs">localStorage</span>{" "}
              for the lifetime of the token (typically one hour). The token grants access only to
              the Vaulthaus app folder in your Google Drive — see &quot;Google Drive sync&quot;
              below.
            </li>
          </ul>
          <p>
            All locally stored data can be wiped at any time from the Settings page or by clearing
            your browser&apos;s site data for the Vaulthaus origin.
          </p>
        </Section>

        <Section id="master-password" title="Your Master Password">
          <p>
            Your master password never leaves your browser. It is used only to derive the
            encryption key for your vault. We do not transmit it, store it in plaintext, or have
            any mechanism to recover it. If you forget your master password, your vault cannot be
            decrypted by anyone — including us.
          </p>
        </Section>

        <Section id="third-party-services" title="Third-Party Services">
          <p>
            Vaulthaus optionally communicates with the following third-party services. Each one is
            opt-in or scoped to specific actions you take.
          </p>

          <div>
            <h3 className="font-display font-bold text-sm text-[var(--color-text)] mt-4 mb-1.5">
              Have I Been Pwned (haveibeenpwned.com)
            </h3>
            <p>
              When you run a breach scan from the Health page, Vaulthaus computes the SHA-1 hash
              of each of your stored passwords locally, and sends only the first five hexadecimal
              characters of each hash to <span className="font-mono text-xs">api.pwnedpasswords.com</span>.
              The full hash and the password itself never leave your device. This technique is
              known as <em>k-anonymity</em>. The HIBP service receives no information that lets it
              identify you or learn your passwords. See{" "}
              <a className="underline hover:text-[var(--color-text)]" target="_blank" rel="noreferrer" href="https://haveibeenpwned.com/Privacy">
                haveibeenpwned.com/Privacy
              </a>
              .
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-[var(--color-text)] mt-4 mb-1.5">
              Google Drive (sync — opt-in only)
            </h3>
            <p>
              If you choose to enable Cloud Sync, Vaulthaus uses Google Identity Services to
              request the <span className="font-mono text-xs">drive.appdata</span> OAuth scope.
              This scope grants Vaulthaus access to a hidden, per-application folder in your
              Google Drive — and nothing else. We cannot read, list, modify, or delete any other
              file in your Drive.
            </p>
            <p>
              When you press Upload, Vaulthaus uploads only the already-encrypted ciphertext of
              your vault, plus the KDF metadata (salt, iteration count, verification blob). Google
              receives encrypted data that it has no key to decrypt. When you press Restore,
              Vaulthaus downloads that same encrypted blob and replaces your local vault.
            </p>
            <p>
              You can revoke Vaulthaus&apos;s Google Drive access at any time at{" "}
              <a className="underline hover:text-[var(--color-text)]" target="_blank" rel="noreferrer" href="https://myaccount.google.com/permissions">
                myaccount.google.com/permissions
              </a>
              . Revoking access does not delete the encrypted backup file in your Drive — to
              delete it, use the Drive Files API or empty your trash. Information you provide to
              Google is governed by Google&apos;s Privacy Policy.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-[var(--color-text)] mt-4 mb-1.5">
              DuckDuckGo Favicons
            </h3>
            <p>
              When you save a credential with a URL, Vaulthaus may request a favicon from{" "}
              <span className="font-mono text-xs">icons.duckduckgo.com</span> for visual
              identification. The request transmits the hostname of the URL you saved (e.g.{" "}
              <span className="font-mono text-xs">github.com</span>). It does not transmit the
              full URL, your username, password, or any other vault data.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-[var(--color-text)] mt-4 mb-1.5">
              Google Fonts
            </h3>
            <p>
              The application loads typefaces from <span className="font-mono text-xs">fonts.googleapis.com</span>{" "}
              and <span className="font-mono text-xs">fonts.gstatic.com</span>. These requests are
              made by your browser as part of normal stylesheet loading and contain no vault data.
            </p>
          </div>
        </Section>

        <Section id="cookies" title="Cookies">
          <p>
            Vaulthaus does not set cookies. The app uses browser <span className="font-mono text-xs">localStorage</span>{" "}
            and <span className="font-mono text-xs">IndexedDB</span> for local storage of your
            vault, preferences, and (if enabled) Google access token. None of this data is
            transmitted to us.
          </p>
        </Section>

        <Section id="children" title="Children's Privacy">
          <p>
            Vaulthaus is not directed at children under the age of 13 and we do not knowingly
            collect personal information from children. Because Vaulthaus does not collect any
            personal information at all on a server, this restriction is structural rather than
            policy-based.
          </p>
        </Section>

        <Section id="data-retention" title="Data Retention">
          <p>
            All vault data is retained on your device until you delete it. You can wipe the local
            vault from the Settings page (&quot;Wipe vault on this device&quot;), or by clearing
            site data in your browser. If you have enabled Cloud Sync, the encrypted backup file
            in your Google Drive is retained until you delete it from your Drive or revoke
            Vaulthaus&apos;s access.
          </p>
        </Section>

        <Section id="your-rights" title="Your Rights">
          <p>
            Because we do not collect or process your personal data, traditional data subject
            rights (access, rectification, erasure, restriction, portability, objection) apply
            directly to the local copy of your vault on your device:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1.5">
            <li>
              <strong>Access &amp; portability</strong> — export your vault at any time from the
              Settings page (encrypted backup or plaintext JSON).
            </li>
            <li>
              <strong>Erasure</strong> — wipe your vault at any time from the Settings page.
            </li>
            <li>
              <strong>Rectification</strong> — edit any credential at any time from the vault.
            </li>
            <li>
              <strong>Withdrawal of consent for sync</strong> — disconnect Google Drive from the
              Sync page, and revoke the OAuth grant in your Google Account.
            </li>
          </ul>
        </Section>

        <Section id="security" title="Security">
          <p>
            Vaulthaus uses cryptographic primitives provided by your browser&apos;s Web Crypto
            API: PBKDF2-SHA256 (600,000 iterations, OWASP 2023 guidance) for key derivation,
            AES-256-GCM for encryption with unique 96-bit IVs per encryption, and SHA-1 / SHA-256
            for hashing as appropriate. Source code is available for inspection; the app does not
            ship third-party cryptography libraries.
          </p>
          <p>
            Vaulthaus cannot defend against compromise of the device on which it runs. Malicious
            browser extensions, keyloggers, or operating system compromise can reveal your master
            password as you type it. Use Vaulthaus on devices you trust.
          </p>
        </Section>

        <Section id="international" title="International Data Transfers">
          <p>
            Because Vaulthaus does not transmit your vault to any server controlled by us, no
            international transfer of personal data occurs through our use. If you enable Cloud
            Sync, your encrypted backup is transferred to Google&apos;s infrastructure under
            Google&apos;s terms.
          </p>
        </Section>

        <Section id="changes" title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The &quot;Effective&quot; date at
            the top of this page reflects the most recent version. Material changes will be
            highlighted in the application&apos;s release notes.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            For questions about this policy, please open an issue on the project&apos;s GitHub
            repository or contact the maintainer of the deployment you are using.
          </p>
        </Section>
      </LegalPage>
    </PublicShell>
  );
}
