export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  DEMO_USER_ID,
  DOCUMENT_TYPES,
  formatDate,
} from "@/lib/utils";
import { createDocument, deleteDocument } from "@/lib/actions";

async function getDocuments(propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: DEMO_USER_ID },
  });
  if (!property) return null;

  const documents = await prisma.document.findMany({
    where: { propertyId },
    orderBy: { uploadedAt: "desc" },
  });

  return { property, documents };
}

const DOCTYPE_GROUPS: Record<string, string[]> = {
  "Tenancy": ["tenancy_agreement", "info_sheet", "written_terms", "deposit", "right_to_rent"],
  "Safety Certificates": ["epc", "gas_safety", "eicr"],
  "Repairs & Inspections": ["repair_photo", "invoice", "inspection"],
  "Other": ["other"],
};

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDocuments(id);
  if (!data) notFound();

  const { property, documents } = data;

  const docsByType: Record<string, typeof documents> = {};
  for (const doc of documents) {
    if (!docsByType[doc.type]) docsByType[doc.type] = [];
    docsByType[doc.type].push(doc);
  }

  const createDocBound = createDocument.bind(null, id);

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
          Document Vault
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {documents.length} document{documents.length !== 1 ? "s" : ""} — permanent audit trail
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload form */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add Document</h2>
            <form action={createDocBound} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Document name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Gas Safety Record 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Document type
                </label>
                <select
                  name="type"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  File URL
                </label>
                <input
                  name="fileUrl"
                  type="url"
                  placeholder="https://drive.google.com/… (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Link to file in Drive, Dropbox, etc.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Optional notes…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Add to Vault
              </button>
            </form>
          </div>
        </div>

        {/* Document list */}
        <div className="md:col-span-2 space-y-6">
          {documents.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">📁</p>
              <p className="font-medium text-gray-500">No documents yet</p>
              <p className="text-sm mt-1">
                Add tenancy agreements, certificates, and inspection records here.
              </p>
            </div>
          ) : (
            Object.entries(DOCTYPE_GROUPS).map(([groupName, types]) => {
              const groupDocs = types.flatMap((t) => docsByType[t] || []);
              if (groupDocs.length === 0) return null;
              return (
                <div key={groupName}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {groupName} ({groupDocs.length})
                  </h3>
                  <div className="space-y-2">
                    {groupDocs.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        doc={doc}
                        propertyId={id}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({
  doc,
  propertyId,
}: {
  doc: any;
  propertyId: string;
}) {
  const typeLabel =
    DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES] || doc.type;

  const deleteDocBound = deleteDocument.bind(null, doc.id, propertyId);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
      <div className="text-2xl flex-shrink-0">
        {doc.type === "repair_photo" ? "📷" : doc.type === "invoice" ? "🧾" : "📄"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
            <p className="text-xs text-gray-500">
              {typeLabel} · Added {formatDate(doc.uploadedAt)}
            </p>
            {doc.notes && (
              <p className="text-xs text-gray-400 mt-1">{doc.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open →
              </a>
            )}
            <form action={deleteDocBound}>
              <button
                type="submit"
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
