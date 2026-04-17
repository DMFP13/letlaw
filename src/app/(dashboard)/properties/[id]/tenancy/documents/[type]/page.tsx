export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, formatDate, formatCurrency } from "@/lib/utils";
import { DOC_META, type DocType } from "@/lib/document-types";
import { AiClausePanel } from "./AiClausePanel";
import { PrintButton } from "./PrintButton";

const VALID_TYPES: DocType[] = ["rra-info-sheet", "tenancy-terms", "section-13", "right-to-rent"];

async function getData(propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, userId: DEMO_USER_ID },
    include: {
      tenancies: {
        where: { status: "active" },
        include: { tenants: true },
        take: 1,
      },
    },
  });
}

export default async function DocumentGeneratorPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { id, type } = await params;
  if (!VALID_TYPES.includes(type as DocType)) notFound();
  const docType = type as DocType;
  const meta = DOC_META[docType];

  const property = await getData(id);
  if (!property) notFound();
  const tenancy = property.tenancies[0];
  if (!tenancy) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Link href={`/properties/${id}/tenancy/documents`} className="text-sm text-blue-600 hover:underline">
          ← Documents
        </Link>
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">No active tenancy found.</p>
          <Link href={`/properties/${id}/tenancy`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Set up a tenancy →
          </Link>
        </div>
      </div>
    );
  }

  const tenant = tenancy.tenants[0];
  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : "Tenant";
  const landlordName = "Demo Landlord"; // In production: pulled from user record
  const address = [property.addressLine1, property.addressLine2, property.city, property.postcode]
    .filter(Boolean)
    .join(", ");

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const tenancyContext = `
Property: ${address}
Landlord: ${landlordName}
Tenant(s): ${tenantName}
Tenancy start: ${formatDate(tenancy.startDate)}
Rent: ${formatCurrency(tenancy.rentAmount)} per ${tenancy.rentFrequency}, due on day ${tenancy.rentDueDay}
Deposit: ${tenancy.depositAmount ? formatCurrency(tenancy.depositAmount) : "none"} ${tenancy.depositScheme ? `(${tenancy.depositScheme}, ref: ${tenancy.depositRef})` : ""}
`.trim();

  const hasAiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <Link href={`/properties/${id}/tenancy/documents`} className="text-sm text-blue-600 hover:underline">
              ← Documents
            </Link>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{meta.icon} {meta.title}</h1>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6 items-start print:block print:px-0 print:py-0">
        {/* Document preview — left */}
        <div className="flex-1 min-w-0">
          <div
            id="document-output"
            className="bg-white border border-gray-200 rounded-xl overflow-hidden print:border-0 print:rounded-none print:shadow-none"
          >
            <DocumentContent
              docType={docType}
              property={property}
              tenancy={tenancy}
              tenantName={tenantName}
              landlordName={landlordName}
              address={address}
              today={today}
            />
          </div>
        </div>

        {/* AI panel — right */}
        <div className="w-80 flex-shrink-0 print:hidden">
          <AiClausePanel
            docType={docType}
            tenancyContext={tenancyContext}
            hasApiKey={hasAiKey}
          />
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { font-family: Georgia, serif; }
          #print-btn { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Document templates ──────────────────────────────────────────────────────

function DocumentContent({
  docType, property, tenancy, tenantName, landlordName, address, today,
}: {
  docType: DocType;
  property: any;
  tenancy: any;
  tenantName: string;
  landlordName: string;
  address: string;
  today: string;
}) {
  switch (docType) {
    case "rra-info-sheet":
      return <RraInfoSheet tenantName={tenantName} landlordName={landlordName} address={address} today={today} tenancy={tenancy} />;
    case "tenancy-terms":
      return <TenancyTerms tenantName={tenantName} landlordName={landlordName} address={address} today={today} tenancy={tenancy} property={property} />;
    case "section-13":
      return <Section13Notice tenantName={tenantName} landlordName={landlordName} address={address} today={today} tenancy={tenancy} />;
    case "right-to-rent":
      return <RightToRentRecord tenantName={tenantName} landlordName={landlordName} address={address} today={today} tenancy={tenancy} />;
  }
}

const DocSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex gap-2 text-sm mb-1.5">
    <span className="text-gray-500 w-44 flex-shrink-0">{label}:</span>
    <span className="text-gray-900 font-medium">{value || "—"}</span>
  </div>
);

// ── RRA Information Sheet ────────────────────────────────────────────────────
function RraInfoSheet({ tenantName, landlordName, address, today, tenancy }: any) {
  return (
    <div className="p-8 text-gray-800 font-sans text-sm leading-relaxed">
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Renters' Rights Act 2025</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Tenant Information Sheet</h1>
          <p className="text-gray-500 text-xs mt-1">Prescribed information — must be given to all new assured tenants</p>
        </div>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <DocSection title="Tenancy Details">
        <Field label="Property address" value={address} />
        <Field label="Tenant(s)" value={tenantName} />
        <Field label="Landlord" value={landlordName} />
        <Field label="Tenancy start date" value={tenancy.startDate ? formatDate(tenancy.startDate) : "—"} />
        <Field label="Rent" value={`${formatCurrency(tenancy.rentAmount)} per ${tenancy.rentFrequency}`} />
      </DocSection>

      <DocSection title="Your Rights as a Tenant">
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Security of tenure:</strong> You have the right to remain in your home until the landlord obtains a possession order from a court. Fixed-term tenancies no longer end automatically — your tenancy continues as a periodic tenancy.</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>No Section 21 ('no-fault') eviction:</strong> From 1 May 2026, landlords cannot end your tenancy without a valid legal ground. Grounds are set out in Schedule 2 to the Housing Act 1988 as amended by the Renters' Rights Act 2025.</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Rent increases:</strong> Your landlord may only propose a rent increase via a written Section 13 notice. You must be given at least 2 months' notice. You have the right to challenge any proposed increase at the First-tier Tribunal (Property Chamber) — you will not be evicted for doing so.</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Repairs and habitability:</strong> Your landlord is legally required to keep the structure, exterior, and installations in repair (Landlord and Tenant Act 1985). The property must be free from hazards assessed as Category 1 under the Housing Health and Safety Rating System (HHSRS).</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Awaab's Law (PRS extension pending):</strong> Landlords must investigate and remedy damp, mould and hazardous conditions within prescribed timeframes once extended to the private rented sector.</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Keeping pets:</strong> You have a right to request permission to keep a pet. Your landlord may not unreasonably refuse. They may require appropriate pet insurance.</span></li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span><span><strong>Retaliatory eviction protection:</strong> If you complain about disrepair or exercise your legal rights, your landlord cannot use that as a reason to seek possession.</span></li>
        </ul>
      </DocSection>

      <DocSection title="Deposit">
        {tenancy.depositAmount ? (
          <>
            <Field label="Deposit held" value={formatCurrency(tenancy.depositAmount)} />
            <Field label="Deposit scheme" value={tenancy.depositScheme} />
            <Field label="Scheme reference" value={tenancy.depositRef} />
            <p className="text-sm text-gray-600 mt-2">Your deposit is protected in a government-approved scheme. The scheme will provide free dispute resolution if there is a disagreement about deductions at the end of the tenancy. You are entitled to the Prescribed Information and terms of the scheme.</p>
          </>
        ) : (
          <p className="text-sm text-gray-600">No deposit has been taken for this tenancy.</p>
        )}
      </DocSection>

      <DocSection title="Getting Help">
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• <strong>Citizens Advice</strong> — free advice on housing rights: <span className="text-blue-600">citizensadvice.org.uk</span></li>
          <li>• <strong>Shelter</strong> — housing charity and legal advice: <span className="text-blue-600">shelter.org.uk / 0808 800 4444</span></li>
          <li>• <strong>First-tier Tribunal (Property Chamber)</strong> — challenge rent increases or landlord failures: <span className="text-blue-600">gov.uk/residential-property-tribunal</span></li>
          <li>• <strong>Local council</strong> — report hazards, poor conditions, or illegal eviction</li>
          <li>• <strong>Private Rented Sector Ombudsman</strong> — complaints about landlord conduct (operational from 2026)</li>
        </ul>
      </DocSection>

      <div className="mt-8 pt-4 border-t border-gray-200 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="font-medium text-gray-700 mb-3">Landlord signature</p>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <p className="text-xs text-gray-400">{landlordName} · {today}</p>
        </div>
        <div>
          <p className="font-medium text-gray-700 mb-3">Tenant acknowledgement</p>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <p className="text-xs text-gray-400">{tenantName} · Date: _______________</p>
        </div>
      </div>
    </div>
  );
}

