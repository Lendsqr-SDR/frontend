import { api, unwrapData } from "@/api/api";
import type { ApiSuccess } from "@/types/api";
import type {
  Activity,
  ActivityInput,
  Lead,
  LeadInput,
  LeadListQuery,
  LeadListResponse,
  LeadPatch,
  LeadStatus,
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
    return unwrapData(
      api.get<ApiSuccess<LeadListResponse>>(`/leads${toSearchParams(query)}`),
    );
  },

  async getById(id: string): Promise<Lead> {
    return unwrapData(api.get<ApiSuccess<Lead>>(`/leads/${id}`));
  },

  async create(input: LeadInput): Promise<Lead> {
    return unwrapData(api.post<ApiSuccess<Lead>>("/leads", input));
  },

  async bulkCreate(leads: LeadInput[]): Promise<Lead[]> {
    return unwrapData(
      api.post<ApiSuccess<Lead[]>>("/leads/bulk", { leads }),
    );
  },

  async update(id: string, patch: LeadPatch): Promise<Lead> {
    return unwrapData(api.patch<ApiSuccess<Lead>>(`/leads/${id}`, patch));
  },

  async remove(id: string): Promise<void> {
    await unwrapData(api.delete(`/leads/${id}`));
  },

  async listAllActivities(): Promise<Activity[]> {
    return unwrapData(
      api.get<ApiSuccess<Activity[]>>("/leads/activities"),
    );
  },

  async listActivities(leadId: string): Promise<Activity[]> {
    return unwrapData(
      api.get<ApiSuccess<Activity[]>>(`/leads/${leadId}/activities`),
    );
  },

  async addActivity(leadId: string, input: ActivityInput): Promise<Activity> {
    return unwrapData(
      api.post<ApiSuccess<Activity>>(`/leads/${leadId}/activities`, input),
    );
  },

  async changeStatus(id: string, status: LeadStatus): Promise<Lead> {
    return unwrapData(
      api.patch<ApiSuccess<Lead>>(`/leads/${id}/status`, { status }),
    );
  },

  async addNote(id: string, note: string): Promise<Lead> {
    return unwrapData(
      api.post<ApiSuccess<Lead>>(`/leads/${id}/notes`, { note }),
    );
  },

  async scheduleFollowUp(id: string, date: string): Promise<Lead> {
    return unwrapData(
      api.patch<ApiSuccess<Lead>>(`/leads/${id}/follow-up`, { date }),
    );
  },
};
