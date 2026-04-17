import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInDays,
  format,
  isAfter,
  isBefore,
  addDays,
  addMonths,
  addYears,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Not set";
  return format(new Date(date), "d MMM yyyy");
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export type ComplianceStatus = "valid" | "expiring_soon" | "expired" | "missing";

export function getComplianceStatus(
  expiryDate: Date | null | undefined
): ComplianceStatus {
  if (!expiryDate) return "missing";
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (isBefore(expiry, now)) return "expired";
  if (differenceInDays(expiry, now) <= 60) return "expiring_soon";
  return "valid";
}

export function daysUntilExpiry(expiryDate: Date | null | undefined): number | null {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

export const COMPLIANCE_TYPES = {
  epc: {
    label: "EPC",
    description: "Energy Performance Certificate",
    validYears: 10,
  },
  gas_safety: {
    label: "Gas Safety",
    description: "Annual gas safety record (CP12)",
    validYears: 1,
  },
  eicr: {
    label: "EICR",
    description: "Electrical Installation Condition Report",
    validYears: 5,
  },
  hmo_licence: {
    label: "HMO Licence",
    description: "House in Multiple Occupation licence",
    validYears: 5,
  },
  fire_safety: {
    label: "Fire Safety",
    description: "Fire safety assessment / alarm checks",
    validYears: 1,
  },
} as const;

export type ComplianceType = keyof typeof COMPLIANCE_TYPES;

export const REPAIR_CATEGORIES = {
  damp_mould: "Damp & Mould",
  leak: "Leak / Water Damage",
  heating: "Heating Failure",
  electrical: "Electrical Fault",
  structural: "Structural Issue",
  pests: "Pest Infestation",
  security: "Security Risk",
  other: "Other",
} as const;

export const REPAIR_SEVERITIES = {
  emergency: { label: "Emergency", slaHours: 24, color: "red" },
  high: { label: "High", slaHours: 48, color: "orange" },
  medium: { label: "Medium", slaHours: 168, color: "yellow" },
  low: { label: "Low", slaHours: 720, color: "blue" },
} as const;

export const DOCUMENT_TYPES = {
  tenancy_agreement: "Tenancy Agreement",
  info_sheet: "RRA Information Sheet",
  written_terms: "Written Tenancy Terms",
  deposit: "Deposit Documentation",
  epc: "EPC Certificate",
  gas_safety: "Gas Safety Record",
  eicr: "EICR Certificate",
  right_to_rent: "Right to Rent Check",
  repair_photo: "Repair Photo",
  invoice: "Contractor Invoice",
  inspection: "Inspection Report",
  other: "Other",
} as const;

export const DEPOSIT_SCHEMES = ["DPS", "MyDeposits", "TDS"];

export const DEMO_USER_ID = "demo-user-001";

// Calculate rent review eligibility: min 52 weeks after last increase
export function isEligibleForRentReview(lastIncreaseDate: Date | null | undefined): boolean {
  if (!lastIncreaseDate) return true;
  return isAfter(new Date(), addDays(new Date(lastIncreaseDate), 365));
}

export function rentReviewNoticeDeadline(effectiveDate: Date): Date {
  // Must give at least 2 months' notice under new Act
  return addDays(new Date(effectiveDate), -61);
}
