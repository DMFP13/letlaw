"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/utils";

// ── Properties ──────────────────────────────────────────────────────────────

export async function createProperty(formData: FormData) {
  "use server";
  const data = {
    userId: DEMO_USER_ID,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: (formData.get("addressLine2") as string) || null,
    city: formData.get("city") as string,
    postcode: (formData.get("postcode") as string).toUpperCase(),
    propertyType: formData.get("propertyType") as string,
    bedrooms: parseInt(formData.get("bedrooms") as string, 10) || 1,
  };

  const property = await prisma.property.create({ data });

  // Seed default compliance records
  const complianceTypes = ["epc", "gas_safety", "eicr", "fire_safety"];
  await prisma.complianceRecord.createMany({
    data: complianceTypes.map((type) => ({
      propertyId: property.id,
      type,
      status: "unknown",
    })),
  });

  revalidatePath("/properties");
  redirect(`/properties/${property.id}`);
}

export async function updateProperty(propertyId: string, formData: FormData) {
  "use server";
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: (formData.get("addressLine2") as string) || null,
      city: formData.get("city") as string,
      postcode: (formData.get("postcode") as string).toUpperCase(),
      propertyType: formData.get("propertyType") as string,
      bedrooms: parseInt(formData.get("bedrooms") as string, 10) || 1,
    },
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deleteProperty(propertyId: string) {
  "use server";
  await prisma.property.delete({ where: { id: propertyId } });
  revalidatePath("/properties");
  redirect("/properties");
}

// ── Compliance ───────────────────────────────────────────────────────────────

export async function upsertComplianceRecord(propertyId: string, formData: FormData) {
  "use server";
  const type = formData.get("type") as string;
  const issueDate = formData.get("issueDate") as string;
  const expiryDate = formData.get("expiryDate") as string;
  const certificateNo = formData.get("certificateNo") as string;
  const notes = formData.get("notes") as string;

  const existing = await prisma.complianceRecord.findFirst({
    where: { propertyId, type },
  });

  const expiryDt = expiryDate ? new Date(expiryDate) : null;
  const issueDt = issueDate ? new Date(issueDate) : null;

  let status = "unknown";
  if (expiryDt) {
    const now = new Date();
    const daysLeft = Math.ceil((expiryDt.getTime() - now.getTime()) / 86400000);
    if (daysLeft < 0) status = "expired";
    else if (daysLeft <= 60) status = "expiring_soon";
    else status = "valid";
  }

  if (existing) {
    await prisma.complianceRecord.update({
      where: { id: existing.id },
      data: { issueDate: issueDt, expiryDate: expiryDt, certificateNo, notes, status },
    });
  } else {
    await prisma.complianceRecord.create({
      data: { propertyId, type, issueDate: issueDt, expiryDate: expiryDt, certificateNo, notes, status },
    });
  }

  revalidatePath(`/properties/${propertyId}`);
}

// ── Tenancy ───────────────────────────────────────────────────────────────────

