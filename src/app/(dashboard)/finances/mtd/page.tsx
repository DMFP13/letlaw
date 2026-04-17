export const dynamic = 'force-dynamic';
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, formatDate, formatCurrency } from "@/lib/utils";
import {
  currentTaxYear,
  mtdQuarterBoundaries,
  summariseTransactions,
  buildMtdPeriodPayload,
  TAX_YEARS,
} from "@/lib/accounting";
import {
  createMtdDraft,
  markMtdSubmitted,
  deleteMtdSubmission,
} from "@/lib/accounting-actions";

async function getMtdData(taxYear: string) {
  const [submissions, transactions] = await Promise.all([
    prisma.mtdSubmission.findMany({
      where: { userId: DEMO_USER_ID, taxYear },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { property: { userId: DEMO_USER_ID }, taxYear },
    }),
  ]);

  const quarters = mtdQuarterBoundaries(taxYear);
  return { submissions, transactions, quarters };
}

export default async function MtdPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const taxYear = year ?? currentTaxYear();
  const { submissions, transactions, quarters } = await getMtdData(taxYear);

  const submittedPeriods = new Set(
    submissions.filter((s) => s.status !== "draft").map((s) => s.period)
  );

  const totalIncome = transactions
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/finances" className="text-sm text-blue-600 hover:underline">
            ← Finances
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Making Tax Digital
          </h1>
          <p className="text-gray-500 text-sm">
            Quarterly submissions to HMRC — MTD for Income Tax Self-Assessment
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TAX_YEARS.map((y) => (
            <Link
              key={y}
              href={`/finances/mtd?year=${y}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                y === taxYear
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      {/* MTD overview card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-800 mb-2">What is MTD ITSA?</p>
            <p className="text-gray-600 leading-relaxed">
              Making Tax Digital for Income Tax replaces the annual Self Assessment
              tax return with quarterly digital updates sent directly to HMRC via
              their API, plus a final annual declaration.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2">Who must use it?</p>
            <ul className="text-gray-600 space-y-1">
              <li>
                <span className="font-medium text-orange-700">From April 2026</span> —
                landlords with gross rental income &gt;£50,000
              </li>
              <li>
                <span className="font-medium text-orange-700">From April 2027</span> —
                landlords with gross rental income &gt;£30,000
              </li>
            </ul>
            <p className="text-gray-500 mt-2">
              {taxYear} estimated gross income:{" "}
              <strong className={totalIncome >= 50000 ? "text-orange-700" : "text-gray-900"}>
                {formatCurrency(totalIncome)}
              </strong>
              {totalIncome >= 50000 && (
                <span className="ml-1 text-orange-700 font-medium">
                  — MTD mandatory
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2">How LetLaw helps</p>
            <ol className="text-gray-600 space-y-1 list-decimal list-inside">
              <li>Categorise transactions by HMRC boxes</li>
              <li>Review per-quarter figures below</li>
              <li>Generate submission payload</li>
              <li>Submit directly to HMRC API <span className="text-gray-400">(OAuth required)</span></li>
            </ol>
          </div>
        </div>
      </div>

      {/* HMRC API connection */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔐</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">HMRC API Connection</p>
            <p className="text-amber-800 text-sm mt-1">
              Live submission requires authorising LetLaw with your HMRC Government Gateway
              account via OAuth 2.0. The MTD ITSA sandbox is available for testing at{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">
                test-api.service.hmrc.gov.uk
              </code>
              . Production live submission will be enabled once you connect your HMRC account.
            </p>
            <button
              disabled
              className="mt-3 text-sm bg-amber-200 text-amber-800 px-4 py-2 rounded-lg cursor-not-allowed opacity-70"
            >
              Connect HMRC Account (coming soon)
            </button>
          </div>
        </div>
      </div>

      {/* Quarterly periods */}
      <h2 className="font-semibold text-gray-900 mb-3">
        Quarterly Periods — {taxYear}
      </h2>
      <div className="space-y-4 mb-8">
        {quarters.map((q) => {
          const qTx = transactions.filter((t) => t.quarter === q.quarter);
          const qSummary = summariseTransactions(qTx);
          const existing = submissions.find((s) => s.period === `Q${q.quarter}`);
          const isSubmitted = submittedPeriods.has(`Q${q.quarter}`);
          const isPast = new Date() > q.end;
          const isDue = new Date() > q.end && new Date() < q.deadline;
          const isOverdue = new Date() > q.deadline && !isSubmitted;

          const payload = buildMtdPeriodPayload(
            qTx,
            q.start.toISOString().split("T")[0],
            q.end.toISOString().split("T")[0]
          );

          return (
            <div
              key={q.quarter}
              className={`bg-white border rounded-xl overflow-hidden ${
                isOverdue
                  ? "border-red-300"
                  : isDue
                  ? "border-amber-300"
                  : "border-gray-200"
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{q.label}</span>
                    {isSubmitted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ Submitted
                      </span>
                    )}
                    {isOverdue && !isSubmitted && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        ⚠ Overdue
                      </span>
                    )}
                    {isDue && !isSubmitted && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Due by {formatDate(q.deadline)}
                      </span>
                    )}
                    {!isPast && (
                      <span className="text-xs text-gray-400">
                        Period not yet complete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(q.start)} – {formatDate(q.end)} · Deadline:{" "}
                    {formatDate(q.deadline)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-green-700 font-medium">
                      +{formatCurrency(qSummary.totalIncome)}
                    </p>
                    <p className="text-red-600 font-medium">
                      -{formatCurrency(qSummary.totalExpenses)}
                    </p>
                  </div>
                  <div className="text-right font-bold text-gray-900">
                    {formatCurrency(qSummary.netProfit)}
                    <p className="text-xs text-gray-400 font-normal">net</p>
                  </div>
                  <div className="flex gap-2">
                    {!existing && (
                      <form action={createMtdDraft}>
                        <input type="hidden" name="taxYear" value={taxYear} />
                        <input type="hidden" name="quarter" value={q.quarter} />
                        <button
                          type="submit"
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium"
                        >
                          Prepare draft
                        </button>
                      </form>
                    )}
                    {existing && existing.status === "draft" && (
                      <form action={markMtdSubmitted.bind(null, existing.id)}>
                        <button
                          type="submit"
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                        >
                          Mark submitted
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Payload preview */}
              {existing && (
                <details className="border-t border-gray-100">
                  <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 list-none flex items-center justify-between">
                    <span>
                      {existing.status === "submitted"
                        ? `Submitted ${formatDate(existing.submittedAt)} · Ref: ${existing.hmrcRef ?? "pending"}`
                        : "Draft — review payload before submission"}
                    </span>
                    <span className="text-gray-400">▼</span>
                  </summary>
                  <div className="px-4 pb-4 pt-2">
                    <p className="text-xs text-gray-500 mb-2">
                      HMRC MTD ITSA API payload (
                      <code className="bg-gray-100 px-1 rounded">
                        PUT /individuals/business/property/uk-non-fhl/period/{taxYear}
                      </code>
                      ):
                    </p>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {qTx.length} transactions · Figures from LetLaw transaction log
                      </p>
                      {existing.status === "draft" && (
                        <form action={deleteMtdSubmission.bind(null, existing.id)}>
                          <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                            Delete draft
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission history */}
      {submissions.filter((s) => s.status === "submitted").length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Submission History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left">
                <th className="pb-2 font-medium">Period</th>
                <th className="pb-2 font-medium">Tax year</th>
                <th className="pb-2 font-medium">Submitted</th>
                <th className="pb-2 font-medium">HMRC ref</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions
                .filter((s) => s.status === "submitted")
                .map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5">{s.period}</td>
                    <td className="py-2.5 text-gray-500">{s.taxYear}</td>
                    <td className="py-2.5 text-gray-500">
                      {s.submittedAt ? formatDate(s.submittedAt) : "—"}
                    </td>
                    <td className="py-2.5 font-mono text-xs">{s.hmrcRef ?? "—"}</td>
                    <td className="py-2.5">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legal note */}
      <p className="text-xs text-gray-400 text-center mt-6">
        LetLaw prepares MTD figures based on your transaction log. You are responsible for
        reviewing and authorising all submissions. This is not tax advice.
        HMRC MTD ITSA API:{" "}
        <a
          href="https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-assessment-biss-api"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          developer.service.hmrc.gov.uk
        </a>
      </p>
    </div>
  );
}
