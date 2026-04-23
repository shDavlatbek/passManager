import type { Metadata } from "next";
import { LegalPage, PublicShell, Section } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Terms of Service — Vaulthaus",
  description:
    "Terms of Service for Vaulthaus, a zero-knowledge password manager that runs entirely in your browser.",
};

export default function TermsPage() {
  return (
    <PublicShell>
      <LegalPage title="Terms of Service" effective="January 1, 2026">
        <Section id="acceptance" title="Acceptance of Terms">
          <p>
            By accessing or using the Vaulthaus web application (the &quot;Service&quot;), you
            agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree
            to these Terms, do not use the Service.
          </p>
        </Section>

        <Section id="description" title="Description of Service">
          <p>
            Vaulthaus is a zero-knowledge password manager that runs entirely in your browser. It
            stores encrypted credentials locally in your browser&apos;s IndexedDB and optionally
            syncs an encrypted backup to your own Google Drive via OAuth. The Service does not
            include any server-side component operated by us; we do not have access to your data.
          </p>
        </Section>

        <Section id="account" title="No Account, No Recovery">
          <p>
            Vaulthaus does not require account registration. Your master password is the sole key
            to your encrypted vault and is known only to you. <strong>If you lose your master
            password, your vault cannot be recovered by anyone, including us.</strong> We strongly
            recommend keeping a secure offline copy of your master password and exporting periodic
            backups.
          </p>
        </Section>

        <Section id="acceptable-use" title="Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc list-outside ml-5 space-y-1.5">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
            <li>
              Attempt to compromise, reverse-engineer for malicious purposes, disrupt, or
              circumvent the security mechanisms of the Service.
            </li>
            <li>
              Use the Service to store, transmit, or facilitate the distribution of malware,
              illegal content, or material that violates third-party rights.
            </li>
            <li>
              Misrepresent your identity or impersonate any person or entity in connection with
              your use of the Service or any sharing features.
            </li>
            <li>
              Use the Service to manage credentials you are not authorized to possess.
            </li>
          </ul>
        </Section>

        <Section id="user-content" title="Your Content">
          <p>
            You retain all rights to the credentials, notes, and other data (&quot;Your
            Content&quot;) that you store in Vaulthaus. Because Your Content remains encrypted on
            your device and is never transmitted to us, we claim no rights to it and have no
            ability to access it.
          </p>
          <p>
            You are solely responsible for the legality and accuracy of Your Content and for
            ensuring you have the right to store and use the credentials it contains.
          </p>
        </Section>

        <Section id="third-party" title="Third-Party Services">
          <p>
            The Service integrates optional third-party services (Have I Been Pwned, Google Drive
            via OAuth, Google Identity Services, DuckDuckGo Favicons, Google Fonts). Your use of
            those services is governed by their respective terms and privacy policies. We are not
            responsible for the availability, accuracy, or behavior of third-party services.
          </p>
        </Section>

        <Section id="disclaimer" title="Disclaimer of Warranties">
          <p className="uppercase text-xs tracking-wider">
            The service is provided &quot;as is&quot; and &quot;as available&quot;, without
            warranty of any kind, express or implied, including but not limited to the warranties
            of merchantability, fitness for a particular purpose, non-infringement, or that the
            service will be uninterrupted, secure, or error-free.
          </p>
          <p>
            While Vaulthaus uses well-established cryptographic primitives, no software is immune
            to bugs, vulnerabilities, or compromise of the device on which it runs. You assume all
            responsibility for evaluating whether the Service meets your security requirements.
          </p>
        </Section>

        <Section id="liability" title="Limitation of Liability">
          <p className="uppercase text-xs tracking-wider">
            To the maximum extent permitted by applicable law, in no event shall the maintainers
            or contributors of Vaulthaus be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of data, use, goodwill, or other
            intangible losses, arising out of or in connection with your use of, or inability to
            use, the service.
          </p>
        </Section>

        <Section id="indemnification" title="Indemnification">
          <p>
            You agree to indemnify and hold harmless the maintainers and contributors of
            Vaulthaus from and against any claims, liabilities, damages, losses, and expenses
            (including reasonable attorney&apos;s fees) arising out of or in any way connected
            with your access to or use of the Service, your violation of these Terms, or your
            violation of any third-party rights.
          </p>
        </Section>

        <Section id="modifications" title="Modifications to the Service and Terms">
          <p>
            We may modify or discontinue the Service, in whole or in part, at any time. We may
            also revise these Terms from time to time; the &quot;Effective&quot; date at the top
            of this page reflects the most recent version. Continued use of the Service after
            changes constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section id="termination" title="Termination">
          <p>
            You may stop using the Service at any time by clearing your browser&apos;s site data
            for the Vaulthaus origin and revoking any third-party OAuth grants. We may suspend or
            terminate access to any deployment of the Service at our discretion, with or without
            notice.
          </p>
        </Section>

        <Section id="governing-law" title="Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which the operator of your Vaulthaus deployment is established,
            without regard to conflict-of-law provisions.
          </p>
        </Section>

        <Section id="severability" title="Severability">
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that
            provision will be limited or eliminated to the minimum extent necessary so that the
            remaining Terms remain in full force and effect.
          </p>
        </Section>

        <Section id="contact-terms" title="Contact">
          <p>
            For questions about these Terms, please open an issue on the project&apos;s GitHub
            repository or contact the maintainer of the deployment you are using.
          </p>
        </Section>
      </LegalPage>
    </PublicShell>
  );
}