// ── Written Tenancy Terms ────────────────────────────────────────────────────
function TenancyTerms({ tenantName, landlordName, address, today, tenancy, property }: any) {
  return (
    <div className="p-8 text-gray-800 font-sans text-sm leading-relaxed">
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Renters' Rights Act 2025 — Section 10</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Written Statement of Tenancy Terms</h1>
          <p className="text-gray-500 text-xs mt-1">Must be provided at or before the start of the tenancy</p>
        </div>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <DocSection title="The Parties">
        <Field label="Landlord" value={landlordName} />
        <Field label="Tenant(s)" value={tenantName} />
      </DocSection>

      <DocSection title="The Property">
        <Field label="Address" value={address} />
        <Field label="Type" value={property.propertyType} />
        <Field label="Bedrooms" value={property.bedrooms} />
      </DocSection>

      <DocSection title="Tenancy Terms">
        <Field label="Start date" value={tenancy.startDate ? formatDate(tenancy.startDate) : "—"} />
        <Field label="Type" value="Assured periodic tenancy (Renters' Rights Act 2025)" />
        <Field label="Rent" value={`${formatCurrency(tenancy.rentAmount)} per ${tenancy.rentFrequency}`} />
        <Field label="Rent due" value={`Day ${tenancy.rentDueDay} of each ${tenancy.rentFrequency === "monthly" ? "month" : "week"}`} />
        <Field label="Payment method" value="Bank transfer (BACS)" />
      </DocSection>

      <DocSection title="Deposit">
        {tenancy.depositAmount ? (
          <>
            <Field label="Amount" value={formatCurrency(tenancy.depositAmount)} />
            <Field label="Scheme" value={tenancy.depositScheme || "To be confirmed"} />
            <Field label="Reference" value={tenancy.depositRef || "To be confirmed"} />
            <p className="text-sm text-gray-600 mt-2">The deposit is held to cover any unpaid rent, damage beyond fair wear and tear, or breach of tenancy obligations. Any deductions at the end of the tenancy will be itemised and agreed or resolved through the scheme's free dispute resolution service.</p>
          </>
        ) : (
          <p className="text-sm text-gray-600">No deposit is payable for this tenancy.</p>
        )}
      </DocSection>

      <DocSection title="Landlord Obligations">
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 ml-2">
          <li>Keep the structure, exterior, and all installed services (gas, electricity, water, heating) in repair and proper working order.</li>
          <li>Ensure the property is free from Category 1 HHSRS hazards and meets the Decent Homes Standard when extended to the PRS.</li>
          <li>Provide at least 24 hours' notice before entering the property except in genuine emergency.</li>
          <li>Protect the deposit within 30 days and provide Prescribed Information.</li>
          <li>Issue a valid EPC (minimum rating E), Gas Safety Record, and EICR at the start of the tenancy and keep certificates current.</li>
          <li>Obtain the tenant's written consent before increasing rent via Section 13 notice with at least 2 months' notice.</li>
          <li>Register with the Private Rented Sector Database when required by law.</li>
          <li>Be a member of an approved Landlord Ombudsman scheme when required by law.</li>
        </ol>
      </DocSection>

      <DocSection title="Tenant Obligations">
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 ml-2">
          <li>Pay rent in full and on time as stated above.</li>
          <li>Keep the property clean and in good decorative order (allowing for fair wear and tear).</li>
          <li>Report any repairs, defects, or hazards to the landlord promptly in writing.</li>
          <li>Not sublet or assign the tenancy without the landlord's written consent.</li>
          <li>Not use the property for any unlawful purpose.</li>
          <li>Allow the landlord or authorised contractors access for inspections and repairs on reasonable notice.</li>
          <li>Not cause nuisance or annoyance to neighbouring occupiers.</li>
          <li>Vacate the property and return all keys on the last day of the tenancy.</li>
          <li>Notify the landlord of any absence of more than 14 days.</li>
        </ol>
      </DocSection>

      <DocSection title="Pets">
        <p className="text-sm text-gray-700">The tenant has the right to request permission to keep a pet. Permission will not be unreasonably withheld. The landlord may require evidence of appropriate pet insurance as a condition of permission. Any damage caused by pets may be deducted from the deposit at the end of the tenancy.</p>
      </DocSection>

      <DocSection title="Alterations">
        <p className="text-sm text-gray-700">The tenant must not make any structural alterations to the property without the landlord's prior written consent. Consent may be given subject to conditions, including reinstatement to the original condition at the end of the tenancy.</p>
      </DocSection>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-4">By signing below, both parties confirm they have read, understood, and agree to the above terms. Additional terms, if any, are attached as a schedule.</p>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-3">Landlord</p>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">{landlordName} · {today}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-3">Tenant</p>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">{tenantName} · Date: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section 13 Rent Increase Notice ─────────────────────────────────────────
function Section13Notice({ tenantName, landlordName, address, today, tenancy }: any) {
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  // Align with rent due day
  twoMonthsFromNow.setDate(tenancy.rentDueDay ?? 1);
  const proposedDate = twoMonthsFromNow.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-8 text-gray-800 font-sans text-sm leading-relaxed">
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Housing Act 1988 · Section 13</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Notice Proposing a New Rent</h1>
          <p className="text-gray-500 text-xs mt-1">Notice to increase rent for an assured periodic tenancy</p>
        </div>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-800">
        <strong>Important:</strong> Complete the shaded fields before issuing. The proposed new rent and effective date must be filled in. The effective date must be at least <strong>2 months</strong> after the date this notice is given, and must fall on the first day of a period of the tenancy (the rent due date).
      </div>

      <DocSection title="Property and Parties">
        <Field label="Property address" value={address} />
        <Field label="Landlord" value={landlordName} />
        <Field label="Tenant(s)" value={tenantName} />
      </DocSection>

      <DocSection title="Current Tenancy">
        <Field label="Current rent" value={`${formatCurrency(tenancy.rentAmount)} per ${tenancy.rentFrequency}`} />
        <Field label="Rent due day" value={`Day ${tenancy.rentDueDay} of each period`} />
      </DocSection>

      <DocSection title="Proposed New Rent">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 space-y-3">
          <div className="flex gap-2 items-center text-sm">
            <span className="text-gray-600 w-44 flex-shrink-0">Proposed new rent:</span>
            <span className="font-bold text-gray-900 border-b-2 border-yellow-400 min-w-32 pb-0.5">£ _____________ per {tenancy.rentFrequency}</span>
          </div>
          <div className="flex gap-2 items-center text-sm">
            <span className="text-gray-600 w-44 flex-shrink-0">Effective from:</span>
            <span className="font-bold text-gray-900 border-b-2 border-yellow-400 min-w-32 pb-0.5">{proposedDate} <span className="text-xs text-gray-400 font-normal">(earliest valid date)</span></span>
          </div>
        </div>
      </DocSection>

      <DocSection title="Notice to Tenant">
        <div className="prose prose-sm text-gray-700 space-y-3">
          <p>I, <strong>{landlordName}</strong>, hereby give you notice, pursuant to section 13(2) of the Housing Act 1988, that as from the date specified above, the rent for the above property will be increased to the amount stated above.</p>
          <p>You have the right to apply to the First-tier Tribunal (Property Chamber) to have the proposed rent reviewed before the effective date. An application must be made <strong>before</strong> the effective date of this notice. The Tribunal will determine a market rent for the property.</p>
          <p>If you do not apply to the Tribunal, the new rent will take effect from the date stated above.</p>
          <p>You will not be penalised or evicted for exercising your right to challenge this notice at the Tribunal.</p>
        </div>
      </DocSection>

      <DocSection title="How to Challenge this Notice">
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• Apply to the First-tier Tribunal (Property Chamber) online at <span className="text-blue-600">gov.uk/residential-property-tribunal</span></li>
          <li>• Call the Tribunal Service on 0300 123 4504</li>
          <li>• Get free advice from Citizens Advice or Shelter before applying</li>
        </ul>
      </DocSection>

      <div className="mt-8 pt-4 border-t border-gray-200 text-sm">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium text-gray-700 mb-3">Signed by landlord</p>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">{landlordName} · {today}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-3">Landlord contact details</p>
            <p className="text-gray-600 text-xs">Name: {landlordName}</p>
            <p className="text-gray-600 text-xs">Address: ___________________________</p>
            <p className="text-gray-600 text-xs">Email: ___________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Right-to-Rent Record ─────────────────────────────────────────────────────
function RightToRentRecord({ tenantName, landlordName, address, today, tenancy }: any) {
  const checkboxes = [
    { label: "UK or Irish passport (or Irish passport card)" },
    { label: "Biometric Residence Permit (BRP)" },
    { label: "eVisa / UKVI share code (provide confirmation number)" },
    { label: "Certificate of Application / ARC card (pending status — repeat check required)" },
    { label: "Long-term UK visa with right to reside" },
    { label: "British National (Overseas) passport" },
    { label: "Documents checked via UKVI online service (share code verified)" },
  ];

  return (
    <div className="p-8 text-gray-800 font-sans text-sm leading-relaxed">
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Immigration Act 2014 · Home Office Code of Practice 2023</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Right-to-Rent Check Record</h1>
          <p className="text-gray-500 text-xs mt-1">Retain this record for the duration of the tenancy plus 1 year</p>
        </div>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <DocSection title="Property and Tenancy">
        <Field label="Property address" value={address} />
        <Field label="Landlord" value={landlordName} />
        <Field label="Tenancy start date" value={tenancy.startDate ? formatDate(tenancy.startDate) : "—"} />
      </DocSection>

      <DocSection title="Tenant Details">
        <Field label="Full name" value={tenantName} />
        <Field label="Date of birth" value="_______________" />
        <Field label="Nationality" value="_______________" />
        <Field label="Home Office reference (if applicable)" value="_______________" />
      </DocSection>

      <DocSection title="Documents Inspected">
        <p className="text-xs text-gray-500 mb-3">Tick all documents inspected. Retain certified copies with this record.</p>
        <div className="space-y-2">
          {checkboxes.map((cb) => (
            <label key={cb.label} className="flex items-start gap-3 cursor-pointer">
              <span className="w-4 h-4 border-2 border-gray-400 rounded mt-0.5 flex-shrink-0 inline-block" />
              <span className="text-sm text-gray-700">{cb.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Document reference / number</p>
            <div className="border-b border-gray-400 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Document expiry date (if applicable)</p>
            <div className="border-b border-gray-400 h-6" />
          </div>
        </div>
      </DocSection>

      <DocSection title="Check Method">
        <div className="space-y-2">
          {["Manual check (original documents inspected in person)", "Online check via UKVI Right to Rent Checking Service (share code provided)", "Identity Service Provider (IDSP) — for British and Irish citizens"].map((m) => (
            <label key={m} className="flex items-start gap-3 cursor-pointer">
              <span className="w-4 h-4 border-2 border-gray-400 rounded mt-0.5 flex-shrink-0 inline-block" />
              <span className="text-sm text-gray-700">{m}</span>
            </label>
          ))}
        </div>
      </DocSection>

      <DocSection title="Follow-up Required">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          <p className="font-medium mb-2">Repeat check required?</p>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-gray-400 rounded inline-block" /> Yes</label>
            <label className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-gray-400 rounded inline-block" /> No</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium mb-1">Repeat check due date (if applicable)</p>
              <div className="border-b border-amber-400 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium mb-1">Diarised reminder set?</p>
              <div className="flex gap-3 mt-1">
                <label className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 border border-gray-400 rounded inline-block" /> Yes</label>
                <label className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 border border-gray-400 rounded inline-block" /> No</label>
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-4">I confirm that I have checked the above documents and am satisfied that the named tenant has the right to rent residential property in England.</p>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-3">Checked by</p>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">{landlordName} · {today}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-3">Copies retained</p>
            <div className="space-y-1.5">
              {["Passport / identity document", "Visa / leave to remain", "Share code confirmation"].map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-gray-400 rounded inline-block flex-shrink-0" />
                  <span className="text-xs text-gray-600">{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
