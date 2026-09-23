import type { Lead, LeadStatus, NewLead } from "@/types/leads/leads.types";
import { LEAD_STATUSES } from "@/types/leads/leads.types";

const HEADERS = [
  "Company",
  "Contact Person",
  "Role",
  "Email",
  "Phone",
  "LinkedIn",
  "Country",
  "City",
  "Company Type",
  "Status",
  "Last Contacted",
  "Next Follow-up",
  "Notes",
] as const;

const escape = (value: string) => `"${(value ?? "").replace(/"/g, '""')}"`;

export function leadsToCsv(leads: Lead[]) {
  const rows = leads.map((l) =>
    [
      l.company,
      l.contactPerson,
      l.role,
      l.email,
      l.phone,
      l.linkedin,
      l.country,
      l.city,
      l.companyType,
      l.status,
      l.lastContacted ?? "",
      l.nextFollowUp ?? "",
      l.notes.replace(/\n/g, " "),
    ]
      .map(escape)
      .join(","),
  );
  return [HEADERS.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function splitLine(line: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      out.push(current);
      current = "";
    } else current += char;
  }
  out.push(current);
  return out.map((v) => v.trim());
}

export function csvToLeads(text: string): { leads: NewLead[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { leads: [], skipped: 0 };
  const header = splitLine(lines[0] ?? "").map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const idx = (name: string) => header.indexOf(name);

  const map = {
    company: idx("company"),
    contactPerson: idx("contactperson"),
    role: idx("role"),
    email: idx("email"),
    phone: idx("phone"),
    linkedin: idx("linkedin"),
    country: idx("country"),
    city: idx("city"),
    companyType: idx("companytype"),
    status: idx("status"),
    lastContacted: idx("lastcontacted"),
    nextFollowUp: idx("nextfollowup"),
    notes: idx("notes"),
  };

  const leads: NewLead[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "") : "");
    const company = get(map.company);
    if (!company) {
      skipped++;
      continue;
    }
    const rawStatus = get(map.status) as LeadStatus;
    leads.push({
      company,
      contactPerson: get(map.contactPerson),
      role: get(map.role),
      email: get(map.email),
      phone: get(map.phone),
      linkedin: get(map.linkedin),
      country: get(map.country) || "Nigeria",
      city: get(map.city),
      website: "",
      companyType: get(map.companyType) || "Microfinance Bank",
      status: LEAD_STATUSES.includes(rawStatus) ? rawStatus : "Not Contacted",
      notes: get(map.notes),
      lastContacted: get(map.lastContacted) || null,
      nextFollowUp: get(map.nextFollowUp) || null,
    });
  }

  return { leads, skipped };
}

export const csvTemplate = HEADERS.join(",");
