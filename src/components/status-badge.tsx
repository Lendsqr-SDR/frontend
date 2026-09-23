import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/leads/leads.types";

const TOKENS: Record<LeadStatus, string> = {
  "Not Contacted": "neutral",
  Contacted: "info",
  "Follow-up": "warning",
  Responded: "teal",
  Interested: "purple",
  Meeting: "info",
  Won: "success",
  "Not Interested": "danger",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const token = TOKENS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{
        color: `var(--status-${token})`,
        backgroundColor: `var(--status-${token}-bg)`,
      }}
    >
      {status}
    </span>
  );
}
