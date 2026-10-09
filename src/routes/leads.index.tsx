import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Upload, Search, ArrowUpDown, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportLeads, useLeads } from "@/hooks/leads/use-leads";
import { LEAD_STATUSES, type LeadSortField, type LeadStatus } from "@/types/leads/leads.types";
import { formatDate } from "@/lib/date-utils";
import { downloadCsv, fileToLeads, leadsToCsv } from "@/lib/excel";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — Lendsqr SDR Tracker" },
      {
        name: "description",
        content:
          "Search, filter and manage every MFB and lending-company lead in the Lendsqr outreach pipeline.",
      },
      { property: "og:title", content: "Leads — Lendsqr SDR Tracker" },
      {
        property: "og:description",
        content: "Search, filter and manage every lead in the outreach pipeline.",
      },
    ],
  }),
  component: LeadsRoute,
});

function LeadsRoute() {
  return (
    <ProtectedRoute>
      <LeadsPage />
    </ProtectedRoute>
  );
}

const PAGE_SIZE = 25;

function LeadsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [sort, setSort] = useState<LeadSortField>("company");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const listQuery = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status === "all" ? {} : { status: status as LeadStatus }),
      ...(country === "all" ? {} : { country }),
      page,
      pageSize: PAGE_SIZE,
      sort,
      direction,
    }),
    [search, status, country, page, sort, direction],
  );

  const { leads, pagination, isLoading, isError, error, refetch } = useLeads(listQuery);
  const { importLeads, isLoading: isImporting } = useImportLeads();

  const countries = useMemo(() => {
    const fromRows = Array.from(new Set(leads.map((l) => l.country))).sort();
    return Array.from(new Set(["Nigeria", "Ghana", ...fromRows]));
  }, [leads]);

  const toggleSort = (key: LeadSortField) => {
    if (sort === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection("asc");
    }
    setPage(1);
  };

  const onExport = () => {
    downloadCsv(`lendsqr-leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(leads));
    toast.success(`Exported ${leads.length} leads to Excel (CSV)`);
  };

  const onImport = async (file: File) => {
    try {
      const { leads: parsed, sourceRows, skipped, invalidEmails } = await fileToLeads(file);
      if (parsed.length === 0) {
        toast.error("No valid rows found. Use the required column structure.");
        return;
      }
      const result = await importLeads(parsed, sourceRows);
      const total = result.total + skipped;
      const skippedTotal = result.skipped + skipped;
      const invalidEmailTotal = result.invalidEmails + invalidEmails;
      toast.success(
        `Import complete: ${total} rows, ${result.imported} imported, ${skippedTotal} skipped, ${invalidEmailTotal} invalid email values.`,
      );
      if (result.errors.length) {
        const examples = result.errors
          .slice(0, 3)
          .map((item) => `Row ${item.row}: ${item.reason}`)
          .join(" ");
        const remaining = result.errors.length > 3 ? ` And ${result.errors.length - 3} more.` : "";
        toast.error(`${examples}${remaining}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const SortHead = ({
    label,
    keyName,
    className,
  }: {
    label: string;
    keyName: LeadSortField;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        onClick={() => toggleSort(keyName)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );

  const total = pagination?.total ?? 0;
  const pageCount = pagination?.totalPages ?? 1;

  return (
    <AppShell
      title="Leads"
      description={`${total} companies in the pipeline`}
      actions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImport(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={isImporting}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> Import file
          </Button>
          <LeadFormDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Add lead
              </Button>
            }
          />
          <Button size="sm" onClick={onExport} disabled={leads.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company, contact, role or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={country}
              onValueChange={(v) => {
                setCountry(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : "Failed to load leads."}
                </p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <Table className="min-w-[1560px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <SortHead label="Company" keyName="company" className="w-48 whitespace-nowrap" />
                    <TableHead className="w-36 whitespace-nowrap text-xs font-semibold uppercase">
                      Contact person
                    </TableHead>
                    <TableHead className="w-32 whitespace-nowrap text-xs font-semibold uppercase">Role</TableHead>
                    <TableHead className="w-48 whitespace-nowrap text-xs font-semibold uppercase">Email</TableHead>
                    <TableHead className="w-28 whitespace-nowrap text-xs font-semibold uppercase">Country</TableHead>
                    <TableHead className="w-28 whitespace-nowrap text-xs font-semibold uppercase">
                      Temperature
                    </TableHead>
                    <TableHead className="w-32 whitespace-nowrap text-xs font-semibold uppercase">
                      Follow-up needed
                    </TableHead>
                    <TableHead className="w-36 whitespace-nowrap">
                      <button
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground"
                      >
                        Status <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-36 whitespace-nowrap">
                      <button
                        onClick={() => toggleSort("lastContacted")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground"
                      >
                        Last contacted <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-36 whitespace-nowrap">
                      <button
                        onClick={() => toggleSort("nextFollowUp")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground"
                      >
                        Next follow-up <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 whitespace-nowrap text-right text-xs font-semibold uppercase">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id} className="cursor-pointer">
                      <TableCell className="truncate font-medium" title={l.company}>
                        <Link
                          to="/leads/$leadId"
                          params={{ leadId: l.id }}
                          className="hover:underline"
                        >
                          <span className="block truncate">{l.company}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="truncate" title={l.contactPerson}>{l.contactPerson}</TableCell>
                      <TableCell className="truncate text-muted-foreground" title={l.role}>{l.role}</TableCell>
                      <TableCell className="truncate text-muted-foreground" title={l.email}>{l.email}</TableCell>
                      <TableCell className="truncate" title={l.country}>{l.country}</TableCell>
                      <TableCell className="whitespace-nowrap">{l.temperature}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {l.followUpNeeded ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(l.lastContacted)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(l.nextFollowUp)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/leads/$leadId" params={{ leadId: l.id }}>
                            <Eye className="size-4" /> View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No leads match your filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {leads.length} of {total} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {Math.max(1, pageCount)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
