/**
 * HMRC-aligned accounting constants and helpers for UK landlords.
 *
 * Income categories map to the UK Property pages (SA105) of Self Assessment,
 * and to the Making Tax Digital for Income Tax (MTD ITSA) API property
 * income/expense boxes.
 *
 * MTD ITSA API base:
 *   Sandbox  → https://test-api.service.hmrc.gov.uk
 *   Live     → https://api.service.hmrc.gov.uk
 *
 * Key MTD ITSA endpoint for property income quarterly periods:
 *   PUT /individuals/business/property/{nino}/{businessId}/period/{taxYear}/{periodId}
 *
 * Key MTD ITSA endpoint for annual adjustment:
 *   PUT /individuals/business/property/{nino}/{businessId}/annual/{taxYear}
 *
 * Mandatory MTD thresholds (England):
 *   • From April 2026 → landlords with gross rental income > £50,000
 *   • From April 2027 → landlords with gross rental income > £30,000
 *   • From April 2028 → landlords with gross rental income > £20,000 (proposed)
 */

// ── Income categories (HMRC SA105 / MTD ITSA) ──────────────────────────────

export const INCOME_CATEGORIES = {
  rent: {
    label: "Rent received",
    hmrcBox: "rentIncome",
    description: "Gross rent, including any rent arrears received",
  },
  premiums: {
    label: "Premiums of lease grant",
    hmrcBox: "premiumsOfLeaseGrant",
    description: "Premiums received for granting a lease",
  },
  reverse_premiums: {
    label: "Reverse premiums",
    hmrcBox: "reversePremiums",
    description: "Payments received to take on a lease",
  },
  other_income: {
    label: "Other property income",
    hmrcBox: "otherPropertyIncome",
    description: "Any other rental or property income",
  },
} as const;

// ── Expense categories (HMRC SA105 / MTD ITSA) ─────────────────────────────

export const EXPENSE_CATEGORIES = {
  premises: {
    label: "Premises running costs",
    hmrcBox: "premisesRunningCosts",
    description: "Rent, rates, insurance, ground rents, utility bills",
    examples: ["Buildings insurance", "Gas/electric bills", "Ground rent", "Council tax (void periods)"],
  },
  repairs: {
    label: "Repairs & maintenance",
    hmrcBox: "repairsAndMaintenance",
    description: "Costs of repairing or maintaining the property",
    examples: ["Plumber call-out", "Roof repair", "Boiler service", "Decorating"],
  },
  finance: {
    label: "Finance costs (restricted)",
    hmrcBox: "financialCosts",
    description: "Mortgage interest & loan costs — 20% tax credit relief (basic rate only since 2020)",
    examples: ["Mortgage interest", "Loan arrangement fee", "Overdraft charges"],
  },
  professional: {
    label: "Professional fees",
    hmrcBox: "professionalFees",
    description: "Legal, management, accountancy and other professional fees",
    examples: ["Letting agent fee", "Accountant fee", "Solicitor fee", "Inventory clerk"],
  },
  services: {
    label: "Cost of services",
    hmrcBox: "costOfServices",
    description: "Cost of services you provide to tenants, including wages",
    examples: ["Cleaning contract", "Gardening", "Concierge wages"],
  },
  travel: {
    label: "Travel costs",
    hmrcBox: "travelCosts",
    description: "Car/van costs for managing your rental property",
    examples: ["Mileage to property", "Train fare for inspection"],
  },
  other: {
    label: "Other allowable expenses",
    hmrcBox: "other",
    description: "Any other expenses wholly and exclusively for the rental business",
    examples: ["Stationery", "Phone costs (rental-related portion)", "Software subscriptions"],
  },
} as const;

export type IncomeCategoryKey = keyof typeof INCOME_CATEGORIES;
export type ExpenseCategoryKey = keyof typeof EXPENSE_CATEGORIES;

// ── Tax year helpers ────────────────────────────────────────────────────────

/** UK tax year runs 6 April → 5 April. Returns e.g. "2025-26" */
export function currentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  // Before 6 April → previous tax year
  if (month < 4 || (month === 4 && day < 6)) {
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return `${year}-${String(year + 1).slice(2)}`;
}

/** Returns the tax year string for a given date */
export function taxYearForDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month < 4 || (month === 4 && day < 6)) {
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return `${year}-${String(year + 1).slice(2)}`;
}

/** MTD quarterly period boundaries within a tax year */
export function mtdQuarterBoundaries(taxYearStr: string): Array<{
  quarter: number;
  label: string;
  start: Date;
  end: Date;
  deadline: Date;
}> {
  const startYear = parseInt(taxYearStr.split("-")[0], 10);
  return [
    {
      quarter: 1,
      label: "Q1 (6 Apr – 5 Jul)",
      start: new Date(`${startYear}-04-06`),
      end: new Date(`${startYear}-07-05`),
      deadline: new Date(`${startYear}-08-05`),
    },
    {
      quarter: 2,
      label: "Q2 (6 Jul – 5 Oct)",
      start: new Date(`${startYear}-07-06`),
      end: new Date(`${startYear}-10-05`),
      deadline: new Date(`${startYear}-11-05`),
    },
    {
      quarter: 3,
      label: "Q3 (6 Oct – 5 Jan)",
      start: new Date(`${startYear}-10-06`),
      end: new Date(`${startYear + 1}-01-05`),
      deadline: new Date(`${startYear + 1}-02-05`),
    },
    {
      quarter: 4,
      label: "Q4 (6 Jan – 5 Apr)",
      start: new Date(`${startYear + 1}-01-06`),
      end: new Date(`${startYear + 1}-04-05`),
      deadline: new Date(`${startYear + 1}-05-05`),
    },
  ];
}

