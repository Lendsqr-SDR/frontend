import { api, unwrapData } from "@/api/api";
import type { ApiSuccess } from "@/types/api";

export type OutreachSourceStatus = "connected" | "unavailable" | "error";

export interface OutreachSource {
  key: "google-drive" | "google-cloud-search";
  label: string;
  status: OutreachSourceStatus;
  message: string;
  resultCount: number;
}

export interface OutreachResult {
  id: string;
  companyName: string;
  subject: string;
  contact: string;
  date: string | null;
  source: string;
  snippet: string;
  url: string | null;
}

export interface OutreachSearchResponse {
  query: string;
  sources: OutreachSource[];
  results: OutreachResult[];
}

export const OutreachService = {
  async search(query: string, accessToken: string): Promise<OutreachSearchResponse> {
    const params = new URLSearchParams({ query });
    return unwrapData(
      api.get<ApiSuccess<OutreachSearchResponse>>(`/outreach/search?${params.toString()}`, {
        headers: { "X-Google-Access-Token": accessToken },
      }),
    );
  },
};
