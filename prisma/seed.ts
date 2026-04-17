import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
const adapter = tursoUrl
  ? new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
  : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), "dev.db")}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Demo user
  const user = await prisma.user.upsert({
    where: { id: "demo-user-001" },
    update: {},
    create: {
      id: "demo-user-001",
      email: "demo@letlaw.co.uk",
      name: "Demo Landlord",
    },
  });

  // Property 1 — well-compliant
  const p1 = await prisma.property.upsert({
    where: { id: "prop-001" },
    update: {},
    create: {
      id: "prop-001",
      userId: user.id,
      addressLine1: "14 Elm Street",
      city: "Manchester",
      postcode: "M14 5GH",
      propertyType: "house",
      bedrooms: 3,
    },
  });

  // Compliance for p1
  await prisma.complianceRecord.deleteMany({ where: { propertyId: p1.id } });
  await prisma.complianceRecord.createMany({
    data: [
      {
        propertyId: p1.id,
        type: "epc",
        status: "valid",
        issueDate: new Date("2021-06-01"),
        expiryDate: new Date("2031-06-01"),
        certificateNo: "EPC-2021-0042",
      },
      {
        propertyId: p1.id,
        type: "gas_safety",
        status: "expiring_soon",
        issueDate: new Date("2025-04-15"),
        expiryDate: new Date("2026-06-01"),
        certificateNo: "GAS-2025-1234",
      },
      {
        propertyId: p1.id,
        type: "eicr",
        status: "valid",
        issueDate: new Date("2022-03-01"),
        expiryDate: new Date("2027-03-01"),
        certificateNo: "EICR-2022-007",
      },
      {
        propertyId: p1.id,
        type: "fire_safety",
        status: "valid",
        issueDate: new Date("2025-01-10"),
        expiryDate: new Date("2026-01-10"),
      },
      {
        propertyId: p1.id,
        type: "hmo_licence",
        status: "unknown",
      },
    ],
  });

  // Tenancy for p1
  const t1 = await prisma.tenancy.upsert({
    where: { id: "ten-001" },
    update: {},
    create: {
      id: "ten-001",
      propertyId: p1.id,
      status: "active",
      startDate: new Date("2023-09-01"),
      rentAmount: 1350,
      rentFrequency: "monthly",
      rentDueDay: 1,
      depositAmount: 2025,
      depositScheme: "DPS",
      depositRef: "DPS-2023-789456",
      depositProtectedAt: new Date("2023-09-20"),
      prescribedInfoIssued: true,
      prescribedInfoDate: new Date("2023-09-20"),
      infoSheetIssued: false,
      writtenTermsIssued: false,
      rightToRentChecked: true,
      rightToRentDate: new Date("2023-08-28"),
    },
  });

  await prisma.tenant.upsert({
    where: { id: "tenant-001" },
    update: {},
    create: {
      id: "tenant-001",
      tenancyId: t1.id,
      firstName: "James",
      lastName: "Whitmore",
      email: "james.whitmore@email.com",
      phone: "07911 123456",
    },
  });

  // Property 2 — some issues
  const p2 = await prisma.property.upsert({
    where: { id: "prop-002" },
    update: {},
    create: {
      id: "prop-002",
      userId: user.id,
      addressLine1: "Flat 3, 22 Brunswick Road",
      city: "Leeds",
      postcode: "LS6 2NR",
      propertyType: "flat",
      bedrooms: 2,
    },
  });

  await prisma.complianceRecord.deleteMany({ where: { propertyId: p2.id } });
  await prisma.complianceRecord.createMany({
    data: [
      {
        propertyId: p2.id,
        type: "epc",
        status: "expired",
        issueDate: new Date("2014-01-01"),
        expiryDate: new Date("2024-01-01"),
        certificateNo: "EPC-2014-0099",
      },
      {
        propertyId: p2.id,
        type: "gas_safety",
        status: "valid",
        issueDate: new Date("2025-11-01"),
        expiryDate: new Date("2026-11-01"),
        certificateNo: "GAS-2025-5678",
      },
      {
        propertyId: p2.id,
        type: "eicr",
        status: "expired",
        issueDate: new Date("2019-06-01"),
        expiryDate: new Date("2024-06-01"),
      },
      {
        propertyId: p2.id,
        type: "fire_safety",
        status: "unknown",
      },
      {
        propertyId: p2.id,
        type: "hmo_licence",
        status: "unknown",
      },
    ],
  });

  // Tenancy for p2
  const t2 = await prisma.tenancy.upsert({
    where: { id: "ten-002" },
    update: {},
    create: {
      id: "ten-002",
      propertyId: p2.id,
      status: "active",
      startDate: new Date("2024-03-01"),
      rentAmount: 950,
      rentFrequency: "monthly",
      rentDueDay: 1,
      depositAmount: 1425,
      depositScheme: "MyDeposits",
      depositRef: "MD-2024-334455",
      depositProtectedAt: new Date("2024-03-25"),
      prescribedInfoIssued: true,
      prescribedInfoDate: new Date("2024-03-25"),
      infoSheetIssued: false,
      writtenTermsIssued: false,
      rightToRentChecked: false,
    },
  });

  await prisma.tenant.upsert({
    where: { id: "tenant-002" },
    update: {},
    create: {
      id: "tenant-002",
      tenancyId: t2.id,
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@email.com",
      phone: "07700 987654",
    },
  });

  // Repairs for p2
  await prisma.repair.upsert({
    where: { id: "repair-001" },
    update: {},
    create: {
      id: "repair-001",
      propertyId: p2.id,
      title: "Damp patch in kitchen ceiling",
      description:
        "Large damp patch appearing after heavy rain. Ceiling plaster is bubbling.",
      category: "damp_mould",
      severity: "high",
      status: "open",
      reportedAt: new Date("2026-04-01"),
      targetDate: new Date("2026-04-21"),
    },
  });

  await prisma.repair.upsert({
    where: { id: "repair-002" },
    update: {},
    create: {
      id: "repair-002",
      propertyId: p2.id,
      title: "Boiler making loud noise",
      description: "Boiler banging loudly on startup. Heating takes 30 minutes to come on.",
      category: "heating",
      severity: "medium",
      status: "in_progress",
      reportedAt: new Date("2026-03-28"),
      targetDate: new Date("2026-04-18"),
      contractorName: "Warmfast Heating",
      contractorContact: "0161 555 0101",
    },
  });

  // Property 3 — vacant
  const p3 = await prisma.property.upsert({
    where: { id: "prop-003" },
    update: {},
    create: {
      id: "prop-003",
      userId: user.id,
      addressLine1: "9 Park View",
      city: "Birmingham",
      postcode: "B15 2TH",
      propertyType: "flat",
      bedrooms: 1,
    },
  });

  await prisma.complianceRecord.deleteMany({ where: { propertyId: p3.id } });
  await prisma.complianceRecord.createMany({
    data: [
      {
        propertyId: p3.id,
        type: "epc",
        status: "valid",
        issueDate: new Date("2023-01-01"),
        expiryDate: new Date("2033-01-01"),
      },
      {
        propertyId: p3.id,
        type: "gas_safety",
        status: "expiring_soon",
        issueDate: new Date("2025-05-01"),
        expiryDate: new Date("2026-05-30"),
      },
      {
        propertyId: p3.id,
        type: "eicr",
        status: "valid",
        issueDate: new Date("2023-06-01"),
        expiryDate: new Date("2028-06-01"),
      },
      {
        propertyId: p3.id,
        type: "fire_safety",
        status: "unknown",
      },
      {
        propertyId: p3.id,
        type: "hmo_licence",
        status: "unknown",
      },
    ],
  });

  // Add sample documents to p1
  await prisma.document.upsert({
    where: { id: "doc-001" },
    update: {},
    create: {
      id: "doc-001",
      propertyId: p1.id,
      name: "Assured Shorthold Tenancy Agreement",
      type: "tenancy_agreement",
      notes: "Signed by all parties 1 Sep 2023",
      uploadedAt: new Date("2023-09-01"),
    },
  });

  await prisma.document.upsert({
    where: { id: "doc-002" },
    update: {},
    create: {
      id: "doc-002",
      propertyId: p1.id,
      name: "Gas Safety Record 2025",
      type: "gas_safety",
      notes: "CP12 from Smith Gas Services",
      uploadedAt: new Date("2025-04-15"),
    },
  });

  // ── Accounting seed data ───────────────────────────────────────────────────

  // Helper: assign quarter for a date in 2025-26 tax year
  function quarter(date: Date): number {
    const m = date.getMonth() + 1;
    if (m >= 4 && m <= 6) return 1;
    if (m >= 7 && m <= 9) return 2;
    if (m >= 10 && m <= 12) return 3;
    return 4;
  }

  // Property 1 — 14 Elm Street (p1) — 12 months of rent + realistic expenses
  const elmTxns = [
    // Rent income — monthly from Sep 2025 to Apr 2026
    ...["2025-09-01","2025-10-01","2025-11-01","2025-12-01","2026-01-01","2026-02-01","2026-03-01","2026-04-01"].map((d, i) => ({
      id: `tx-elm-rent-${i}`,
      propertyId: p1.id, kind: "income", category: "rent",
      description: "Monthly rent received", amount: 1350, date: new Date(d),
      taxYear: "2025-26", quarter: quarter(new Date(d)),
    })),
    // Gas safety check
    { id: "tx-elm-gas", propertyId: p1.id, kind: "expense", category: "repairs",
      description: "Annual gas safety inspection (CP12)", amount: 85,
      date: new Date("2025-10-12"), taxYear: "2025-26", quarter: 2,
      supplier: "Smith Gas Services", reference: "SGS-2025-0091",
      receiptNotes: "Annual CP12 — property checked, certificate issued" },
    // Buildings insurance
    { id: "tx-elm-ins", propertyId: p1.id, kind: "expense", category: "premises",
      description: "Landlord buildings & contents insurance", amount: 420,
      date: new Date("2025-09-01"), taxYear: "2025-26", quarter: 1,
      supplier: "Homelet Insurance", reference: "HL-POL-33441" },
    // Letting agent fee (10% of rent x 3 months)
    { id: "tx-elm-agent", propertyId: p1.id, kind: "expense", category: "professional",
      description: "Letting agent management fee (Q1)", amount: 405,
      date: new Date("2025-09-30"), taxYear: "2025-26", quarter: 1,
      supplier: "Northwood Lettings", reference: "NW-2025-SEP" },
    { id: "tx-elm-agent2", propertyId: p1.id, kind: "expense", category: "professional",
      description: "Letting agent management fee (Q2)", amount: 405,
      date: new Date("2025-12-31"), taxYear: "2025-26", quarter: 3,
      supplier: "Northwood Lettings", reference: "NW-2025-DEC" },
    // Mortgage interest
    { id: "tx-elm-mort", propertyId: p1.id, kind: "expense", category: "finance",
      description: "Mortgage interest (6 months)", amount: 2400,
      date: new Date("2025-10-01"), taxYear: "2025-26", quarter: 2,
      supplier: "Halifax Mortgages", reference: "HLXMT-2025-H2",
      receiptNotes: "Statement showing interest-only portion" },
    // Minor repair
    { id: "tx-elm-repair", propertyId: p1.id, kind: "expense", category: "repairs",
      description: "Replace bathroom tap and reseal bath", amount: 145,
      date: new Date("2026-01-18"), taxYear: "2025-26", quarter: 4,
      supplier: "Fast Fix Plumbing", reference: "FFP-0023" },
  ];

  for (const tx of elmTxns) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: tx as any,
    });
  }

  // Property 2 — Flat 3, 22 Brunswick Road (p2) — rent + bigger repair costs
  const brunswickTxns = [
    ...["2025-09-01","2025-10-01","2025-11-01","2025-12-01","2026-01-01","2026-02-01","2026-03-01"].map((d, i) => ({
      id: `tx-bruns-rent-${i}`,
      propertyId: p2.id, kind: "income", category: "rent",
      description: "Monthly rent received", amount: 950, date: new Date(d),
      taxYear: "2025-26", quarter: quarter(new Date(d)),
    })),
    // Boiler repair
    { id: "tx-bruns-boiler", propertyId: p2.id, kind: "expense", category: "repairs",
      description: "Boiler repair and service", amount: 380,
      date: new Date("2026-03-28"), taxYear: "2025-26", quarter: 4,
      supplier: "Warmfast Heating", reference: "WH-INV-2244",
      receiptNotes: "Callout + parts for thermostat replacement" },
    // Damp investigation
    { id: "tx-bruns-damp", propertyId: p2.id, kind: "expense", category: "repairs",
      description: "Damp survey and initial treatment", amount: 290,
      date: new Date("2026-04-05"), taxYear: "2025-26", quarter: 4,
      supplier: "DampAway Ltd", reference: "DA-2026-0071" },
    // Insurance
    { id: "tx-bruns-ins", propertyId: p2.id, kind: "expense", category: "premises",
      description: "Landlord insurance premium", amount: 315,
      date: new Date("2025-09-01"), taxYear: "2025-26", quarter: 1,
      supplier: "Simply Business" },
    // EPC renewal (expired — needs renewing)
    { id: "tx-bruns-epc", propertyId: p2.id, kind: "expense", category: "professional",
      description: "EPC renewal assessment", amount: 75,
      date: new Date("2026-02-14"), taxYear: "2025-26", quarter: 4,
      supplier: "Green Energy Assessors" },
  ];

  for (const tx of brunswickTxns) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: tx as any,
    });
  }

  console.log("✅ Database seeded with demo data");
  console.log(`   3 properties, 2 active tenancies, 2 repairs, ${elmTxns.length + brunswickTxns.length} transactions`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
