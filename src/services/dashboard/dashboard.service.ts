import { api, unwrapData } from "@/api/api";
import type { ApiSuccess } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard/dashboard.types";

export const DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return unwrapData(api.get<ApiSuccess<DashboardSummary>>("/dashboard"));
  },
};
