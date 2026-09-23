import { useDashboardSummaryQuery } from "@/services/dashboard/dashboard.queries";
import { useLeadsQuery } from "@/services/leads/leads.queries";
import type { OutreachChannel } from "@/types/leads/leads.types";
import type { DashboardActivityChannel } from "@/types/dashboard/dashboard.types";

const CHANNEL_UI: Record<DashboardActivityChannel, OutreachChannel> = {
  EMAIL: "Email",
  CALL: "Call",
  LINKEDIN: "LinkedIn",
  WHATSAPP: "WhatsApp",
  MEETING: "Meeting",
  NOTE: "Note",
};

export function useDashboard() {
  const summaryQuery = useDashboardSummaryQuery();
  const leadsQuery = useLeadsQuery({
    page: 1,
    pageSize: 100,
    sort: "nextFollowUp",
    direction: "asc",
  });

  const leads = leadsQuery.data?.items ?? [];

  const recentActivities =
    summaryQuery.data?.recentActivities.map((a) => ({
      id: a.id,
      leadId: a.leadId,
      channel: CHANNEL_UI[a.channel] ?? ("Note" as OutreachChannel),
      summary: a.summary,
      date: a.occurredAt.slice(0, 10),
      company: leads.find((l) => l.id === a.leadId)?.company ?? null,
    })) ?? [];

  const upcomingFollowUps = leads.filter((l) => l.nextFollowUp).slice(0, 6);

  return {
    summary: summaryQuery.data ?? null,
    recentActivities,
    upcomingFollowUps,
    isLoading: summaryQuery.isLoading || leadsQuery.isLoading,
    isError: summaryQuery.isError || leadsQuery.isError,
    error: summaryQuery.error ?? leadsQuery.error,
    refetch: () => {
      void summaryQuery.refetch();
      void leadsQuery.refetch();
    },
  };
}
