import * as XLSX from "xlsx";
import type { Lead, LeadStatus, NewLead } from "@/types/leads/leads.types";

const HEADERS = [
  "Date",
  "Company name",
  "Country",
  "Institution Type",
  "Contact Name",
  "Decision Maker",
  "Gender",
  "Email",
  "Mobile number",
  "Outreach",
  "Reachable",
  "Follow-up needed",
  "Stages",
  "Temperature",
  "Comment / Summary of call",
  "Next follow-up",
] as const;

const escape = (value: string) => `"${(value ?? "").replace(/"/g, '""')}"`;

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const source = String(value).trim();
  if (!source) return null;

  const numeric = Number(source);
  if (/^\d+(?:\.\d+)?$/.test(source)) {
    if (numeric <= 0 || numeric >= 2958466) return null;
    const serialDate = new Date(Date.UTC(1899, 11, 30) + numeric * 86400000);
    return Number.isNaN(serialDate.getTime()) ? null : serialDate.toISOString().slice(0, 10);
  }

  const isoDate = source.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    const [, yearValue, monthValue, dayValue] = isoDate;
    if (!yearValue || !monthValue || !dayValue) return null;
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date.toISOString().slice(0, 10);
  }

  const dayFirst = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dayFirst) {
    const [, dayValue, monthValue, yearValue] = dayFirst;
    if (!dayValue || !monthValue || !yearValue) return null;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const rawYear = Number(yearValue);
    const year =
      yearValue.length === 2 ? (rawYear < 50 ? 2000 + rawYear : 1900 + rawYear) : rawYear;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date.toISOString().slice(0, 10);
  }

  const direct = new Date(source);
  return Number.isNaN(direct.getTime()) ? null : direct.toISOString().slice(0, 10);
}

function normalizeStatus(value: unknown): LeadStatus | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const statusMap: Record<string, LeadStatus> = {
    "not contacted": "Not Contacted",
    contacted: "Contacted",
    engaged: "Contacted",
    cold: "Not Contacted",
    "follow up": "Follow-up",
    responded: "Responded",
    interested: "Interested",
    warm: "Interested",
    hot: "Interested",
    meeting: "Meeting",
    won: "Won",
    "not interested": "Not Interested",
  };
  return statusMap[normalized] ?? "Not Contacted";
}

function firstNonEmpty(...values: unknown[]) {
  return values.find((value) => {
    if (value === null || value === undefined) return false;
    const text = String(value).trim();
    return text.length > 0;
  });
}

function buildNotes(values: Record<string, unknown>) {
  const chunks = [
    values["comment"],
    values["outreach"],
    values["reachable"],
    values["gender"],
    values["decisionMaker"],
  ]
    .filter((chunk) => chunk !== null && chunk !== undefined && String(chunk).trim())
    .map((chunk) => String(chunk));

  const unique = Array.from(new Set(chunks.map((chunk) => chunk.trim())));
  return unique.join("; ");
}

