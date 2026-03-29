import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/hero-section'

const BASE_URL = 'https://cleanestpaintingnj.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Terms of Service | Cleanest Painting LLC',
  description:
    'Terms of service for Cleanest Painting LLC, including our SMS messaging program terms.',
  alternates: { canonical: `${BASE_URL}/terms` },
  robots: { index: false, follow: false },
}

export default function TermsOfServicePage() {
  return (
    <>
      <HeroSection
        title="Terms of Service"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-a:text-[#1B2B5B] prose-a:underline-offset-2 hover:prose-a:text-[#1e3a5f] prose-strong:text-foreground prose-li:marker:text-amber-500 max-w-none">
          <p className="text-muted-foreground text-sm">Effective Date: March 29, 2026</p>

          <h2>Introduction</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Cleanest Painting
            LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) website at{' '}
            <a href={BASE_URL}>cleanestpaintingnj.com</a> and our SMS messaging program. By using
            our website or opting into our messaging program, you agree to these Terms.
          </p>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">SMS Messaging Program</h2>
            <p>
              <strong>Program Name:</strong> Cleanest Painting SMS Notifications
            </p>
            <p>
              <strong>Program Description:</strong> Cleanest Painting LLC offers an SMS messaging
              program to provide customers with appointment reminders, estimate follow-ups, service
              updates, and post-service review requests related to our painting services.
            </p>
            <p>
              <strong>Message Frequency:</strong> You may receive approximately 2&ndash;4 text
              messages per month. Message frequency may vary based on your interactions with our
              services.
            </p>
            <p>
              <strong>Message and Data Rates:</strong> Standard message and data rates may apply.
              Please check with your mobile carrier for details about your messaging plan.
            </p>
            <p>
              <strong>Opt-Out:</strong> You may opt out of receiving text messages at any time by
              replying <strong>STOP</strong> to any message you receive from us. After opting out,
              you will receive a one-time confirmation message and will no longer receive SMS
              messages from Cleanest Painting LLC unless you opt in again.
            </p>
            <p>
              <strong>Help:</strong> For assistance with our SMS program, reply{' '}
              <strong>HELP</strong> to any message you receive from us. You may also contact us by
              email at <a href="mailto:home@cleanestpaintingnj.com">home@cleanestpaintingnj.com</a>{' '}
              or by phone at <a href="tel:+17329138574">(732) 913-8574</a>.
            </p>
            <p>
              <strong>Consent:</strong> By providing your phone number and opting in to our SMS
              messaging program, you consent to receive recurring automated text messages from
              Cleanest Painting LLC at the phone number you provided. Your consent to receive SMS
              messages is not a condition of purchasing any goods or services.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Website Use</h2>
            <p>
              Our website is provided for informational purposes and to facilitate service requests.
              You agree to use the website only for lawful purposes and in a manner that does not
              infringe upon the rights of others or restrict their use of the website.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Estimates and Services</h2>
            <p>
              Estimates provided through our website or during in-person consultations are
              non-binding until a formal written agreement is signed by both parties. Pricing,
              availability, and project timelines are subject to change based on the scope and
              conditions of each project.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Intellectual Property</h2>
            <p>
              All content on our website, including text, images, logos, graphics, and design, is
              the property of Cleanest Painting LLC and is protected by applicable intellectual
              property laws. You may not reproduce, distribute, or use any content from our website
              without our prior written permission.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Limitation of Liability</h2>
            <p>
              Cleanest Painting LLC provides this website and SMS messaging program &ldquo;as
              is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either
              express or implied. To the fullest extent permitted by law, we shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use of
              the website or SMS program.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of
              New Jersey, without regard to its conflict of law principles. Any disputes arising
              under these Terms shall be resolved in the courts located in Union County, New Jersey.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Changes to These Terms</h2>
            <p>
              We may update these Terms of Service at any time. Changes will take effect when posted
              on this page with an updated effective date. Your continued use of our website or SMS
              program after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-10 dark:border-gray-800">
            <h2 className="!mt-0">Contact Information</h2>
            <p>If you have questions about these Terms, please contact us:</p>
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
              For SMS program support, reply <strong>HELP</strong> to any text message you receive
              from us or contact us using the information above.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
