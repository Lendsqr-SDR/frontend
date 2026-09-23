import {
  useAddActivityMutation,
  useAddNoteMutation,
  useAllActivitiesQuery,
  useBulkCreateLeadsMutation,
  useChangeStatusMutation,
  useDeleteLeadMutation,
  useLeadActivitiesQuery,
  useLeadQuery,
  useLeadsQuery,
  useScheduleFollowUpMutation,
} from "@/services/leads/leads.queries";
import type {
  ActivityInput,
  LeadInput,
  LeadListQuery,
  LeadStatus,
} from "@/types/leads/leads.types";

export function useLeads(query: LeadListQuery = {}) {
  const listQuery = useLeadsQuery(query);
  return {
    leads: listQuery.data?.items ?? [],
    pagination: listQuery.data?.pagination ?? null,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
  };
}

export function useLead(id: string) {
  const leadQuery = useLeadQuery(id);
  const activitiesQuery = useLeadActivitiesQuery(id);
  const changeStatus = useChangeStatusMutation();
  const addNote = useAddNoteMutation();
  const addActivity = useAddActivityMutation();
  const scheduleFollowUp = useScheduleFollowUpMutation();
  const remove = useDeleteLeadMutation();

  return {
    lead: leadQuery.data ?? null,
    activities: activitiesQuery.data ?? [],
    isLoading: leadQuery.isLoading || activitiesQuery.isLoading,
    isError: leadQuery.isError,
    error: leadQuery.error,
    notFound: leadQuery.isError,
    changeStatus: (status: LeadStatus) => changeStatus.mutateAsync({ id, status }),
    addNote: (note: string) => addNote.mutateAsync({ id, note }),
    logOutreach: (input: ActivityInput) => addActivity.mutateAsync({ leadId: id, input }),
    scheduleFollowUp: (date: string) => scheduleFollowUp.mutateAsync({ id, date }),
    deleteLead: () => remove.mutateAsync(id),
    isMutating:
      changeStatus.isPending ||
      addNote.isPending ||
      addActivity.isPending ||
      scheduleFollowUp.isPending ||
      remove.isPending,
  };
}

export function useImportLeads() {
  const mutation = useBulkCreateLeadsMutation();
  return {
    importLeads: (leads: LeadInput[]) => mutation.mutateAsync(leads),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useFollowUps() {
  const { leads, isLoading, isError, error, refetch } = useLeads({
    page: 1,
    pageSize: 100,
    sort: "nextFollowUp",
    direction: "asc",
  });

  return {
    leads: leads.filter((l) => l.nextFollowUp),
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useAllActivities() {
  const query = useAllActivitiesQuery();
  return {
    activities: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
