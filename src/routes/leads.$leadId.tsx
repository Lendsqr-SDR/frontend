/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Building2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLead } from "@/hooks/leads/use-leads";
import { LEAD_STATUSES, type LeadStatus, type OutreachChannel } from "@/types/leads/leads.types";
import { formatDate, relativeDay, todayISO } from "@/lib/date-utils";

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead details — Lendsqr SDR Tracker" },
      {
        name: "description",
        content:
          "Company profile, contact details, outreach history and follow-up scheduling for a single lead.",
      },
      { property: "og:title", content: "Lead details — Lendsqr SDR Tracker" },
      {
        property: "og:description",
        content: "Company profile, outreach history and follow-ups for a single lead.",
      },
    ],
  }),
  component: LeadDetailRoute,
});

function LeadDetailRoute() {
  return (
    <ProtectedRoute>
      <LeadDetail />
    </ProtectedRoute>
  );
}

const CHANNELS: OutreachChannel[] = ["Email", "Call", "LinkedIn", "WhatsApp", "Meeting"];

function externalUrl(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function Field({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-sm text-primary underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="break-all text-sm text-foreground">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

function LeadDetail() {
  const { leadId } = Route.useParams();
  const {
    lead,
    activities,
    isLoading,
    notFound,
    changeStatus,
    addNote,
    logOutreach,
    scheduleFollowUp,
    isMutating,
  } = useLead(leadId);

  const [statusOpen, setStatusOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  const [nextStatus, setNextStatus] = useState<LeadStatus>("Contacted");
  const [note, setNote] = useState("");
  const [channel, setChannel] = useState<OutreachChannel>("Email");
  const [summary, setSummary] = useState("");
  const [outreachDate, setOutreachDate] = useState(todayISO());
  const [followUpDate, setFollowUpDate] = useState(todayISO());

  if (isLoading) {
    return (
      <AppShell title="Lead details">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (notFound || !lead) {
    return (
      <AppShell title="Lead not found">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">This lead no longer exists.</p>
            <Button asChild className="mt-4">
              <Link to="/leads">Back to leads</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const history = [...activities].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell
      title={lead.company}
      description={`${lead.contactPerson} · ${lead.role}`}
      actions={
        <>
          <LeadFormDialog
            lead={lead}
            trigger={<Button variant="outline" size="sm">Edit details</Button>}
          />
          <Button asChild variant="ghost" size="sm">
            <Link to="/leads">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Company information</CardTitle>
              <StatusBadge status={lead.status} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field icon={Building2} label="Company" value={lead.company} />
              <Field icon={Building2} label="Company type" value={lead.companyType} />
              <Field icon={MapPin} label="Location" value={`${lead.city}, ${lead.country}`} />
              <Field icon={Building2} label="Lead temperature" value={lead.temperature} />
              <Field
                icon={CalendarClock}
                label="Follow-up needed"
                value={lead.followUpNeeded ? "Yes" : "No"}
              />
              <Field
                icon={Globe}
                label="Website"
                value={lead.website}
                href={externalUrl(lead.website)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Contact information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field icon={Mail} label="Email" value={lead.email} />
              <Field icon={Phone} label="Phone" value={lead.phone} />
              <Field
                icon={Linkedin}
                label="LinkedIn"
                value={lead.linkedin}
                href={externalUrl(lead.linkedin)}
              />
              <Field icon={Building2} label="Role" value={lead.role} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {lead.notes || "No notes yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Outreach history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className="mt-0.5 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {a.channel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outreach logged yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current status</span>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last contacted</span>
                <span>{formatDate(lead.lastContacted)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next follow-up</span>
                <span>
                  {formatDate(lead.nextFollowUp)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {lead.nextFollowUp ? relativeDay(lead.nextFollowUp) : ""}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isMutating}>
                    Change status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change status</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={nextStatus}
                      onValueChange={(v) => setNextStatus(v as LeadStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isMutating}
                      onClick={async () => {
                        try {
                          await changeStatus(nextStatus);
                          setStatusOpen(false);
                          toast.success(`Status updated to ${nextStatus}`);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isMutating}>
                    Add note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add note</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Add background or context to this lead. To record an actual touchpoint, use
                      Log outreach.
                    </p>
                  </DialogHeader>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What did you learn about this lead?"
                    rows={4}
                  />
                  <DialogFooter>
                    <Button
                      disabled={!note.trim() || isMutating}
                      onClick={async () => {
                        try {
                          await addNote(note.trim());
                          setNote("");
                          setNoteOpen(false);
                          toast.success("Note added");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to add note");
                        }
                      }}
                    >
                      Save note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isMutating}>
                    Log outreach
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log outreach</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Record a dated email, call, LinkedIn message, WhatsApp, or meeting. Use
                      Add note for general lead context.
                    </p>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select
                        value={channel}
                        onValueChange={(v) => setChannel(v as OutreachChannel)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={outreachDate}
                        onChange={(e) => setOutreachDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Summary</Label>
                      <Textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Sent pricing deck to Head of Credit"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!summary.trim() || isMutating}
                      onClick={async () => {
                        try {
                          await logOutreach({
                            channel,
                            summary: summary.trim(),
                            date: outreachDate,
                          });
                          setSummary("");
                          setOutreachOpen(false);
                          toast.success("Outreach logged");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed to log outreach",
                          );
                        }
                      }}
                    >
                      Log outreach
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={followUpOpen}
                onOpenChange={(open) => {
                  setFollowUpOpen(open);
                  if (open) setFollowUpDate(lead.nextFollowUp ?? todayISO());
                }}
              >
                <DialogTrigger asChild>
                  <Button disabled={isMutating}>Schedule follow-up</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule follow-up</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Follow-up date</Label>
                    <Input
                      type="date"
                      value={followUpDate}
                      required
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!followUpDate || isMutating}
                      onClick={async () => {
                        try {
                          await scheduleFollowUp(followUpDate);
                          setFollowUpOpen(false);
                          toast.success("Follow-up scheduled");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed to schedule follow-up",
                          );
                        }
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
