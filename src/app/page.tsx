import Link from "next/link";

const features = [
  {
    icon: "🏠",
    title: "Compliance Dashboard",
    desc: "EPC, gas safety, EICR, deposit protection — all tracked in one screen per property.",
  },
  {
    icon: "📋",
    title: "Tenancy Setup Wizard",
    desc: "Guided onboarding with RRA Information Sheet, right-to-rent, and written terms checklists.",
  },
  {
    icon: "🔧",
    title: "Repairs & Hazard Tracker",
    desc: "Log damp, leaks, heating failures, and electrical faults with SLAs and audit trail.",
  },
  {
    icon: "📁",
    title: "Document Vault",
    desc: "Every tenancy agreement, certificate, and inspection note — searchable and date-stamped.",
  },
  {
    icon: "💷",
    title: "Rent Review Workflow",
    desc: "Section 13 / Form 4A notices, 2-month countdown timers, and tribunal risk flags.",
  },
  {
    icon: "🔮",
    title: "Future-Ready",
    desc: "Placeholders for PRS database, Landlord Ombudsman, Decent Homes, and Awaab's Law.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">LetLaw</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            England
          </span>
        </div>
        <Link
          href="/dashboard"
          className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Open Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-blue-600 text-blue-100 text-sm px-3 py-1 rounded-full mb-6 font-medium">
            Built for the Renters' Rights Act — effective 1 May 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Compliance-first property management for English landlords
          </h1>
          <p className="text-xl text-blue-200 mb-8 leading-relaxed">
            Stay compliant with current English landlord law. Track certificates,
            manage tenancies, log repairs, keep a defensible audit trail — and
            automate your quarterly Making Tax Digital (MTD) submissions directly
            to HMRC.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors"
          >
            Open Live Demo →
          </Link>
          <p className="mt-4 text-blue-300 text-sm">
            No login required · 3 sample properties preloaded · Full functionality
          </p>
        </div>
      </section>

      {/* Compliance callout */}
      <section className="bg-amber-50 border-y border-amber-200 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <h2 className="font-semibold text-amber-900 mb-2">
              ⚠️ What changes on 1 May 2026
            </h2>
            <ul className="text-amber-800 text-sm space-y-1">
              <li>• New tenants must receive the official RRA Information Sheet</li>
              <li>• Written information about key tenancy terms becomes mandatory</li>
              <li>• New assured tenancy forms replace existing Section 21 notices</li>
              <li>• Rent increases must follow the new single-route Section 13 process</li>
            </ul>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-amber-900 mb-2">
              📅 Coming in later phases
            </h2>
            <ul className="text-amber-800 text-sm space-y-1">
              <li>• PRS database registration (planned late 2026)</li>
              <li>• Landlord Ombudsman membership</li>
              <li>• Awaab's Law extended to private rented sector</li>
              <li>• Decent Homes Standard in the PRS</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything landlords need, nothing they don't
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-white px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get compliant?
          </h2>
          <p className="text-blue-200 mb-8">
            LetLaw is not legal advice — but it keeps your properties documented,
            your deadlines visible, and your audit trail defensible.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors"
          >
            Open Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm px-6 py-8 text-center">
        <p>
          <strong className="text-white">LetLaw</strong> — for landlords and letting agents in{" "}
          <strong>England</strong> only. Not legal advice.
        </p>
        <p className="mt-2">
          Built to support the Renters' Rights Act 2025 and related housing legislation.
        </p>
      </footer>
    </div>
  );
}
