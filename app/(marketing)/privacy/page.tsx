import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/hero-section'

const BASE_URL = 'https://cleanestpaintingnj.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Privacy Policy | Cleanest Painting LLC',
  description:
    'Privacy policy for Cleanest Painting LLC. Learn how we collect, use, and protect your personal information.',
  alternates: { canonical: `${BASE_URL}/privacy` },
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <HeroSection
        title="Privacy Policy"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-a:text-[#1B2B5B] prose-a:underline-offset-2 hover:prose-a:text-[#1e3a5f] prose-strong:text-foreground prose-li:marker:text-amber-500 max-w-none">
          <p className="text-muted-foreground text-sm">Effective Date: March 29, 2026</p>

          <h2>Introduction</h2>
          <p>
            Cleanest Painting LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            operates the website <a href={BASE_URL}>cleanestpaintingnj.com</a> and related SMS
            messaging services. This Privacy Policy describes what personal information we collect,
            how we use it, and your rights regarding that information.
          </p>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Information We Collect</h2>
            <p>We may collect the following personal information when you interact with us:</p>
            <ul>
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Property address and project details</li>
            </ul>
            <p>
              This information is collected when you submit an estimate request through our website,
              contact us by phone, or provide details during an in-person consultation.
            </p>
            <p>
              We also automatically collect standard website analytics data, including IP addresses,
              browser type, pages visited, and referring URLs, to help us improve our website.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide painting estimates and services</li>
              <li>Schedule and confirm appointments</li>
              <li>Send appointment reminders via SMS</li>
              <li>Send post-service review and feedback requests via SMS</li>
              <li>Follow up on estimates</li>
              <li>Respond to your inquiries</li>
              <li>Improve our services and website</li>
            </ul>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">SMS/Text Messaging</h2>
            <p>
              If you provide your phone number and consent to receive text messages, we may send you
              appointment reminders, estimate follow-ups, and review requests related to our
              painting services.
            </p>
            <ul>
              <li>
                <strong>Message Frequency:</strong> Approximately 2&ndash;4 messages per month.
                Frequency may vary based on your interactions with our services.
              </li>
              <li>
                <strong>Message and Data Rates:</strong> Standard message and data rates may apply.
                Check with your mobile carrier for details about your plan.
              </li>
              <li>
                <strong>Opt-Out:</strong> You can opt out of receiving text messages at any time by
                replying <strong>STOP</strong> to any message you receive from us.
              </li>
              <li>
                <strong>Help:</strong> For assistance with our SMS program, reply{' '}
                <strong>HELP</strong> to any message, or contact us using the information below.
              </li>
            </ul>
            <p>
              Your consent to receive SMS messages is not a condition of purchasing any services
              from Cleanest Painting LLC.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Information Sharing</h2>
            <p>
              We do not sell, rent, or share your personal information with third parties for their
              marketing purposes. We may share your information only with:
            </p>
            <ul>
              <li>
                Service providers who help us operate our business (e.g., our SMS platform
                provider), solely to perform services on our behalf
              </li>
              <li>Law enforcement or government agencies, as required by law or legal process</li>
            </ul>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to fulfill the purposes
              described in this policy, or as required by law. You may request deletion of your
              personal data at any time by contacting us.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Data Security</h2>
            <p>
              We implement reasonable administrative, technical, and physical safeguards to protect
              your personal information. However, no method of transmission over the Internet or
              electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction or deletion of your personal data</li>
              <li>
                Opt out of SMS messages at any time by texting <strong>STOP</strong>
              </li>
              <li>Contact us with any questions or concerns about your data</li>
            </ul>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on
              this page with an updated effective date. We encourage you to review this policy
              periodically.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your personal data, please contact
              us:
            </p>
            <ul>
              <li>
                <strong>Phone:</strong> <a href="tel:+17329138574">(732) 913-8574</a>
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:home@cleanestpaintingnj.com">home@cleanestpaintingnj.com</a>
              </li>
              <li>
                <strong>Address:</strong> Cleanest Painting LLC, Rahway, NJ
              </li>
            </ul>
            <p>
              For SMS-related inquiries, you may also reply <strong>HELP</strong> to any text
              message you receive from us.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
