import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  DEMO_USER_ID,
  formatCurrency,
} from "@/lib/utils";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  currentTaxYear,
  summariseTransactions,
  TAX_YEARS,
} from "@/lib/accounting";

async function getPortfolioFinances(taxYear: string) {
  const [properties, transactions] = await Promise.all([
    prisma.property.findMany({
      where: { userId: DEMO_USER_ID },
      select: { id: true, addressLine1: true, city: true, postcode: true },
    }),
    prisma.transaction.findMany({
      where: { property: { userId: DEMO_USER_ID }, taxYear },
      include: { property: true },
      orderBy: { date: "desc" },
    }),
  ]);

  // Per-property summaries
  const byProperty: Record<string, ReturnType<typeof summariseTransactions> & { address: string }> = {};
  for (const p of properties) {
    const ptx = transactions.filter((t) => t.propertyId === p.id);
    byProperty[p.id] = {
      ...summariseTransactions(ptx),
      address: `${p.addressLine1}, ${p.postcode}`,
    };
  }

  const totals = summariseTransactions(transactions);

  return { totals, byProperty, properties, transactions, taxYear };
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const taxYear = year ?? currentTaxYear();
  const { totals, byProperty, properties, transactions } =
    await getPortfolioFinances(taxYear);

  const quarterLabels = ["Q1 Apr–Jun", "Q2 Jul–Sep", "Q3 Oct–Dec", "Q4 Jan–Mar"];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
          <p className="text-gray-500 text-sm mt-1">
            Income, expenses, and tax summary across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tax year picker */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {TAX_YEARS.map((y) => (
              <Link
                key={y}
                href={`/finances?year=${y}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  y === taxYear
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
          {/* Export button */}
          <a
            href={`/api/export?taxYear=${taxYear}`}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            ↓ Export CSV
          </a>
          <Link
            href="/finances/mtd"
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            📤 MTD
          </Link>
        </div>
      </div>

      {/* MTD deadline banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm">
        <div className="flex items-start gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-semibold text-blue-900">Making Tax Digital for Income Tax</p>
            <p className="text-blue-700 mt-1">
              Mandatory from <strong>April 2026</strong> for landlords with gross rental income{" "}
              <strong>&gt;£50,000</strong>, and from <strong>April 2027</strong> for{" "}
              <strong>&gt;£30,000</strong>. Quarterly updates must be submitted to HMRC via the
              MTD API. LetLaw prepares your figures — you review and submit.{" "}
              <Link href="/finances/mtd" className="underline text-blue-800">
                Manage MTD →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio P&L summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Total income"
          value={formatCurrency(totals.totalIncome)}
          color="green"
          sub={`Tax year ${taxYear}`}
        />
        <SummaryCard
          label="Total expenses"
          value={formatCurrency(totals.totalExpenses)}
          color="red"
          sub={`${transactions.filter((t) => t.kind === "expense").length} transactions`}
        />
        <SummaryCard
          label="Net profit"
          value={formatCurrency(totals.netProfit)}
          color={totals.netProfit >= 0 ? "blue" : "red"}
          sub="Before tax adjustments"
        />
      </div>

      {/* Quarterly breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quarterly Breakdown</h2>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((q) => {
            const qd = totals.byQuarter[q];
            return (
              <div key={q} className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-2">{quarterLabels[q - 1]}</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Income</span>
                    <span className="text-green-700 font-medium">
                      {formatCurrency(qd.income)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expenses</span>
                    <span className="text-red-600 font-medium">
                      {formatCurrency(qd.expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600 font-medium">Net</span>
                    <span
                      className={`font-bold ${
                        qd.income - qd.expenses >= 0
                          ? "text-gray-900"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(qd.income - qd.expenses)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense breakdown by HMRC category */}
      {totals.totalExpenses > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Expenses by HMRC Category
          </h2>
          <div className="space-y-2">
            {Object.entries(EXPENSE_CATEGORIES).map(([key, info]) => {
              const amount = totals.byCategory[key] ?? 0;
              if (amount === 0) return null;
              const pct = totals.totalExpenses > 0
                ? Math.round((amount / totals.totalExpenses) * 100)
                : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-44 flex-shrink-0 text-sm text-gray-700">
                    {info.label}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(amount)}
                  </div>
                  <div className="w-10 text-right text-xs text-gray-400">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-property table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">By Property</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="pb-2 font-medium">Property</th>
              <th className="pb-2 font-medium text-right">Income</th>
              <th className="pb-2 font-medium text-right">Expenses</th>
              <th className="pb-2 font-medium text-right">Net</th>
              <th className="pb-2 font-medium text-right">Txns</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {properties.map((p) => {
              const s = byProperty[p.id];
              const txCount = transactions.filter(
                (t) => t.propertyId === p.id
              ).length;
              return (
                <tr key={p.id}>
                  <td className="py-2.5 text-gray-900">{p.addressLine1}</td>
                  <td className="py-2.5 text-right text-green-700 font-medium">
                    {formatCurrency(s.totalIncome)}
                  </td>
                  <td className="py-2.5 text-right text-red-600 font-medium">
                    {formatCurrency(s.totalExpenses)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-bold ${
                      s.netProfit >= 0 ? "text-gray-900" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(s.netProfit)}
                  </td>
                  <td className="py-2.5 text-right text-gray-400">{txCount}</td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/properties/${p.id}/finances?year=${taxYear}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr>
              <td className="pt-2 font-semibold text-gray-900">Total</td>
              <td className="pt-2 text-right font-bold text-green-700">
                {formatCurrency(totals.totalIncome)}
              </td>
              <td className="pt-2 text-right font-bold text-red-600">
                {formatCurrency(totals.totalExpenses)}
              </td>
              <td
                className={`pt-2 text-right font-bold ${
                  totals.netProfit >= 0 ? "text-gray-900" : "text-red-600"
                }`}
              >
                {formatCurrency(totals.netProfit)}
              </td>
              <td className="pt-2 text-right text-gray-400">
                {transactions.length}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
        <div className="mt-3 flex justify-end">
          <a
            href={`/api/export?taxYear=${taxYear}`}
            className="text-xs text-green-700 hover:underline"
          >
            ↓ Download full CSV for {taxYear}
          </a>
        </div>
      </div>

      {/* Finance disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        LetLaw tracks income and expenses to support your self-assessment and MTD submissions.
        This is not tax advice. Always consult a qualified accountant for your tax position.
        Finance costs (mortgage interest) are subject to the 20% tax credit restriction.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub: string;
}) {
  const colors: Record<string, string> = {
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
    blue: "border-blue-200 bg-blue-50",
  };
  const textColors: Record<string, string> = {
    green: "text-green-800",
    red: "text-red-700",
    blue: "text-blue-800",
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
