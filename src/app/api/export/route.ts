import { NextRequest, NextResponse } from "next/server";
import { getTransactionsCsv } from "@/lib/accounting-actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const taxYear = searchParams.get("taxYear");

  const csv = await getTransactionsCsv(propertyId, taxYear);

  const filename = [
    "letlaw-transactions",
    propertyId ? `prop-${propertyId.slice(-6)}` : "all-properties",
    taxYear ?? "all-years",
  ].join("_") + ".csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
