import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      <section className="bg-[#0F203A] text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-[#7AD62A] text-sm">Last updated: August 25, 2026</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Information We Collect</h2>
          <p className="mb-2">We collect information to provide and improve our educational services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account information:</strong> name, email address, institutional affiliation, and credentials you provide during registration.</li>
            <li><strong>Usage data:</strong> pages visited, features used, session duration, browser type, and device identifiers.</li>
            <li><strong>Lab activity:</strong> lab completion records, scores, code submissions, and progress tracking data within learning environments.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Platform operation:</strong> to deliver courses, manage accounts, and process authentication.</li>
            <li><strong>Personalization:</strong> to tailor learning paths, recommend content, and adapt difficulty levels.</li>
            <li><strong>Analytics:</strong> to understand usage patterns, improve course design, and enhance platform performance.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Information Sharing</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>We <strong>never sell</strong> your personal data to third parties.</li>
            <li><strong>Service providers:</strong> we share data with trusted vendors (hosting, email delivery, analytics) under strict confidentiality agreements.</li>
            <li><strong>Legal requirements:</strong> we may disclose information when required by law, court order, or to protect the rights and safety of our users and platform.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Data Security</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Encryption:</strong> all data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
            <li><strong>Access controls:</strong> role-based access, multi-factor authentication for administrative functions, and regular security audits.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Data Retention</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> retained for the lifetime of your account and up to 30 days after deletion.</li>
            <li><strong>Lab data:</strong> retained for 12 months after course completion for reference and certification purposes.</li>
            <li><strong>Analytics:</strong> anonymized usage data may be retained indefinitely for aggregate insights.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> request a copy of all personal data we hold about you.</li>
            <li><strong>Correction:</strong> request corrections to inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> request deletion of your personal data, subject to legal retention obligations.</li>
            <li><strong>Portability:</strong> receive your data in a structured, machine-readable format.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Cookies and Tracking</h2>
          <p>
            We use essential cookies for authentication and session management. Analytics cookies help us understand
            how you use the platform. You can manage cookie preferences through your browser settings. We do not
            use third-party advertising trackers.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be communicated via email or
            platform notification at least 30 days before they take effect. The &quot;Last updated&quot; date at the top
            reflects the most recent revision.
          </p>
        </div>

        <div className="bg-[#7AD62A]/10 border-l-4 border-[#7AD62A] p-6 rounded-r-lg">
          <h2 className="text-2xl font-semibold text-[#0F203A] mb-3">Contact Us</h2>
          <p>
            For questions about this policy or to exercise your data rights, contact our privacy team at{" "}
            <a href="mailto:privacy@xpertclass.academy" className="text-[#7AD62A] underline font-medium">
              privacy@xpertclass.academy
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center">
        <Link href="/" className="text-[#7AD62A] hover:text-[#0F203A] font-medium transition-colors">
          Back to Home
        </Link>
      </footer>
    </main>
  );
}
