import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAccessToken } from "@/api/token";
import { dashboardKeys } from "@/services/dashboard/dashboard.queries";
import { LeadsService } from "./leads.service";
import type {
  ActivityInput,
  LeadInput,
  LeadListQuery,
  LeadPatch,
  LeadStatus,
} from "@/types/leads/leads.types";

export const leadsKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsKeys.all, "list"] as const,
  list: (query: LeadListQuery) => [...leadsKeys.lists(), query] as const,
  details: () => [...leadsKeys.all, "detail"] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
  activities: () => [...leadsKeys.all, "activities"] as const,
  allActivities: () => [...leadsKeys.activities(), "all"] as const,
  leadActivities: (id: string) => [...leadsKeys.activities(), id] as const,
};

function invalidateLeadQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: leadsKeys.all });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}

export function useLeadsQuery(query: LeadListQuery = {}) {
  return useQuery({
    queryKey: leadsKeys.list(query),
    queryFn: () => LeadsService.list(query),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
  });
}

export function useLeadQuery(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => LeadsService.getById(id),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()) && Boolean(id),
  });
}

export function useAllActivitiesQuery() {
  return useQuery({
    queryKey: leadsKeys.allActivities(),
    queryFn: () => LeadsService.listAllActivities(),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
  });
}

export function useLeadActivitiesQuery(leadId: string) {
  return useQuery({
    queryKey: leadsKeys.leadActivities(leadId),
    queryFn: () => LeadsService.listActivities(leadId),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()) && Boolean(leadId),
  });
}

export function useBulkCreateLeadsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leads: LeadInput[]) => LeadsService.bulkCreate(leads),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LeadPatch }) =>
      LeadsService.update(id, patch),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LeadsService.remove(id),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useChangeStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      LeadsService.changeStatus(id, status),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useAddNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      LeadsService.addNote(id, note),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useAddActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      input,
    }: {
      leadId: string;
      input: ActivityInput;
    }) => LeadsService.addActivity(leadId, input),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}

export function useScheduleFollowUpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      LeadsService.scheduleFollowUp(id, date),
    onSuccess: () => invalidateLeadQueries(queryClient),
  });
}
