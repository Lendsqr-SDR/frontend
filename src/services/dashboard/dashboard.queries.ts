import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/api/token";
import { DashboardService } from "./dashboard.service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => DashboardService.getSummary(),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
  });
}
