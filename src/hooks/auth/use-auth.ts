import { useMemo } from "react";
import { getAccessToken } from "@/api/token";
import {
  useCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "@/services/auth/auth.queries";

export function useAuth() {
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken());
  const currentUser = useCurrentUserQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  const isAuthenticated = Boolean(currentUser.data);
  const isLoading =
    (hasToken && (currentUser.isLoading || currentUser.isFetching)) ||
    loginMutation.isPending ||
    registerMutation.isPending;

  return useMemo(
    () => ({
      user: currentUser.data ?? null,
      isAuthenticated,
      isLoading,
      isError: currentUser.isError,
      error: currentUser.error,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      loginError: loginMutation.error,
      registerError: registerMutation.error,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      refetchUser: currentUser.refetch,
    }),
    [
      currentUser.data,
      currentUser.isError,
      currentUser.error,
      currentUser.refetch,
      isAuthenticated,
      isLoading,
      loginMutation.mutateAsync,
      loginMutation.error,
      loginMutation.isPending,
      registerMutation.mutateAsync,
      registerMutation.error,
      registerMutation.isPending,
      logoutMutation.mutateAsync,
    ],
  );
}

export function useLogin() {
  const auth = useAuth();
  return {
    login: auth.login,
    isLoading: auth.isLoggingIn,
    error: auth.loginError,
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
  };
}

export function useRegister() {
  const auth = useAuth();
  return {
    register: auth.register,
    isLoading: auth.isRegistering,
    error: auth.registerError,
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
  };
}

export function useLogout() {
  const auth = useAuth();
  return {
    logout: auth.logout,
    isLoading: false,
  };
}

export function useCurrentUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isError: auth.isError,
    error: auth.error,
    refetch: auth.refetchUser,
  };
}
