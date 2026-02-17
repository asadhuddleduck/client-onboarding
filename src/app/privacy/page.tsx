import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Huddle Duck",
  description: "How Huddle Duck handles your data when you connect your Meta ad account.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1
        className="text-2xl font-extrabold mb-2 tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        Privacy Policy
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Last updated: February 2026
      </p>

      <div
        className="rounded-2xl p-6 space-y-6"
        style={{
          background: "var(--gradient-card)",
          border: "1px solid var(--border)",
        }}
      >
        <Section title="Who We Are">
          <p>
            Huddle Duck is a marketing agency that manages Meta (Facebook and
            Instagram) advertising campaigns for clients. This app is our client
            onboarding tool, used to securely connect client ad accounts to our
            agency.
          </p>
        </Section>

        <Section title="What Data We Access">
          <p>
            When you connect via Facebook Login, we request the{" "}
            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>
              business_management
            </code>{" "}
            permission. This allows us to:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              View the names and IDs of your Business Managers (Meta Business
              Portfolios)
            </li>
            <li>View the names, IDs, and status of your ad accounts</li>
            <li>
              Add your selected ad account to our agency&apos;s Business Manager
              as a partner asset
            </li>
          </ul>
          <p className="mt-2">
            After partner access is granted, we also read your ad account&apos;s
            status fields (account status, currency, timezone) to verify the
            account is active and in good standing.
          </p>
        </Section>

        <Section title="How We Use Your Data">
          <p>We use your data solely for:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Connecting your ad account to our agency so we can manage your
              advertising campaigns
            </li>
            <li>
              Verifying your ad account is active and not restricted before we
              begin work
            </li>
            <li>
              Creating an internal client record (business name, ad account ID,
              currency) so our reporting dashboards can display your campaign
              performance
            </li>
          </ul>
          <p className="mt-2">
            We do not sell, share, or transfer your data to any third parties.
            We do not use your data for any purpose other than managing your
            advertising campaigns as agreed in our service contract.
          </p>
        </Section>

        <Section title="How We Store Your Data">
          <p>
            Your business name, ad account ID, and account status are stored in
            an encrypted database (Turso/LibSQL) hosted on secure cloud
            infrastructure. Your Facebook access token is used only during the
            onboarding session and is not stored permanently.
          </p>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your client record for the duration of our business
            relationship. When our engagement ends, we will remove your data
            from our systems within 30 days of your request.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Request a copy of all data we hold about your business
            </li>
            <li>Request deletion of your data at any time</li>
            <li>
              Revoke our partner access to your ad account at any time through
              your Meta Business Settings
            </li>
          </ul>
        </Section>

        <Section title="Contact Us">
          <p>
            To exercise any of these rights or if you have questions about this
            privacy policy, please contact us at:
          </p>
          <p className="mt-2 font-semibold" style={{ color: "var(--viridian)" }}>
            hello@huddleduck.co.uk
          </p>
        </Section>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/"
          className="text-sm font-semibold"
          style={{ color: "var(--viridian)" }}
        >
          ← Back to onboarding
        </a>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        className="text-base font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>
    </div>
  );
}
