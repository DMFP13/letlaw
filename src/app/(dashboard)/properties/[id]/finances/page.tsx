import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID, formatCurrency, formatDate } from "@/lib/utils";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  currentTaxYear,
  summariseTransactions,
  TAX_YEARS,
  type IncomeCategoryKey,
  type ExpenseCategoryKey,
} from "@/lib/accounting";
import { createTransaction, deleteTransaction } from "@/lib/accounting-actions";

async function getPropertyFinances(propertyId: string, taxYear: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: DEMO_USER_ID },
  });
  if (!property) return null;

  const transactions = await prisma.transaction.findMany({
    where: { propertyId, taxYear },
    orderBy: { date: "desc" },
  });

  const allTransactions = await prisma.transaction.findMany({
    where: { propertyId },
    orderBy: { date: "desc" },
  });

  return { property, transactions, allTransactions };
}

export default async function PropertyFinancesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year } = await searchParams;
  const taxYear = year ?? currentTaxYear();

  const data = await getPropertyFinances(id, taxYear);
  if (!data) notFound();
  const { property, transactions, allTransactions } = data;

  const summary = summariseTransactions(transactions);
  const address = `${property.addressLine1}, ${property.postcode}`;

  const createTx = createTransaction.bind(null, id);

  const quarterLabels: Record<number, string> = {
    1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/properties/${id}`} className="text-sm text-blue-600 hover:underline">
            ← {property.addressLine1}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Finances</h1>
          <p className="text-gray-500 text-sm">{address}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {TAX_YEARS.map((y) => (
              <Link
                key={y}
                href={`/properties/${id}/finances?year=${y}`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  y === taxYear
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
          <a
            href={`/api/export?propertyId=${id}&taxYear=${taxYear}`}
            className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800"
          >
            ↓ CSV
          </a>
        </div>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total income</p>
          <p className="text-2xl font-bold text-green-800">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total expenses</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
        <div
          className={`border rounded-xl p-4 ${
            summary.netProfit >= 0
              ? "bg-blue-50 border-blue-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p className="text-sm text-gray-500">Net profit</p>
          <p
            className={`text-2xl font-bold ${
              summary.netProfit >= 0 ? "text-blue-800" : "text-red-700"
            }`}
          >
            {formatCurrency(summary.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Add transaction form */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add Transaction</h2>
            <form action={createTx} className="space-y-3">
              {/* Kind toggle */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer has-[:checked]:bg-green-50 has-[:checked]:border-green-400">
                  <input type="radio" name="kind" value="income" className="accent-green-600" defaultChecked />
                  <span className="text-sm font-medium text-green-800">💰 Income</span>
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
                  <input type="radio" name="kind" value="expense" className="accent-red-600" />
                  <span className="text-sm font-medium text-red-700">🧾 Expense</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="── Income ──">
                    {Object.entries(INCOME_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Expenses ──">
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  name="description"
                  required
                  placeholder="e.g. Monthly rent – April 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier / Payee
                </label>
                <input
                  name="supplier"
                  placeholder="e.g. Warmfast Heating Ltd"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference / Invoice no.
                </label>
                <input
                  name="reference"
                  placeholder="INV-001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Receipt section */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">📷 Receipt</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Receipt image URL
                  </label>
                  <input
                    name="receiptUrl"
                    type="url"
                    placeholder="https://drive.google.com/… or cloud link"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Link to photo in Google Drive, Dropbox, etc.
                  </p>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Receipt notes
                  </label>
                  <input
                    name="receiptNotes"
                    placeholder="What the receipt shows…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Transaction list */}
        <div className="md:col-span-3 space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">💷</p>
              <p className="font-medium text-gray-500">No transactions for {taxYear}</p>
              <p className="text-sm mt-1">Log income received and expenses paid.</p>
            </div>
          ) : (
            <>
              {/* Income */}
              <TransactionGroup
                label="Income"
                color="green"
                items={transactions.filter((t) => t.kind === "income")}
                propertyId={id}
                quarterLabels={quarterLabels}
              />
              {/* Expenses */}
              <TransactionGroup
                label="Expenses"
                color="red"
                items={transactions.filter((t) => t.kind === "expense")}
                propertyId={id}
                quarterLabels={quarterLabels}
              />
            </>
          )}

          {/* History of other years */}
          {allTransactions.length > transactions.length && (
            <div className="text-center">
              <p className="text-xs text-gray-400 mt-4">
                {allTransactions.length - transactions.length} transactions in other tax years.{" "}
                <a href={`/api/export?propertyId=${id}`} className="text-blue-600 hover:underline">
                  Export all years →
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionGroup({
  label,
  color,
  items,
  propertyId,
  quarterLabels,
}: {
  label: string;
  color: string;
  items: any[];
  propertyId: string;
  quarterLabels: Record<number, string>;
}) {
  if (items.length === 0) return null;
  const total = items.reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-sm font-semibold uppercase tracking-wide ${
            color === "green" ? "text-green-700" : "text-red-600"
          }`}
        >
          {label} ({items.length})
        </h3>
        <span
          className={`text-sm font-bold ${
            color === "green" ? "text-green-800" : "text-red-700"
          }`}
        >
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((t) => (
          <TransactionRow key={t.id} tx={t} propertyId={propertyId} quarterLabels={quarterLabels} />
        ))}
      </div>
    </div>
  );
}

function TransactionRow({
  tx,
  propertyId,
  quarterLabels,
}: {
  tx: any;
  propertyId: string;
  quarterLabels: Record<number, string>;
}) {
  const isIncome = tx.kind === "income";
  const catInfo = isIncome
    ? INCOME_CATEGORIES[tx.category as IncomeCategoryKey]
    : EXPENSE_CATEGORIES[tx.category as ExpenseCategoryKey];

  const deleteTx = deleteTransaction.bind(null, tx.id, propertyId);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{tx.description}</span>
            {tx.quarter && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {quarterLabels[tx.quarter]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
            <span>{formatDate(tx.date)}</span>
            {catInfo && <span>{catInfo.label}</span>}
            {tx.supplier && <span>· {tx.supplier}</span>}
            {tx.reference && <span>· Ref: {tx.reference}</span>}
          </div>
          {tx.receiptUrl && (
            <a
              href={tx.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              📎 View receipt
            </a>
          )}
          {tx.receiptNotes && (
            <p className="text-xs text-gray-400 mt-0.5">{tx.receiptNotes}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`text-base font-bold ${
              isIncome ? "text-green-700" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
          </span>
          <form action={deleteTx}>
            <button type="submit" className="text-xs text-red-400 hover:text-red-600">
              ✕
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
