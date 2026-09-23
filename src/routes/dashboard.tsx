import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Send, CalendarClock, Sparkles, CalendarCheck, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/dashboard/use-dashboard";
import { formatDate, relativeDay } from "@/lib/date-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lendsqr SDR Tracker" },
      {
        name: "description",
        content:
          "Pipeline overview for the Lendsqr sales development team: leads, outreach and follow-ups.",
      },
      { property: "og:title", content: "Dashboard — Lendsqr SDR Tracker" },
      {
        property: "og:description",
        content: "Pipeline overview for the Lendsqr sales development team.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    // <ProtectedRoute>
    //   <Dashboard />
    // </ProtectedRoute>
    <Dashboard />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { summary, recentActivities, upcomingFollowUps, isLoading, isError, error, refetch } =
    useDashboard();

  return (
    <AppShell title="Dashboard" description="Pipeline snapshot across Nigeria and Ghana">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load dashboard."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total leads"
              value={summary.total}
              icon={Users}
              hint="Across all statuses"
            />
            <StatCard
              label="Contacted"
              value={summary.contacted}
              icon={Send}
              hint="At least one outreach"
            />
            <StatCard
              label="Follow-ups due"
              value={summary.followUpsDue}
              icon={CalendarClock}
              hint="Today or overdue"
            />
            <StatCard label="Interested" value={summary.interested} icon={Sparkles} />
            <StatCard label="Meetings" value={summary.meetings} icon={CalendarCheck} />
            <StatCard label="Won" value={summary.won} icon={Trophy} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <span className="mt-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                      {a.channel}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{a.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        <Link
                          to="/leads/$leadId"
                          params={{ leadId: a.leadId }}
                          className="hover:underline"
                        >
                          {a.company ?? "View lead"}
                        </Link>{" "}
                        · {formatDate(a.date)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Next follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingFollowUps.map((l) => (
                  <Link
                    key={l.id}
                    to="/leads/$leadId"
                    params={{ leadId: l.id }}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{l.company}</p>
                      <p className="text-xs text-muted-foreground">{relativeDay(l.nextFollowUp)}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </Link>
                ))}
                {upcomingFollowUps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
