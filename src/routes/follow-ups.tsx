/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowUps } from "@/hooks/leads/use-leads";
import { daysFromToday, formatDate, relativeDay } from "@/lib/date-utils";
import type { Lead } from "@/types/leads/leads.types";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Lendsqr SDR Tracker" },
      {
        name: "description",
        content:
          "Follow-ups due today, overdue and upcoming for the Lendsqr sales development team.",
      },
      { property: "og:title", content: "Follow-ups — Lendsqr SDR Tracker" },
      {
        property: "og:description",
        content: "Follow-ups due today, overdue and upcoming.",
      },
    ],
  }),
  component: FollowUpsRoute,
});

function FollowUpsRoute() {
  return (
    <ProtectedRoute>
      <FollowUps />
    </ProtectedRoute>
  );
}

function FollowUpList({ leads, empty }: { leads: Lead[]; empty: string }) {
  if (leads.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="divide-y divide-border">
      {leads.map((l) => (
        <Link
          key={l.id}
          to="/leads/$leadId"
          params={{ leadId: l.id }}
          className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/60"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{l.company}</p>
            <p className="truncate text-xs text-muted-foreground">
              {l.contactPerson} · {l.role} · {l.country}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-foreground">{formatDate(l.nextFollowUp)}</p>
              <p className="text-xs text-muted-foreground">{relativeDay(l.nextFollowUp)}</p>
            </div>
            <StatusBadge status={l.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function FollowUps() {
  const { leads, isLoading, isError, error, refetch } = useFollowUps();

  const scheduled = leads
    .filter((lead) => lead.nextFollowUp)
    .sort((a, b) =>
    a.nextFollowUp! < b.nextFollowUp! ? -1 : 1,
    );

  const overdue = scheduled.filter((l) => (daysFromToday(l.nextFollowUp) ?? 0) < 0);
  const dueToday = scheduled.filter((l) => daysFromToday(l.nextFollowUp) === 0);
  const upcoming = scheduled.filter((l) => (daysFromToday(l.nextFollowUp) ?? 0) > 0);
  const needsScheduling = leads.filter((lead) => lead.followUpNeeded && !lead.nextFollowUp);

  return (
    <AppShell title="Follow-ups" description="Stay on top of every scheduled touchpoint">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load follow-ups."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Needs scheduling</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {needsScheduling.length}
              </span>
            </CardHeader>
            <CardContent>
              <FollowUpList
                leads={needsScheduling}
                empty="No leads are waiting for a follow-up date."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Overdue</CardTitle>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: "var(--status-danger)",
                  backgroundColor: "var(--status-danger-bg)",
                }}
              >
                {overdue.length}
              </span>
            </CardHeader>
            <CardContent>
              <FollowUpList leads={overdue} empty="Nothing overdue. Nice work." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Due today</CardTitle>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: "var(--status-warning)",
                  backgroundColor: "var(--status-warning-bg)",
                }}
              >
                {dueToday.length}
              </span>
            </CardHeader>
            <CardContent>
              <FollowUpList leads={dueToday} empty="No follow-ups due today." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: "var(--status-info)",
                  backgroundColor: "var(--status-info-bg)",
                }}
              >
                {upcoming.length}
              </span>
            </CardHeader>
            <CardContent>
              <FollowUpList leads={upcoming} empty="No upcoming follow-ups scheduled." />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
