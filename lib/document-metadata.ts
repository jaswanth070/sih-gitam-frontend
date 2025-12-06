import type { LucideIcon } from "lucide-react"
import {
  ShieldCheck,
  FileCheck2,
  ScrollText,
  Banknote,
  Plane,
  FileSignature,
  Receipt,
} from "lucide-react"

import type { DocumentType } from "@/utils/upload"

export interface DocumentSection {
  id: string
  title: string
  icon: LucideIcon
  description: string
  requirements: string[]
  documentType: DocumentType
  accept?: string
}

export const DOCUMENT_SECTIONS: DocumentSection[] = [
  {
    id: "govt-id",
    title: "Government ID",
    icon: ShieldCheck,
    description: "Any one of the approved government-issued IDs for each of the six participants.",
    requirements: ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"],
    documentType: "govt_id",
    accept: "application/pdf,image/*",
  },
  {
    id: "college-id",
    title: "College / Institute ID",
    icon: FileCheck2,
    description: "Upload the current academic ID card scans for all participants.",
    requirements: [
      "Front side",
      "Back side (if details are present)",
      "Ensure validity for the current academic year",
    ],
    documentType: "college_id",
    accept: "application/pdf,image/*",
  },
  {
    id: "consent-letter",
    title: "Consent Letter",
    icon: ScrollText,
    description: "Institution-issued consent letter authorising participation at the Grand Finale.",
    requirements: [
      "Signed on official letterhead",
      "Includes team name and problem statement ID",
      "Signed by the competent authority",
    ],
    documentType: "consent_letter",
    accept: "application/pdf",
  },
  {
    id: "bank-details",
    title: "Bank Details",
    icon: Banknote,
    description: "Banking details for reimbursements (team leader preferred).",
    requirements: [
      "Passbook first page or cancelled cheque",
      "Account holder PAN",
      "Bank IFSC and account number clearly visible",
    ],
    documentType: "bank_details",
    accept: "application/pdf,image/*",
  },
  {
    id: "bills",
    title: "Bills",
    icon: Receipt,
    description: "Itemised bills supporting reimbursement and allowance claims.",
    requirements: [
      "Upload individual bills or a consolidated PDF",
      "Ensure bill dates align with event timelines",
      "Highlight payable amounts and vendor details",
    ],
    documentType: "bills",
    accept: "application/pdf,image/*",
  },
  {
    id: "travel-allowance",
    title: "Travel Allowance Claims",
    icon: Plane,
    description: "Supporting documents for travel allowance claims.",
    requirements: [
      "Travel tickets / boarding passes",
      "Payment receipts (if applicable)",
      "Travel dates matching event schedule",
    ],
    documentType: "travel_allowance",
    accept: "application/pdf,image/*",
  },
  {
    id: "mandate-form",
    title: "Mandate Form",
    icon: FileSignature,
    description: "Download the official mandate form and submit a signed copy with bank verification.",
    requirements: [
      "Use the mandate form template available in the portal",
      "Bank seal and authorised signature",
      "Team leader name and account details confirmed",
    ],
    documentType: "beneficiary_form",
    accept: "application/pdf",
  },
]

export const DOCUMENT_SECTIONS_BY_TYPE: Record<DocumentType, DocumentSection> = DOCUMENT_SECTIONS.reduce(
  (acc, section) => {
    acc[section.documentType] = section
    return acc
  },
  {} as Record<DocumentType, DocumentSection>,
)

const APPROVED_STATUS_VALUES = ["approved", "verified", "accepted"] as const
export const APPROVED_STATUS_SET = new Set<string>(APPROVED_STATUS_VALUES)

export function isApprovedStatus(status?: string | null): boolean {
  if (!status) return false
  return APPROVED_STATUS_SET.has(status.toLowerCase())
}
