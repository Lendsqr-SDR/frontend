import { api, unwrapData } from "@/api/api";
import type { ApiSuccess } from "@/types/api";
import type {
  Activity,
  ActivityInput,
  Lead,
  LeadImportResult,
  LeadInput,
  LeadListQuery,
  LeadListResponse,
  LeadPatch,
  LeadStatus,
  NewLead,
} from "@/types/leads/leads.types";

function toSearchParams(query: LeadListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.country) params.set("country", query.country);
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.sort) params.set("sort", query.sort);
  if (query.direction) params.set("direction", query.direction);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const LeadsService = {
  async list(query?: LeadListQuery): Promise<LeadListResponse> {
    return unwrapData(api.get<ApiSuccess<LeadListResponse>>(`/leads${toSearchParams(query)}`));
  },

  async listAllFollowUps(): Promise<Lead[]> {
    const firstPage = await LeadsService.list({
      page: 1,
      pageSize: 100,
      sort: "nextFollowUp",
      direction: "asc",
    });
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
        LeadsService.list({
          page: index + 2,
          pageSize: 100,
          sort: "nextFollowUp",
          direction: "asc",
        }),
      ),
    );
    return [firstPage, ...remainingPages].flatMap((page) => page.items);
  },

  async getById(id: string): Promise<Lead> {
    return unwrapData(api.get<ApiSuccess<Lead>>(`/leads/${id}`));
  },

  async create(input: LeadInput): Promise<Lead> {
    return unwrapData(api.post<ApiSuccess<Lead>>("/leads", input));
  },

  async bulkCreate(leads: LeadInput[]): Promise<Lead[]> {
    const created: Lead[] = [];
    const batchSize = 500;

    for (let offset = 0; offset < leads.length; offset += batchSize) {
      const batch = leads.slice(offset, offset + batchSize);
      const batchCreated = await unwrapData(
        api.post<ApiSuccess<Lead[]>>("/leads/bulk", { leads: batch }),
      );
      created.push(...batchCreated);
    }

    return created;
  },

  async importLeads(leads: NewLead[], sourceRows: number[]): Promise<LeadImportResult> {
    const result: LeadImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      invalidEmails: 0,
      errors: [],
    };
    const batchSize = 500;

    for (let offset = 0; offset < leads.length; offset += batchSize) {
      const batch = leads.slice(offset, offset + batchSize);
      const data = await unwrapData(
        api.post<ApiSuccess<LeadImportResult>>("/leads/import", {
          rows: batch.map((lead, index) => ({
            row: sourceRows[offset + index] ?? offset + index + 2,
            lead,
          })),
        }),
      );
      result.total += data.total;
      result.imported += data.imported;
      result.skipped += data.skipped;
      result.invalidEmails += data.invalidEmails;
      result.errors.push(...data.errors);
    }

    return result;
  },

  async update(id: string, patch: LeadPatch): Promise<Lead> {
    return unwrapData(api.patch<ApiSuccess<Lead>>(`/leads/${id}`, patch));
  },

  async remove(id: string): Promise<void> {
    await unwrapData(api.delete(`/leads/${id}`));
  },

  async listAllActivities(): Promise<Activity[]> {
    return unwrapData(api.get<ApiSuccess<Activity[]>>("/leads/activities"));
  },

  async listActivities(leadId: string): Promise<Activity[]> {
    return unwrapData(api.get<ApiSuccess<Activity[]>>(`/leads/${leadId}/activities`));
  },

  async addActivity(leadId: string, input: ActivityInput): Promise<Activity> {
    return unwrapData(api.post<ApiSuccess<Activity>>(`/leads/${leadId}/activities`, input));
  },

  async changeStatus(id: string, status: LeadStatus): Promise<Lead> {
    return unwrapData(api.patch<ApiSuccess<Lead>>(`/leads/${id}/status`, { status }));
  },

  async addNote(id: string, note: string): Promise<Lead> {
    return unwrapData(api.post<ApiSuccess<Lead>>(`/leads/${id}/notes`, { note }));
  },

  async scheduleFollowUp(id: string, date: string): Promise<Lead> {
    return unwrapData(api.patch<ApiSuccess<Lead>>(`/leads/${id}/follow-up`, { date }));
  },
};