export function leadsToCsv(leads: Lead[]) {
  const rows = leads.map((l) =>
    [
      l.lastContacted ?? "",
      l.company,
      l.country,
      l.companyType,
      l.contactPerson,
      "",
      "",
      l.email,
      l.phone,
      "",
      "",
      l.followUpNeeded ? "Yes" : "No",
      "",
      l.temperature,
      l.notes.replace(/\n/g, " "),
      l.nextFollowUp ?? "",
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

type ImportResult = {
  leads: NewLead[];
  sourceRows: number[];
  skipped: number;
  invalidEmails: number;
};

export function csvToLeads(text: string): ImportResult {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) {
    return { leads: [], sourceRows: [], skipped: 0, invalidEmails: 0 };
  }
  return rowsToLeads(lines.map(splitLine));
}

function rowsToLeads(rows: unknown[][]): ImportResult {
  if (rows.length < 2) {
    return { leads: [], sourceRows: [], skipped: 0, invalidEmails: 0 };
  }

  const headerMap = new Map<string, number>();
  const headerRow = rows[0] ?? [];

  for (let i = 0; i < headerRow.length; i++) {
    const header = normalizeHeader(headerRow[i]);
    if (!header) continue;

    const canonical =
      header === "date" || header === "last contacted"
        ? "date"
        : header === "company" || header === "company name" || header === "companyname"
          ? "company"
          : header === "country"
            ? "country"
            : header === "institution type" ||
                header === "institutiontype" ||
                header === "company type" ||
                header === "type"
              ? "companyType"
              : header === "contact name" ||
                  header === "contact person" ||
                  header === "contact" ||
                  header === "name"
                ? "contactPerson"
                : header === "decision maker" || header === "decisionmaker"
                  ? "decisionMaker"
                  : header === "gender"
                    ? "gender"
                    : header === "email" || header === "email address" || header === "e mail"
                      ? "email"
                      : header === "mobile number" ||
                          header === "mobile" ||
                          header === "phone" ||
                          header === "phone number"
                        ? "phone"
                        : header === "role"
                          ? "role"
                          : header === "linkedin"
                            ? "linkedin"
                            : header === "city"
                              ? "city"
                              : header === "status"
                                ? "status"
                                : header === "last contacted" || header === "date"
                                  ? "date"
                                  : header === "next follow up" || header === "nextfollowup"
                                    ? "nextFollowUp"
                                    : header === "notes"
                                      ? "notes"
                                      : header === "outreach"
                                        ? "outreach"
                                        : header === "reachable"
                                          ? "reachable"
                                          : header === "follow up needed" ||
                                              header === "followup needed" ||
                                              header === "follow up" ||
                                              header === "followup"
                                            ? "followUpNeeded"
                                            : header === "next follow up" ||
                                                header === "nextfollowup"
                                              ? "nextFollowUp"
                                            : header === "stages"
                                              ? "stages"
                                              : header === "temperature"
                                                ? "temperature"
                                                : header === "comment" ||
                                                    header === "summary of call" ||
                                                    header === "comment summary of call"
                                                  ? "comment"
                                                  : undefined;

    if (canonical && !headerMap.has(canonical)) {
      headerMap.set(canonical, i);
    }
  }

  const get = (cells: unknown[], key: string): unknown => {
    const index = headerMap.get(key);
    return index === undefined ? "" : cells[index];
  };
  const getText = (cells: unknown[], key: string) => String(get(cells, key) ?? "").trim();

  const leads: NewLead[] = [];
  const sourceRows: number[] = [];
  let invalidEmails = 0;

  for (const [index, cells] of rows.slice(1).entries()) {
    const rowValues = {
      date: get(cells, "date"),
      company: getText(cells, "company"),
      country: getText(cells, "country"),
      companyType: getText(cells, "companyType"),
      contactPerson: getText(cells, "contactPerson"),
      decisionMaker: getText(cells, "decisionMaker"),
      gender: getText(cells, "gender"),
      email: getText(cells, "email"),
      phone: getText(cells, "phone"),
      role: getText(cells, "role"),
      linkedin: getText(cells, "linkedin"),
      city: getText(cells, "city"),
      status: getText(cells, "status"),
      notes: getText(cells, "notes"),
      outreach: getText(cells, "outreach"),
      reachable: getText(cells, "reachable"),
      followUp: getText(cells, "followUp"),
      followUpNeeded: getText(cells, "followUpNeeded"),
      nextFollowUp: getText(cells, "nextFollowUp"),
      stages: getText(cells, "stages"),
      temperature: getText(cells, "temperature"),
      comment: getText(cells, "comment"),
    };

    const hasAnyValue = Object.values(rowValues).some((value) => Boolean(value));
    if (!hasAnyValue) {
      continue;
    }

    const notes = buildNotes({
      ...rowValues,
      comment: rowValues.comment || rowValues.notes,
    });
    const parsedDate = parseIsoDate(rowValues.date);
    const statusValue =
      normalizeStatus(rowValues.status) ??
      normalizeStatus(rowValues.stages) ??
      normalizeStatus(rowValues.outreach) ??
      "Not Contacted";

    const contactPerson = firstNonEmpty(rowValues.contactPerson, rowValues.decisionMaker) ?? "";
    const emailCandidates = rowValues.email
      .split(/[;,]/)
      .map((candidate) => candidate.trim())
      .filter(Boolean);
    const validEmails = emailCandidates.filter((candidate) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate),
    );
    const email = validEmails[0] ?? "";
    invalidEmails += emailCandidates.length - validEmails.length;
    const phone = rowValues.phone || "";
    const rawCompanyType = rowValues.companyType;
    const country = rowValues.country;

    const nextFollowUp = parseIsoDate(
      rowValues.nextFollowUp || rowValues.followUp || rowValues.followUpNeeded,
    );
    const temperature = rowValues.temperature.trim().toLowerCase();
    const followUpValue = rowValues.followUpNeeded.trim().toLowerCase();
    const followUpNeeded =
      ["yes", "y", "true", "1"].includes(followUpValue) ||
      (!["no", "n", "false", "0"].includes(followUpValue) && Boolean(nextFollowUp));

    leads.push({
      company: rowValues.company,
      contactPerson: String(contactPerson).trim(),
      role: rowValues.role || "",
      email,
      phone,
      linkedin: rowValues.linkedin || "",
      country,
      city: rowValues.city || "",
      website: "",
      companyType: rawCompanyType,
      status: statusValue,
      temperature:
        temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Cold",
      followUpNeeded,
      notes,
      lastContacted: parsedDate,
      nextFollowUp,
    });
    sourceRows.push(index + 2);
  }

  return { leads, sourceRows, skipped: 0, invalidEmails };
}

export async function fileToLeads(file: File): Promise<ImportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    return csvToLeads(await file.text());
  }
  if (extension !== "xlsx" && extension !== "xls") {
    throw new Error("Unsupported file type. Upload a CSV, XLSX, or XLS file.");
  }

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!firstSheet) {
    throw new Error("The workbook does not contain a readable worksheet.");
  }

  const rows = XLSX.utils
    .sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      defval: "",
      blankrows: true,
      raw: true,
      dateNF: "yyyy-mm-dd",
    })
    .map((row) => row.map((cell) => cell ?? ""));

  return rowsToLeads(rows);
}

export const csvTemplate = HEADERS.join(",");
