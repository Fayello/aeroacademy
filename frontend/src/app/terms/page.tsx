import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#0F203A] text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-[#7AD62A] text-sm">Last updated: August 25, 2026</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Acceptance of Terms</h2>
          <p>
            By accessing or using the XpertClass platform, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, you must not use the platform. We reserve the right to
            update these terms at any time; continued use of the platform after changes constitutes
            acceptance of the revised terms.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Account Registration</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Age requirement:</strong> you must be at least 16 years old to create an account.</li>
            <li><strong>Accurate information:</strong> you must provide truthful and complete information during registration and keep your account details up to date.</li>
            <li><strong>One account per person:</strong> each individual may maintain only one account. Duplicate accounts may be terminated without notice.</li>
            <li><strong>Account security:</strong> you are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Platform Usage</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Learning purpose:</strong> the platform is designed for educational use in cybersecurity, cloud, and related technical disciplines.</li>
            <li><strong>Fair use:</strong> you agree to use the platform in good faith and in a manner consistent with its intended purpose.</li>
            <li><strong>No cheating or exploiting:</strong> sharing exam answers, circumventing lab restrictions, exploiting vulnerabilities outside designated lab environments, or using automated tools to manipulate assessments is strictly prohibited.</li>
            <li><strong>No unauthorized access:</strong> you must not attempt to access other users&apos; accounts, platform infrastructure, or data beyond what your role permits.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Content and Intellectual Property</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Platform content:</strong> all course materials, lab designs, assessments, certifications, and branding on XpertClass are the intellectual property of XpertClass and are protected by applicable copyright and trademark laws.</li>
            <li><strong>User content license:</strong> by submitting content to the platform (e.g., lab solutions, forum posts), you grant XpertClass a non-exclusive, worldwide license to use, modify, and distribute that content for platform operations and improvement.</li>
            <li><strong>Restrictions:</strong> you may not reproduce, distribute, or create derivative works from platform content without prior written permission from XpertClass.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Lab Environment</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Authorized use only:</strong> lab environments are isolated sandboxes intended exclusively for hands-on learning exercises provided by XpertClass.</li>
            <li><strong>No real-world attacks:</strong> you must not use lab tools, techniques, or credentials to attack, scan, or exploit any system outside the designated lab environment, including production systems, third-party services, or other users&apos; infrastructure.</li>
            <li><strong>Lab isolation:</strong> all lab activities are monitored and logged. Unauthorized lateral movement outside lab boundaries may result in immediate account termination and potential legal action.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Certifications</h2>
          <p>
            XpertClass certifications are industry-recognized credentials that validate skills acquired through
            our training programs. While they demonstrate proficiency in specific domains, they are not
            equivalent to certifications issued by SANS/GIAC, (ISC)², CompTIA, or other established
            certification bodies. Certification requirements and validity periods are subject to change.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Payment Terms</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Pricing:</strong> course fees are displayed at the time of purchase and are subject to change without prior notice.</li>
            <li><strong>Refunds:</strong> refund requests must be submitted within 14 days of purchase and prior to completing more than 20% of the course content.</li>
            <li><strong>Subscription plans:</strong> if applicable, subscription fees are billed on a recurring basis and may be canceled at any time before the next billing cycle.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Termination</h2>
          <p>
            XpertClass reserves the right to suspend or terminate your account at any time, with or without
            cause, including but not limited to violations of these Terms of Service. Upon termination,
            your access to the platform and its content will be revoked. Provisions regarding intellectual
            property, limitation of liability, and dispute resolution will survive termination.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, XpertClass shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the platform, including
            loss of data, revenue, or business opportunities. The platform is provided &quot;as is&quot; without
            warranties of any kind, either express or implied.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Changes to Terms</h2>
          <p>
            We may revise these Terms of Service from time to time. Material changes will be communicated
            via email or platform notification at least 30 days before they take effect. The &quot;Last updated&quot;
            date at the top reflects the most recent revision.
          </p>
        </div>

        <div className="bg-[#E9F8EE] border-l-4 border-[#229C62] p-6 rounded-r-lg">
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Contact Us</h2>
          <p>
            For questions about these Terms of Service, contact us at{" "}
            <a href="mailto:legal@xpertclass.academy" className="text-[#229C62] underline font-medium">
              legal@xpertclass.academy
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center">
        <Link href="/" className="text-[#229C62] hover:text-[#0F203A] font-medium transition-colors">
          Back to Home
        </Link>
      </footer>
    </main>
  );
}