export async function createTenancy(propertyId: string, formData: FormData) {
  "use server";
  const depositAmount = formData.get("depositAmount") as string;
  const depositProtectedAt = formData.get("depositProtectedAt") as string;
  const prescribedInfoDate = formData.get("prescribedInfoDate") as string;
  const infoSheetDate = formData.get("infoSheetDate") as string;
  const writtenTermsDate = formData.get("writtenTermsDate") as string;
  const rightToRentDate = formData.get("rightToRentDate") as string;

  const tenancy = await prisma.tenancy.create({
    data: {
      propertyId,
      startDate: new Date(formData.get("startDate") as string),
      rentAmount: parseFloat(formData.get("rentAmount") as string),
      rentFrequency: formData.get("rentFrequency") as string,
      rentDueDay: parseInt(formData.get("rentDueDay") as string, 10) || 1,
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      depositScheme: (formData.get("depositScheme") as string) || null,
      depositRef: (formData.get("depositRef") as string) || null,
      depositProtectedAt: depositProtectedAt ? new Date(depositProtectedAt) : null,
      prescribedInfoIssued: !!prescribedInfoDate,
      prescribedInfoDate: prescribedInfoDate ? new Date(prescribedInfoDate) : null,
      infoSheetIssued: !!infoSheetDate,
      infoSheetDate: infoSheetDate ? new Date(infoSheetDate) : null,
      writtenTermsIssued: !!writtenTermsDate,
      writtenTermsDate: writtenTermsDate ? new Date(writtenTermsDate) : null,
      rightToRentChecked: !!rightToRentDate,
      rightToRentDate: rightToRentDate ? new Date(rightToRentDate) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  // Create tenants
  const firstName = formData.get("tenant1FirstName") as string;
  const lastName = formData.get("tenant1LastName") as string;
  const email = formData.get("tenant1Email") as string;
  const phone = formData.get("tenant1Phone") as string;

  if (firstName && lastName) {
    await prisma.tenant.create({
      data: {
        tenancyId: tenancy.id,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
      },
    });
  }

  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function updateTenancyDocuments(tenancyId: string, propertyId: string, formData: FormData) {
  "use server";
  const prescribedInfoDate = formData.get("prescribedInfoDate") as string;
  const infoSheetDate = formData.get("infoSheetDate") as string;
  const writtenTermsDate = formData.get("writtenTermsDate") as string;
  const rightToRentDate = formData.get("rightToRentDate") as string;
  const depositProtectedAt = formData.get("depositProtectedAt") as string;
  const depositRef = formData.get("depositRef") as string;
  const depositScheme = formData.get("depositScheme") as string;

  await prisma.tenancy.update({
    where: { id: tenancyId },
    data: {
      prescribedInfoIssued: !!prescribedInfoDate,
      prescribedInfoDate: prescribedInfoDate ? new Date(prescribedInfoDate) : null,
      infoSheetIssued: !!infoSheetDate,
      infoSheetDate: infoSheetDate ? new Date(infoSheetDate) : null,
      writtenTermsIssued: !!writtenTermsDate,
      writtenTermsDate: writtenTermsDate ? new Date(writtenTermsDate) : null,
      rightToRentChecked: !!rightToRentDate,
      rightToRentDate: rightToRentDate ? new Date(rightToRentDate) : null,
      depositProtectedAt: depositProtectedAt ? new Date(depositProtectedAt) : null,
      depositRef: depositRef || null,
      depositScheme: depositScheme || null,
    },
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function endTenancy(tenancyId: string, propertyId: string) {
  "use server";
  await prisma.tenancy.update({
    where: { id: tenancyId },
    data: { status: "ended", endDate: new Date() },
  });
  revalidatePath(`/properties/${propertyId}`);
}

// ── Repairs ───────────────────────────────────────────────────────────────────

export async function createRepair(propertyId: string, formData: FormData) {
  "use server";
  const targetDate = formData.get("targetDate") as string;
  const cost = formData.get("cost") as string;

  await prisma.repair.create({
    data: {
      propertyId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      severity: formData.get("severity") as string,
      targetDate: targetDate ? new Date(targetDate) : null,
      contractorName: (formData.get("contractorName") as string) || null,
      contractorContact: (formData.get("contractorContact") as string) || null,
      cost: cost ? parseFloat(cost) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/properties/${propertyId}/repairs`);
}

export async function updateRepairStatus(repairId: string, propertyId: string, status: string) {
  "use server";
  await prisma.repair.update({
    where: { id: repairId },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });
  revalidatePath(`/properties/${propertyId}/repairs`);
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function createDocument(propertyId: string, formData: FormData) {
  "use server";
  await prisma.document.create({
    data: {
      propertyId,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      fileUrl: (formData.get("fileUrl") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/properties/${propertyId}/documents`);
}

export async function deleteDocument(documentId: string, propertyId: string) {
  "use server";
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/properties/${propertyId}/documents`);
}
