/** Raw activity row from GET /dashboard (DB enums + ISO datetimes). */
export type DashboardActivityChannel =
  | "EMAIL"
  | "CALL"
  | "LINKEDIN"
  | "WHATSAPP"
  | "MEETING"
  | "NOTE";

export interface DashboardRecentActivity {
  id: string;
  leadId: string;
  authorId: string | null;
  channel: DashboardActivityChannel;
  summary: string;
  occurredAt: string;
  createdAt: string;
}

export interface DashboardSummary {
  total: number;
  contacted: number;
  interested: number;
  meetings: number;
  won: number;
  followUpsDue: number;
  recentActivities: DashboardRecentActivity[];
}
