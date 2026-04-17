"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/utils";
import {
  taxYearForDate,
  mtdQuarterForDate,
  buildMtdPeriodPayload,
  transactionsToCsv,
  mtdQuarterBoundaries,
} from "@/lib/accounting";

// ── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(propertyId: string, formData: FormData) {
  "use server";
  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr);
  const taxYear = taxYearForDate(date);
  const amount = parseFloat(formData.get("amount") as string);
  const kind = formData.get("kind") as string;

  await prisma.transaction.create({
    data: {
      propertyId,
      kind,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount,
      date,
      taxYear,
      quarter: mtdQuarterForDate(date, taxYear),
      receiptUrl: (formData.get("receiptUrl") as string) || null,
      receiptNotes: (formData.get("receiptNotes") as string) || null,
      supplier: (formData.get("supplier") as string) || null,
      reference: (formData.get("reference") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/properties/${propertyId}/finances`);
  revalidatePath("/finances");
}

export async function deleteTransaction(txId: string, propertyId: string) {
  "use server";
  await prisma.transaction.delete({ where: { id: txId } });
  revalidatePath(`/properties/${propertyId}/finances`);
  revalidatePath("/finances");
}

// ── MTD Submissions ───────────────────────────────────────────────────────────

export async function createMtdDraft(formData: FormData) {
  "use server";
  const taxYear = formData.get("taxYear") as string;
  const quarter = parseInt(formData.get("quarter") as string, 10);
  const quarters = mtdQuarterBoundaries(taxYear);
  const qData = quarters[quarter - 1];

  if (!qData) throw new Error("Invalid quarter");

  // Gather all transactions for this property set and period
  const transactions = await prisma.transaction.findMany({
    where: {
      property: { userId: DEMO_USER_ID },
      taxYear,
      quarter,
    },
  });

  const payload = buildMtdPeriodPayload(
    transactions,
    qData.start.toISOString().split("T")[0],
    qData.end.toISOString().split("T")[0]
  );

  await prisma.mtdSubmission.create({
    data: {
      userId: DEMO_USER_ID,
      taxYear,
      period: `Q${quarter}`,
      periodStart: qData.start,
      periodEnd: qData.end,
      status: "draft",
      figuresJson: JSON.stringify(payload),
    },
  });

  revalidatePath("/finances/mtd");
}

export async function markMtdSubmitted(submissionId: string) {
  "use server";
  await prisma.mtdSubmission.update({
    where: { id: submissionId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      hmrcRef: `HMRC-REF-${Date.now()}`, // placeholder until real API
    },
  });
  revalidatePath("/finances/mtd");
}

export async function deleteMtdSubmission(submissionId: string) {
  "use server";
  await prisma.mtdSubmission.delete({ where: { id: submissionId } });
  revalidatePath("/finances/mtd");
}

// ── CSV export route helper ────────────────────────────────────────────────────
// Used by the API route — not a server action itself, but exported for reuse.

export async function getTransactionsCsv(
  propertyId: string | null,
  taxYear: string | null
) {
  const where: Record<string, any> = {
    property: { userId: DEMO_USER_ID },
  };
  if (propertyId) where.propertyId = propertyId;
  if (taxYear) where.taxYear = taxYear;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { property: true },
    orderBy: { date: "desc" },
  });

  const propertyAddress =
    propertyId && transactions.length > 0
      ? `${transactions[0].property.addressLine1}, ${transactions[0].property.postcode}`
      : undefined;

  return transactionsToCsv(
    transactions.map((t) => ({
      date: t.date,
      kind: t.kind,
      category: t.category,
      description: t.description,
      amount: t.amount,
      supplier: t.supplier,
      reference: t.reference,
      receiptNotes: t.receiptNotes,
      taxYear: t.taxYear,
      quarter: t.quarter,
    })),
    propertyId ? propertyAddress : undefined
  );
}
