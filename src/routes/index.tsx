/* eslint-disable prettier/prettier */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/auth/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Lendsqr SDR Tracker" }],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
