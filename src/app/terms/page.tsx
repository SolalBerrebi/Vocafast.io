export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms of Use
        </h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 22, 2026</p>

        <p className="text-gray-600 mb-8">
          These Terms of Use (&quot;Terms&quot;) govern your use of the Vocafast
          mobile application (&quot;the app&quot;, &quot;we&quot;, &quot;our&quot;).
          By using the app, you agree to these Terms.
        </p>

        <Section title="1. Description of Service">
          <p className="text-gray-600">
            Vocafast is a vocabulary learning application that helps users build
            and practice vocabulary using flashcards, AI-powered word generation,
            spaced repetition, and various training modes. The app is available
            with a free tier and an optional paid subscription (Vocafast Pro).
          </p>
        </Section>

        <Section title="2. Account Registration">
          <ul className="list-disc pl-6 space-y-1 text-gray-600">
            <li>You must provide a valid email address to create an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 13 years old to use the app.</li>
            <li>One person may not maintain more than one account.</li>
          </ul>
        </Section>

        <Section title="3. Free Tier and Vocafast Pro Subscription">
          <H3>Free Tier</H3>
          <p className="text-gray-600 mb-4">
            The free tier includes unlimited decks, words, manual entry, training
            sessions (flashcard, multiple choice, typing), spaced repetition, XP,
            streaks, and levels. AI-powered features are available with weekly
            usage limits.
          </p>

          <H3>Vocafast Pro</H3>
          <p className="text-gray-600 mb-2">
            Vocafast Pro is an optional auto-renewable subscription that unlocks:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li>Unlimited AI vocabulary generations</li>
            <li>Increased words per AI generation</li>
            <li>Voice capture</li>
            <li>Example sentences</li>
            <li>Offline mode (deck downloads)</li>
            <li>Unlimited languages</li>
            <li>Unlimited deck imports</li>
            <li>Mistakes-only training</li>
          </ul>

          <H3>Subscription Terms</H3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
            <li>
              <strong>Payment</strong> will be charged to your Apple ID account
              at confirmation of purchase.
            </li>
            <li>
              <strong>Subscription</strong> automatically renews unless
              auto-renewal is turned off at least 24 hours before the end of the
              current period.
            </li>
            <li>
              <strong>Account</strong> will be charged for renewal within 24
              hours prior to the end of the current period at the current
              subscription price.
            </li>
            <li>
              <strong>Management</strong> — You can manage your subscription and
              turn off auto-renewal in your device&apos;s Account Settings
              (Settings &gt; [Your Name] &gt; Subscriptions) after purchase.
            </li>
            <li>
              <strong>Free trial</strong> — If offered, any unused portion of a
              free trial period will be forfeited when you purchase a
              subscription.
            </li>
          </ul>

          <H3>Pricing</H3>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
            <li>Monthly: $3.99 USD per month</li>
            <li>Annual: $19.99 USD per year (includes 7-day free trial)</li>
          </ul>
          <p className="text-gray-600">
            Prices may vary by region. Apple handles currency conversion and
            applicable taxes.
          </p>
        </Section>

        <Section title="4. Cancellation and Refunds">
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              You may cancel your subscription at any time through your Apple ID
              account settings.
            </li>
            <li>
              Cancellation takes effect at the end of the current billing period.
              You retain access to Pro features until then.
            </li>
            <li>
              Refunds are handled by Apple according to their refund policy. To
              request a refund, visit{" "}
              <a
                href="https://reportaproblem.apple.com"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                reportaproblem.apple.com
              </a>.
            </li>
            <li>
              No partial refunds are provided for unused portions of a
              subscription period.
            </li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p className="text-gray-600 mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-600">
            <li>Use the app for any unlawful purpose.</li>
            <li>Attempt to reverse-engineer, decompile, or disassemble the app.</li>
            <li>Abuse the AI features by submitting harmful, offensive, or illegal content.</li>
            <li>Circumvent usage limits through automated means or multiple accounts.</li>
            <li>Distribute, resell, or commercially exploit vocabulary generated by the app&apos;s AI features.</li>
          </ul>
        </Section>

        <Section title="6. AI-Generated Content">
          <p className="text-gray-600">
            Vocabulary, translations, and example sentences generated by AI may
            contain errors. We provide AI-generated content on an
            &quot;as-is&quot; basis and do not guarantee accuracy. You are
            encouraged to verify translations independently for critical use
            cases.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              The app, its design, code, and content are owned by Vocafast and
              protected by applicable intellectual property laws.
            </li>
            <li>
              Vocabulary and learning data you create belongs to you. You may
              export it at any time.
            </li>
            <li>
              You grant us a limited license to process your input data (text,
              images, voice) solely for the purpose of providing AI-powered
              features.
            </li>
          </ul>
        </Section>

        <Section title="8. Account Deletion">
          <p className="text-gray-600">
            You may delete your account at any time from Settings &gt; Account
            &gt; Delete Account. Account deletion is permanent and will remove
            all your data from our servers, including vocabulary, decks, training
            history, and progress. This action cannot be undone.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              The app is provided &quot;as is&quot; without warranties of any
              kind, express or implied.
            </li>
            <li>
              We are not liable for any loss of data, learning progress, or
              damages arising from the use of the app.
            </li>
            <li>
              Our total liability to you for any claims arising from your use of
              the app shall not exceed the amount you paid for the subscription
              in the 12 months preceding the claim.
            </li>
          </ul>
        </Section>

        <Section title="10. Modifications">
          <p className="text-gray-600">
            We reserve the right to modify these Terms at any time. We will
            notify you of significant changes through the app. Continued use of
            the app after modifications constitutes acceptance of the updated
            Terms.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p className="text-gray-600">
            These Terms are governed by and construed in accordance with the laws
            of France, without regard to conflict of law principles.
          </p>
        </Section>

        <Section title="12. Contact">
          <p className="text-gray-600">
            If you have questions about these Terms, contact us at:{" "}
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
