import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/api/token";
import { AuthService } from "./auth.service";
import type { LoginRequest, RegisterRequest } from "@/types/auth/auth.types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => AuthService.getCurrentUser(),
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginRequest) => AuthService.login(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterRequest) => AuthService.register(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      AuthService.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.clear();
    },
  });
}
