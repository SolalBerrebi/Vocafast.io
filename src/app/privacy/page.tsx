export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 22, 2026</p>

        <p className="text-gray-600 mb-8">
          Vocafast (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a vocabulary learning
          application. This Privacy Policy explains how we collect, use, and
          protect your information.
        </p>

        <Section title="1. Information We Collect">
          <H3>Account Information</H3>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li><strong>Email address</strong> — used for authentication and account recovery.</li>
            <li><strong>Display name</strong> — used to personalize your experience.</li>
          </ul>

          <H3>Learning Data</H3>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li>Vocabulary words and translations you add to your decks.</li>
            <li>Training session results (correct/incorrect answers, response times, XP earned).</li>
            <li>Spaced repetition data (review schedules, ease factors) to optimize your learning.</li>
            <li>Streak and progress statistics.</li>
          </ul>

          <H3>AI-Processed Data</H3>
          <p className="text-gray-600 mb-2">
            When you use AI-powered features (topic generation, photo extraction,
            text extraction, voice capture), the following data is sent to our AI
            provider for processing:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li><strong>Text input</strong> you type or paste.</li>
            <li><strong>Images</strong> you capture or select from your photo library.</li>
            <li>
              <strong>Voice recordings</strong> transcribed on-device via Apple
              Speech Recognition — only the resulting text transcript is sent to
              our AI provider.
            </li>
          </ul>
          <p className="text-gray-600">
            This data is processed solely to extract vocabulary and is not stored
            by our AI provider beyond the duration of the request.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-6 space-y-1 text-gray-600">
            <li>Provide and improve the vocabulary learning experience.</li>
            <li>Generate AI-powered vocabulary from your input.</li>
            <li>Calculate spaced repetition schedules for optimal learning.</li>
            <li>Track your progress (XP, streaks, levels).</li>
            <li>Send you notifications you have opted into (daily reminders, streak alerts).</li>
            <li>Process subscription purchases via Apple&apos;s StoreKit.</li>
          </ul>
        </Section>

        <Section title="3. Data Storage and Security">
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              Your account and learning data is stored securely on{" "}
              <strong>Supabase</strong> (hosted on AWS) with row-level security
              policies that ensure you can only access your own data.
            </li>
            <li>Passwords are managed by Supabase Auth and are never stored in plaintext.</li>
            <li>Offline data is stored locally on your device in an encrypted application sandbox.</li>
            <li>All network communication uses HTTPS encryption.</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 mb-4">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2">Data Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="py-2 pr-4 font-medium">Supabase</td><td className="py-2 pr-4">Authentication, database</td><td className="py-2">Account info, learning data</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Groq</td><td className="py-2 pr-4">AI vocabulary extraction</td><td className="py-2">Text, image content (not stored)</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Apple StoreKit</td><td className="py-2 pr-4">Subscription management</td><td className="py-2">Purchase transactions</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Apple Speech</td><td className="py-2 pr-4">On-device voice-to-text</td><td className="py-2">Audio processed on-device only</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600">
            We do <strong>not</strong> use any analytics, advertising, or tracking SDKs.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p className="text-gray-600">
            We do <strong>not</strong> sell, rent, or share your personal
            information with third parties for marketing or advertising purposes.
            Your data is only shared with the third-party services listed above,
            solely to provide app functionality.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <ul className="list-disc pl-6 space-y-1 text-gray-600">
            <li>Your data is retained as long as your account is active.</li>
            <li>
              You can delete your account at any time from Settings &gt; Account
              &gt; Delete Account. This permanently removes all your data from
              our servers.
            </li>
            <li>Offline cached data is removed when you uninstall the app or manually clear downloads.</li>
          </ul>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-gray-600">
            Vocafast is not directed at children under the age of 13. We do not
            knowingly collect personal information from children under 13. If we
            become aware that we have collected data from a child under 13, we
            will delete it promptly.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p className="text-gray-600 mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li><strong>Access</strong> your data (visible in the app at all times).</li>
            <li><strong>Export</strong> your vocabulary data (Settings &gt; Import &amp; Export).</li>
            <li><strong>Delete</strong> your account and all associated data.</li>
            <li><strong>Modify</strong> your personal information (email, password) from Settings.</li>
          </ul>
          <p className="text-gray-600">
            For users in the European Economic Area (EEA), you also have the
            right to data portability and to lodge a complaint with your local
            data protection authority.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p className="text-gray-600">
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes through the app or via email. Continued
            use of the app after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-gray-600">
            If you have questions about this Privacy Policy, contact us at:{" "}
            <a href="mailto:support@vocafast-io.com" className="text-blue-600 hover:underline">
              support@vocafast-io.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mb-2">{children}</h3>;
}
