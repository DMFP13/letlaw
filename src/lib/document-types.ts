// Document type definitions and helpers for RRA document generation

export type DocType = "rra-info-sheet" | "tenancy-terms" | "section-13" | "right-to-rent";

export const DOC_META: Record<DocType, { title: string; subtitle: string; icon: string; deadline: string; description: string }> = {
  "rra-info-sheet": {
    title: "RRA Information Sheet",
    subtitle: "Renters' Rights Act Prescribed Information",
    icon: "📋",
    deadline: "Mandatory from 1 May 2026 for all new tenancies",
    description:
      "The government-prescribed document that must be given to all new assured tenants at the start of their tenancy. Sets out their key rights under the Renters' Rights Act 2025.",
  },
  "tenancy-terms": {
    title: "Written Tenancy Terms",
    subtitle: "Section 10 Statement of Terms",
    icon: "📄",
    deadline: "Mandatory from 1 May 2026 for all new tenancies",
    description:
      "A written statement of the key terms of the tenancy, including rent, deposit, and obligations. Must be provided at or before the start of the tenancy.",
  },
  "section-13": {
    title: "Section 13 Rent Increase Notice",
    subtitle: "Notice Proposing New Rent",
    icon: "💷",
    deadline: "Replaces all other rent increase routes from 1 May 2026",
    description:
      "The only permitted route to increase rent under an assured tenancy. Requires at least 2 months' notice (or 6 months for social housing). The tenant may challenge the amount at the First-tier Tribunal.",
  },
  "right-to-rent": {
    title: "Right-to-Rent Record",
    subtitle: "Home Office Compliant Check Record",
    icon: "🪪",
    deadline: "Required before or at start of every tenancy",
    description:
      "A record of the documents checked to confirm the tenant's right to rent in England. Landlords must check and retain copies. Repeat checks required when leave expires.",
  },
};
