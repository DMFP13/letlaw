export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, formatDate } from "@/lib/utils";
import { DOC_META, type DocType } from "@/lib/document-types";

async function getData(propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: DEMO_USER_ID },
    include: {
      tenancies: {
        where: { status: "active" },
        include: { tenants: true },
        take: 1,
      },
    },
  });
  if (!property) return null;
  return { property, tenancy: property.tenancies[0] ?? null };
}

const DOC_ORDER: DocType[] = ["rra-info-sheet", "tenancy-terms", "right-to-rent", "section-13"];

export default async function TenancyDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { property, tenancy } = data;

  // Map doc type to tenancy field that records when it was issued
  const issuedDates: Partial<Record<DocType, Date | null>> = tenancy
    ? {
        "rra-info-sheet": tenancy.infoSheetDate ?? null,
        "tenancy-terms": tenancy.writtenTermsDate ?? null,
        "right-to-rent": tenancy.rightToRentDate ?? null,
      }
    : {};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/properties/${id}/tenancy`} className="text-sm text-blue-600 hover:underline">
          ← Tenancy
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">RRA Document Generator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate, customise, and print the four documents required by the Renters' Rights Act 2025.
        </p>
      </div>

      {/* RRA deadline banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Renters' Rights Act — mandatory from 1 May 2026</p>
          <p className="text-amber-800 mt-0.5">
            From that date, all new tenancies in England require an RRA Information Sheet and written tenancy
            terms. Failure to provide them affects your ability to recover possession and may expose you to
            civil penalties. Section 13 becomes the only permitted rent-increase route.
          </p>
        </div>
      </div>

      {!tenancy && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
          <p className="text-gray-500 text-sm">No active tenancy — documents are generated from tenancy data.</p>
          <Link href={`/properties/${id}/tenancy`} className="text-blue-600 text-sm hover:underline mt-1 inline-block">
            Set up a tenancy first →
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {DOC_ORDER.map((type) => {
          const meta = DOC_META[type];
          const issued = issuedDates[type];
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="font-semibold text-gray-900">{meta.title}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{meta.subtitle}</p>
                    </div>
                    {issued ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                        ✓ Issued {formatDate(issued)}
                      </span>
                    ) : type !== "section-13" ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                        Not yet issued
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{meta.description}</p>
                  <p className="text-xs text-blue-700 font-medium mt-1">{meta.deadline}</p>
                  <div className="mt-3 flex gap-2">
                    {tenancy ? (
                      <Link
                        href={`/properties/${id}/tenancy/documents/${type}`}
                        className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        ✨ Generate document
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-medium px-4 py-2 rounded-lg cursor-not-allowed">
                        ✨ Generate document
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Documents are generated from your tenancy records. Always review before issuing.
        LetLaw document templates are not a substitute for legal advice.
      </p>
    </div>
  );
}
