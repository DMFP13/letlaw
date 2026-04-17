export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, DEPOSIT_SCHEMES, formatDate } from "@/lib/utils";
import { createTenancy, updateTenancyDocuments, endTenancy } from "@/lib/actions";

async function getPropertyWithTenancy(id: string) {
  return prisma.property.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: {
      tenancies: {
        include: { tenants: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export default async function TenancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyWithTenancy(id);
  if (!property) notFound();

  const activeTenancy = property.tenancies.find((t) => t.status === "active");
  const createTenancyBound = createTenancy.bind(null, id);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/properties/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← {property.addressLine1}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Tenancy {activeTenancy ? "Details" : "Setup"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {activeTenancy
            ? "Update documents and compliance records for the active tenancy"
            : "Complete this wizard to set up a new tenancy"}
        </p>
      </div>

      {activeTenancy ? (
        /* Update existing tenancy documents */
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Tenancy Documents & Compliance
            </h2>
            <form
              action={updateTenancyDocuments.bind(null, activeTenancy.id, id)}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <DateField
                  name="depositProtectedAt"
                  label="Deposit protected date"
                  defaultValue={activeTenancy.depositProtectedAt}
                  hint="Within 30 days of payment"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit scheme
                  </label>
                  <select
                    name="depositScheme"
                    defaultValue={activeTenancy.depositScheme || ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not set</option>
                    {DEPOSIT_SCHEMES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit reference
                  </label>
                  <input
                    name="depositRef"
                    type="text"
                    defaultValue={activeTenancy.depositRef || ""}
                    placeholder="Scheme reference number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <DateField
                  name="prescribedInfoDate"
                  label="Prescribed information issued"
                  defaultValue={activeTenancy.prescribedInfoDate}
                />
                <DateField
                  name="rightToRentDate"
                  label="Right to rent checked"
                  defaultValue={activeTenancy.rightToRentDate}
                />
                <DateField
                  name="infoSheetDate"
                  label="RRA Information Sheet issued"
                  defaultValue={activeTenancy.infoSheetDate}
                  hint="Required from 1 May 2026"
                />
                <DateField
                  name="writtenTermsDate"
                  label="Written tenancy terms issued"
                  defaultValue={activeTenancy.writtenTermsDate}
                  hint="Required from 1 May 2026"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Save changes
              </button>
            </form>
          </div>

          {/* Tenant details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Tenants</h2>
            {activeTenancy.tenants.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {activeTenancy.tenants.map((t) => (
                  <li key={t.id} className="flex gap-4">
                    <span className="text-gray-900 font-medium">
                      {t.firstName} {t.lastName}
                    </span>
                    {t.email && <span className="text-gray-500">{t.email}</span>}
                    {t.phone && <span className="text-gray-500">{t.phone}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No tenants recorded.</p>
            )}
          </div>

          {/* End tenancy */}
          <div className="bg-white border border-red-100 rounded-xl p-5">
            <h2 className="font-semibold text-red-800 mb-2">End Tenancy</h2>
            <p className="text-sm text-gray-600 mb-3">
              Mark this tenancy as ended. This cannot be undone.
            </p>
            <form action={endTenancy.bind(null, activeTenancy.id, id)}>
              <button
                type="submit"
                className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50"
              >
                End tenancy
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* New tenancy wizard */
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-sm font-medium text-gray-700">
              Complete all sections to set up the tenancy
            </p>
          </div>

          <form action={createTenancyBound} className="space-y-6">
            {/* Tenant */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Tenant Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="tenant1FirstName"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="tenant1LastName"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="tenant1Email"
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    name="tenant1Phone"
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Rent & dates */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Rent & Dates
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent amount (£) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="rentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 1200"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent frequency
                  </label>
                  <select
                    name="rentFrequency"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent due (day of month)
                  </label>
                  <input
                    name="rentDueDay"
                    type="number"
                    min="1"
                    max="28"
                    defaultValue="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Deposit */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Deposit
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit amount (£)
                  </label>
                  <input
                    name="depositAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1800"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit scheme
                  </label>
                  <select
                    name="depositScheme"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select scheme</option>
                    {DEPOSIT_SCHEMES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheme reference
                  </label>
                  <input
                    name="depositRef"
                    placeholder="Registration/reference number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <DateField
                  name="depositProtectedAt"
                  label="Date deposit protected"
                  hint="Must be within 30 days of receipt"
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Required documents */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm uppercase tracking-wide">
                Required Documents Issued
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Record the date each item was issued. Leave blank if not yet issued.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <DateField
                  name="prescribedInfoDate"
                  label="Prescribed information"
                  hint="Required alongside deposit protection"
                />
                <DateField
                  name="rightToRentDate"
                  label="Right to rent check"
                  hint="Before or at start of tenancy"
                />
                <DateField
                  name="infoSheetDate"
                  label="RRA Information Sheet"
                  hint="Required from 1 May 2026"
                />
                <DateField
                  name="writtenTermsDate"
                  label="Written tenancy terms"
                  hint="Required from 1 May 2026"
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Any additional notes about this tenancy…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors"
              >
                Create Tenancy
              </button>
              <Link
                href={`/properties/${id}`}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DateField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: Date | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        name={name}
        type="date"
        defaultValue={
          defaultValue
            ? new Date(defaultValue).toISOString().split("T")[0]
            : ""
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
