import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, getComplianceStatus, formatDate } from "@/lib/utils";

async function getDashboardData() {
  const [properties, repairs, expiringCompliance] = await Promise.all([
    prisma.property.findMany({
      where: { userId: DEMO_USER_ID },
      include: {
        tenancies: { where: { status: "active" }, include: { tenants: true } },
        compliance: true,
        repairs: { where: { status: { in: ["open", "in_progress"] } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repair.findMany({
      where: {
        property: { userId: DEMO_USER_ID },
        status: { in: ["open", "in_progress"] },
        severity: { in: ["emergency", "high"] },
      },
      include: { property: true },
      orderBy: { reportedAt: "asc" },
      take: 5,
    }),
    prisma.complianceRecord.findMany({
      where: {
        property: { userId: DEMO_USER_ID },
        status: { in: ["expired", "expiring_soon"] },
      },
      include: { property: true },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
  ]);

  let totalCompliant = 0;
  let totalItems = 0;

  for (const p of properties) {
    for (const c of p.compliance) {
      totalItems++;
      if (c.status === "valid") totalCompliant++;
    }
  }

  return { properties, repairs, expiringCompliance, totalCompliant, totalItems };
}

export default async function DashboardPage() {
  const { properties, repairs, expiringCompliance, totalCompliant, totalItems } =
    await getDashboardData();

  const complianceScore =
    totalItems > 0 ? Math.round((totalCompliant / totalItems) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compliance overview for your portfolio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Properties" value={properties.length} color="blue" />
        <StatCard
          label="Active Tenancies"
          value={properties.reduce((n, p) => n + p.tenancies.length, 0)}
          color="green"
        />
        <StatCard
          label="Open Repairs"
          value={properties.reduce((n, p) => n + p.repairs.length, 0)}
          color="orange"
        />
        <StatCard
          label="Compliance Score"
          value={`${complianceScore}%`}
          color={complianceScore >= 80 ? "green" : complianceScore >= 50 ? "orange" : "red"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Urgent alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            ⚠️ Urgent Alerts
          </h2>
          {expiringCompliance.length === 0 && repairs.length === 0 ? (
            <p className="text-green-600 text-sm">✓ No urgent issues</p>
          ) : (
            <ul className="space-y-3">
              {expiringCompliance.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      c.status === "expired" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.type.replace(/_/g, " ").toUpperCase()} —{" "}
                      {c.status === "expired" ? "EXPIRED" : "expiring soon"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.property.addressLine1}, {c.property.postcode}
                    </p>
                    {c.expiryDate && (
                      <p className="text-xs text-gray-400">
                        Expiry: {formatDate(c.expiryDate)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/properties/${c.propertyId}`}
                    className="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    Fix →
                  </Link>
                </li>
              ))}
              {repairs.map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      r.severity === "emergency" ? "bg-red-500" : "bg-orange-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.property.addressLine1} — {r.severity}
                    </p>
                  </div>
                  <Link
                    href={`/properties/${r.propertyId}/repairs`}
                    className="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Properties summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your Properties</h2>
            <Link
              href="/properties/new"
              className="text-xs text-blue-600 hover:underline"
            >
              + Add property
            </Link>
          </div>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No properties yet</p>
              <Link
                href="/properties/new"
                className="inline-block bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800"
              >
                Add your first property
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {properties.slice(0, 6).map((p) => {
                const expired = p.compliance.filter(
                  (c) => c.status === "expired"
                ).length;
                const expiring = p.compliance.filter(
                  (c) => c.status === "expiring_soon"
                ).length;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/properties/${p.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.addressLine1}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.city} · {p.tenancies.length > 0 ? `${p.tenancies.length} active tenancy` : "Vacant"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {expired > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                            {expired} expired
                          </span>
                        )}
                        {expiring > 0 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                            {expiring} due
                          </span>
                        )}
                        {expired === 0 && expiring === 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            ✓ OK
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* RRA Info banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">
          📋 Renters' Rights Act — Key Obligations (England)
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium">From 1 May 2026</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Issue RRA Information Sheet to new tenants</li>
              <li>• Provide written tenancy terms in writing</li>
              <li>• Use new assured tenancy forms</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Always required</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Valid EPC (min. rating E)</li>
              <li>• Annual gas safety check</li>
              <li>• EICR every 5 years</li>
              <li>• Deposit protected within 30 days</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Coming later</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• PRS database registration (late 2026)</li>
              <li>• Landlord Ombudsman membership</li>
              <li>• Awaab's Law (PRS — TBC)</li>
              <li>• Decent Homes Standard (PRS)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div
      className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}
