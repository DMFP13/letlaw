export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  DEMO_USER_ID,
  REPAIR_CATEGORIES,
  REPAIR_SEVERITIES,
  formatDate,
  formatCurrency,
} from "@/lib/utils";
import { createRepair, updateRepairStatus } from "@/lib/actions";

async function getRepairs(propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: DEMO_USER_ID },
  });
  if (!property) return null;

  const repairs = await prisma.repair.findMany({
    where: { propertyId },
    include: { evidence: true },
    orderBy: { reportedAt: "desc" },
  });

  return { property, repairs };
}

export default async function RepairsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRepairs(id);
  if (!data) notFound();

  const { property, repairs } = data;

  const open = repairs.filter((r) => r.status === "open");
  const inProgress = repairs.filter((r) => r.status === "in_progress");
  const resolved = repairs.filter((r) => r.status === "resolved");

  const createRepairBound = createRepair.bind(null, id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/properties/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← {property.addressLine1}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Repairs & Hazards
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {open.length} open · {inProgress.length} in progress · {resolved.length} resolved
        </p>
      </div>

      {/* RRA hazard notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>Repair obligations:</strong> Awaab's Law is currently in force for the
        social rented sector (from 27 Oct 2025) and is expected to extend to the private
        sector. Maintain a complete audit trail of all repair reports and responses.
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* New repair form */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">Log Repair</h2>
            <form action={createRepairBound} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Damp patch in bathroom"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(REPAIR_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  name="severity"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(REPAIR_SEVERITIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} (SLA: {v.slaHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Describe the issue…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target resolution date
                </label>
                <input
                  name="targetDate"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contractor name
                </label>
                <input
                  name="contractorName"
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contractor contact
                </label>
                <input
                  name="contractorContact"
                  placeholder="Phone / email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cost (£)
                </label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Log Repair
              </button>
            </form>
          </div>
        </div>

        {/* Repair list */}
        <div className="md:col-span-2 space-y-4">
          {repairs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">🔧</p>
              <p>No repairs logged yet</p>
            </div>
          ) : (
            <>
              {[
                { label: "Open", items: open, color: "red" },
                { label: "In Progress", items: inProgress, color: "orange" },
                { label: "Resolved", items: resolved, color: "green" },
              ].map(
                ({ label, items, color }) =>
                  items.length > 0 && (
                    <div key={label}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {label} ({items.length})
                      </h3>
                      <div className="space-y-3">
                        {items.map((r) => (
                          <RepairCard
                            key={r.id}
                            repair={r}
                            propertyId={id}
                            color={color}
                          />
                        ))}
                      </div>
                    </div>
                  )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RepairCard({
  repair,
  propertyId,
  color,
}: {
  repair: any;
  propertyId: string;
  color: string;
}) {
  const severityColors: Record<string, string> = {
    emergency: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
  };

  const category =
    REPAIR_CATEGORIES[repair.category as keyof typeof REPAIR_CATEGORIES] ||
    repair.category;
  const severity = REPAIR_SEVERITIES[repair.severity as keyof typeof REPAIR_SEVERITIES];

  const markInProgress = updateRepairStatus.bind(null, repair.id, propertyId, "in_progress");
  const markResolved = updateRepairStatus.bind(null, repair.id, propertyId, "resolved");
  const markOpen = updateRepairStatus.bind(null, repair.id, propertyId, "open");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 text-sm">{repair.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                severityColors[repair.severity] || ""
              }`}
            >
              {severity?.label || repair.severity}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {category}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{repair.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        <span>Reported {formatDate(repair.reportedAt)}</span>
        {repair.targetDate && (
          <span>Target {formatDate(repair.targetDate)}</span>
        )}
        {repair.contractorName && (
          <span>Contractor: {repair.contractorName}</span>
        )}
        {repair.cost != null && (
          <span>Cost: {formatCurrency(repair.cost)}</span>
        )}
        {repair.resolvedAt && (
          <span>Resolved {formatDate(repair.resolvedAt)}</span>
        )}
      </div>

      <div className="flex gap-2">
        {repair.status !== "in_progress" && repair.status !== "resolved" && (
          <form action={markInProgress}>
            <button
              type="submit"
              className="text-xs border border-orange-300 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-50"
            >
              Mark In Progress
            </button>
          </form>
        )}
        {repair.status !== "resolved" && (
          <form action={markResolved}>
            <button
              type="submit"
              className="text-xs border border-green-300 text-green-700 px-3 py-1 rounded-lg hover:bg-green-50"
            >
              Mark Resolved
            </button>
          </form>
        )}
        {repair.status === "resolved" && (
          <form action={markOpen}>
            <button
              type="submit"
              className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50"
            >
              Re-open
            </button>
          </form>
        )}
        <Link
          href={`/properties/${propertyId}/documents`}
          className="text-xs text-blue-600 hover:underline ml-auto"
        >
          + Add evidence
        </Link>
      </div>
    </div>
  );
}