/** Assign a transaction's date to MTD quarter 1-4 */
export function mtdQuarterForDate(date: Date, taxYearStr: string): number {
  const quarters = mtdQuarterBoundaries(taxYearStr);
  for (const q of quarters) {
    if (date >= q.start && date <= q.end) return q.quarter;
  }
  return 1;
}

// ── P&L aggregation ─────────────────────────────────────────────────────────

export type TransactionSummary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Record<string, number>;
  byQuarter: Record<number, { income: number; expenses: number }>;
};

export function summariseTransactions(
  transactions: Array<{ kind: string; category: string; amount: number; quarter?: number | null }>
): TransactionSummary {
  const byCategory: Record<string, number> = {};
  const byQuarter: Record<number, { income: number; expenses: number }> = {
    1: { income: 0, expenses: 0 },
    2: { income: 0, expenses: 0 },
    3: { income: 0, expenses: 0 },
    4: { income: 0, expenses: 0 },
  };
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    const q = t.quarter ?? 1;
    if (t.kind === "income") {
      totalIncome += t.amount;
      byQuarter[q].income += t.amount;
    } else {
      totalExpenses += t.amount;
      byQuarter[q].expenses += t.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    byCategory,
    byQuarter,
  };
}

// ── MTD ITSA API helpers ────────────────────────────────────────────────────

/**
 * Build the MTD ITSA quarterly period request body from a list of transactions.
 * Format matches the HMRC sandbox schema for:
 *   PUT /individuals/business/property/uk-non-fhl/period/{taxYear}
 */
export function buildMtdPeriodPayload(
  transactions: Array<{ kind: string; category: string; amount: number }>,
  periodStart: string,
  periodEnd: string
) {
  const incomeByBox: Record<string, number> = {};
  const expensesByBox: Record<string, number> = {};

  for (const t of transactions) {
    if (t.kind === "income") {
      const cat = INCOME_CATEGORIES[t.category as IncomeCategoryKey];
      if (cat) {
        incomeByBox[cat.hmrcBox] = (incomeByBox[cat.hmrcBox] ?? 0) + t.amount;
      }
    } else {
      const cat = EXPENSE_CATEGORIES[t.category as ExpenseCategoryKey];
      if (cat) {
        expensesByBox[cat.hmrcBox] = (expensesByBox[cat.hmrcBox] ?? 0) + t.amount;
      }
    }
  }

  return {
    fromDate: periodStart,
    toDate: periodEnd,
    income: Object.keys(incomeByBox).length > 0 ? incomeByBox : undefined,
    expenses: Object.keys(expensesByBox).length > 0 ? expensesByBox : undefined,
  };
}

// ── CSV export ──────────────────────────────────────────────────────────────

export function transactionsToCsv(
  transactions: Array<{
    date: Date;
    kind: string;
    category: string;
    description: string;
    amount: number;
    supplier?: string | null;
    reference?: string | null;
    receiptNotes?: string | null;
    taxYear: string;
    quarter?: number | null;
  }>,
  propertyAddress?: string
): string {
  const header = [
    "Date",
    "Tax Year",
    "MTD Quarter",
    "Type",
    "Category",
    "HMRC Box",
    "Description",
    "Supplier / Payee",
    "Reference",
    "Amount (£)",
    "Receipt Notes",
    ...(propertyAddress ? ["Property"] : []),
  ].join(",");

  const rows = transactions.map((t) => {
    const cat =
      t.kind === "income"
        ? INCOME_CATEGORIES[t.category as IncomeCategoryKey]
        : EXPENSE_CATEGORIES[t.category as ExpenseCategoryKey];
    const hmrcBox = cat ? cat.hmrcBox : t.category;
    const sign = t.kind === "expense" ? "-" : "";
    return [
      new Date(t.date).toLocaleDateString("en-GB"),
      t.taxYear,
      t.quarter ? `Q${t.quarter}` : "",
      t.kind === "income" ? "Income" : "Expense",
      cat ? cat.label : t.category,
      hmrcBox,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.supplier ?? "").replace(/"/g, '""')}"`,
      `"${(t.reference ?? "").replace(/"/g, '""')}"`,
      `${sign}${t.amount.toFixed(2)}`,
      `"${(t.receiptNotes ?? "").replace(/"/g, '""')}"`,
      ...(propertyAddress ? [`"${propertyAddress.replace(/"/g, '""')}"`] : []),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

export const TAX_YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"];
