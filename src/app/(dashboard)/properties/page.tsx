import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, formatCurrency, formatDate } from "@/lib/utils";

async function getProperties() {
  return prisma.property.findMany({
    where: { userId: DEMO_USER_ID },
    include: {
      tenancies: {
        where: { status: "active" },
        include: { tenants: true },
      },
      compliance: true,
      repairs: { where: { status: { in: ["open", "in_progress"] } } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {properties.length} {properties.length === 1 ? "property" : "properties"} in your portfolio
          </p>
        </div>
        <Link
          href="/properties/new"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No properties yet
          </h2>
          <p className="text-gray-500 mb-6">
            Add your first rental property to start tracking compliance.
          </p>
          <Link
            href="/properties/new"
            className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map((p) => {
            const expired = p.compliance.filter((c) => c.status === "expired").length;
            const expiring = p.compliance.filter((c) => c.status === "expiring_soon").length;
            const missing = p.compliance.filter((c) => c.status === "unknown").length;
            const activeTenancy = p.tenancies[0];

            return (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {p.addressLine1}
                    </h2>
                    {p.addressLine2 && (
                      <p className="text-sm text-gray-500">{p.addressLine2}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {p.city} · {p.postcode}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                    {p.propertyType}
                  </span>
                </div>

                {/* Tenancy */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  {activeTenancy ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {activeTenancy.tenants
                          .map((t) => `${t.firstName} ${t.lastName}`)
                          .join(", ") || "Tenant"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(activeTenancy.rentAmount)}/
                        {activeTenancy.rentFrequency === "monthly" ? "mo" : "wk"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">⚬ Vacant</p>
                  )}
                </div>

                {/* Compliance badges */}
                <div className="flex gap-2 flex-wrap">
                  {expired > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {expired} expired
                    </span>
                  )}
                  {expiring > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {expiring} expiring
                    </span>
                  )}
                  {missing > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {missing} missing
                    </span>
                  )}
                  {p.repairs.length > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {p.repairs.length} open {p.repairs.length === 1 ? "repair" : "repairs"}
                    </span>
                  )}
                  {expired === 0 && expiring === 0 && missing === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      ✓ Fully compliant
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
