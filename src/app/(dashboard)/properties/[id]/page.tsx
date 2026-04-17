import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  DEMO_USER_ID,
  formatDate,
  formatCurrency,
  getComplianceStatus,
  daysUntilExpiry,
  COMPLIANCE_TYPES,
  type ComplianceType,
} from "@/lib/utils";
import { upsertComplianceRecord, deleteProperty } from "@/lib/actions";

async function getProperty(id: string) {
  return prisma.property.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: {
      tenancies: {
        include: { tenants: true, rentReviews: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      },
      compliance: true,
      repairs: { where: { status: { in: ["open", "in_progress"] } }, orderBy: { reportedAt: "desc" } },
      _count: { select: { documents: true } },
    },
  });
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const activeTenancy = property.tenancies.find((t) => t.status === "active");
  const complianceMap = Object.fromEntries(
    property.compliance.map((c) => [c.type, c])
  );

  const upsert = upsertComplianceRecord.bind(null, id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/properties" className="text-sm text-blue-600 hover:underline">
              ← Properties
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {property.addressLine1}
            {property.addressLine2 && `, ${property.addressLine2}`}
          </h1>
          <p className="text-gray-500 text-sm">
            {property.city} · {property.postcode} ·{" "}
            <span className="capitalize">{property.propertyType}</span> ·{" "}
            {property.bedrooms} bed
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/properties/${id}/finances`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            💷 Finances
          </Link>
          <Link
            href={`/properties/${id}/repairs`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            🔧 Repairs ({property.repairs.length})
          </Link>
          <Link
            href={`/properties/${id}/documents`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            📁 Docs ({property._count.documents})
          </Link>
        </div>
      </div>

      {/* Tenancy summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Tenancy</h2>
          {!activeTenancy && (
            <Link
              href={`/properties/${id}/tenancy`}
              className="text-sm bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800"
            >
              + Set up tenancy
            </Link>
          )}
        </div>
        {activeTenancy ? (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <Row
                label="Tenants"
                value={
                  activeTenancy.tenants.length > 0
                    ? activeTenancy.tenants
                        .map((t) => `${t.firstName} ${t.lastName}`)
                        .join(", ")
                    : "Not set"
                }
              />
              <Row label="Start date" value={formatDate(activeTenancy.startDate)} />
              <Row
                label="Rent"
                value={`${formatCurrency(activeTenancy.rentAmount)} / ${activeTenancy.rentFrequency}`}
              />
              <Row
                label="Deposit"
                value={
                  activeTenancy.depositAmount
                    ? `${formatCurrency(activeTenancy.depositAmount)} (${activeTenancy.depositScheme || "scheme not set"})`
                    : "Not set"
                }
              />
            </div>
            <div className="space-y-2">
              <CheckRow
                label="Deposit protected"
                done={!!activeTenancy.depositProtectedAt}
                date={activeTenancy.depositProtectedAt}
              />
              <CheckRow
                label="Prescribed info issued"
                done={activeTenancy.prescribedInfoIssued}
                date={activeTenancy.prescribedInfoDate}
              />
              <CheckRow
                label="RRA Information Sheet"
                done={activeTenancy.infoSheetIssued}
                date={activeTenancy.infoSheetDate}
                note="Required from 1 May 2026"
              />
              <CheckRow
                label="Written tenancy terms"
                done={activeTenancy.writtenTermsIssued}
                date={activeTenancy.writtenTermsDate}
                note="Required from 1 May 2026"
              />
              <CheckRow
                label="Right to rent checked"
                done={activeTenancy.rightToRentChecked}
                date={activeTenancy.rightToRentDate}
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active tenancy. Property is vacant.</p>
        )}
        {activeTenancy && (
          <div className="mt-3 flex gap-3">
            <Link
              href={`/properties/${id}/tenancy`}
              className="text-xs text-blue-600 hover:underline"
            >
              Update tenancy documents →
            </Link>
          </div>
        )}
      </div>

      {/* Compliance dashboard */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Compliance Certificates
        </h2>
        <div className="space-y-3">
          {(Object.keys(COMPLIANCE_TYPES) as ComplianceType[]).map((type) => {
            const record = complianceMap[type];
            const status = record
              ? getComplianceStatus(record.expiryDate)
              : "missing";
            const days = record ? daysUntilExpiry(record.expiryDate) : null;
            const info = COMPLIANCE_TYPES[type];

            return (
              <ComplianceRow
                key={type}
                type={type}
                label={info.label}
                description={info.description}
                status={status}
                record={record}
                days={days}
                propertyId={id}
                action={upsert}
              />
            );
          })}
        </div>
      </div>

      {/* Tenancy checklist */}
      {activeTenancy && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Tenancy Compliance Checklist
          </h2>
          <div className="space-y-2">
            <TenancyCheck
              label="Deposit protected within 30 days"
              done={!!activeTenancy.depositProtectedAt}
              urgent={!activeTenancy.depositProtectedAt}
            />
            <TenancyCheck
              label="Prescribed information issued to tenant"
              done={activeTenancy.prescribedInfoIssued}
              urgent={!activeTenancy.prescribedInfoIssued}
            />
            <TenancyCheck
              label="Right to rent check completed"
              done={activeTenancy.rightToRentChecked}
              urgent={!activeTenancy.rightToRentChecked}
            />
            <TenancyCheck
              label="RRA Information Sheet issued (required from 1 May 2026)"
              done={activeTenancy.infoSheetIssued}
              urgent={false}
            />
            <TenancyCheck
              label="Written tenancy terms issued (required from 1 May 2026)"
              done={activeTenancy.writtenTermsIssued}
              urgent={false}
            />
          </div>
          <div className="mt-3">
            <Link
              href={`/properties/${id}/tenancy`}
              className="text-xs text-blue-600 hover:underline"
            >
              Update checklist →
            </Link>
          </div>
        </div>
      )}

      {/* Open repairs */}
      {property.repairs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Open Repairs ({property.repairs.length})
            </h2>
            <Link
              href={`/properties/${id}/repairs`}
              className="text-xs text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="space-y-2">
            {property.repairs.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    r.severity === "emergency"
                      ? "bg-red-500"
                      : r.severity === "high"
                      ? "bg-orange-500"
                      : "bg-yellow-400"
                  }`}
                />
                <span className="flex-1 text-gray-700">{r.title}</span>
                <span className="text-xs text-gray-400 capitalize">{r.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete */}
      <div className="flex justify-end">
        <form
          action={async () => {
            "use server";
            await deleteProperty(id);
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            Delete property
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

function CheckRow({
  label,
  done,
  date,
  note,
}: {
  label: string;
  done: boolean;
  date?: Date | null;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 text-sm ${done ? "text-green-600" : "text-red-500"}`}>
        {done ? "✓" : "✗"}
      </span>
      <div>
        <span className={`text-sm ${done ? "text-gray-700" : "text-red-700 font-medium"}`}>
          {label}
        </span>
        {done && date && (
          <span className="text-xs text-gray-400 ml-2">{formatDate(date)}</span>
        )}
        {note && <p className="text-xs text-gray-400">{note}</p>}
      </div>
    </div>
  );
}

function TenancyCheck({
  label,
  done,
  urgent,
}: {
  label: string;
  done: boolean;
  urgent: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
          done ? "bg-green-100 text-green-700" : urgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? "✓" : "○"}
      </span>
      <span
        className={`text-sm ${
          done ? "text-gray-700" : urgent ? "text-red-700 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ComplianceRow({
  type,
  label,
  description,
  status,
  record,
  days,
  propertyId,
  action,
}: {
  type: string;
  label: string;
  description: string;
  status: string;
  record: any;
  days: number | null;
  propertyId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
    valid: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
      dot: "bg-green-500",
      badge: "Valid",
    },
    expiring_soon: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
      badge: "Expiring soon",
    },
    expired: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
      badge: "Expired",
    },
    missing: {
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-500",
      dot: "bg-gray-300",
      badge: "Not recorded",
    },
  };

  const cfg = statusConfig[status] || statusConfig.missing;

  return (
    <details className={`border rounded-lg ${cfg.bg} group`}>
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1">
          <span className="font-medium text-gray-900 text-sm">{label}</span>
          <span className="text-xs text-gray-500 ml-2">{description}</span>
        </div>
        <div className="flex items-center gap-3">
          {record?.expiryDate && (
            <span className="text-xs text-gray-500">
              Expires {formatDate(record.expiryDate)}
              {days !== null && days >= 0 && (
                <span className={`ml-1 ${cfg.text}`}>({days}d)</span>
              )}
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.text} bg-white border`}>
            {cfg.badge}
          </span>
          <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
        </div>
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <form action={action} className="grid grid-cols-2 gap-3">
          <input type="hidden" name="type" value={type} />
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Issue date</label>
            <input
              type="date"
              name="issueDate"
              defaultValue={record?.issueDate ? new Date(record.issueDate).toISOString().split("T")[0] : ""}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Expiry date</label>
            <input
              type="date"
              name="expiryDate"
              defaultValue={record?.expiryDate ? new Date(record.expiryDate).toISOString().split("T")[0] : ""}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Certificate number</label>
            <input
              type="text"
              name="certificateNo"
              defaultValue={record?.certificateNo || ""}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Notes</label>
            <input
              type="text"
              name="notes"
              defaultValue={record?.notes || ""}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800"
            >
              Save certificate
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
