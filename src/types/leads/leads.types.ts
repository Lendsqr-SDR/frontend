export const LEAD_STATUSES = [
  "Not Contacted",
  "Contacted",
  "Follow-up",
  "Responded",
  "Interested",
  "Meeting",
  "Won",
  "Not Interested",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const OUTREACH_CHANNELS = [
  "Email",
  "Call",
  "LinkedIn",
  "WhatsApp",
  "Meeting",
  "Note",
] as const;

export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export interface Lead {
  id: string;
  company: string;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  country: string;
  city: string;
  website: string;
  companyType: string;
  status: LeadStatus;
  notes: string;
  lastContacted: string | null;
  nextFollowUp: string | null;
  createdAt: string;
}

export type LeadInput = Omit<Lead, "id" | "createdAt">;
export type LeadPatch = Partial<LeadInput>;
export type NewLead = LeadInput;

export interface Activity {
  id: string;
  leadId: string;
  channel: OutreachChannel;
  summary: string;
  date: string;
}

export interface ActivityInput {
  channel: OutreachChannel;
  summary: string;
  date: string;
}

export type LeadSortField =
  | "company"
  | "status"
  | "lastContacted"
  | "nextFollowUp"
  | "createdAt";

export interface LeadListQuery {
  search?: string;
  status?: LeadStatus;
  country?: string;
  page?: number;
  pageSize?: number;
  sort?: LeadSortField;
  direction?: "asc" | "desc";
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LeadListResponse {
  items: Lead[];
  pagination: Pagination;
}

export interface BulkCreateLeadsRequest {
  leads: LeadInput[];
}

export interface ChangeStatusRequest {
  status: LeadStatus;
}

export interface AddNoteRequest {
  note: string;
}

export interface ScheduleFollowUpRequest {
  date: string;
}
