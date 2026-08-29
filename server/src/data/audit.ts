import type { AuditEntry } from "../types";

export const auditLog: AuditEntry[] = [
  {
    id: "AUD-001",
    action: "acknowledge",
    operator: "Team SixthSense",
    timestamp: "2024-05-26T04:20:00Z",
    details: { conjunctionId: "CD-2024-0528-0420", action: "acknowledged" },
  },
  {
    id: "AUD-002",
    action: "watchlist_add",
    operator: "Team SixthSense",
    timestamp: "2024-05-26T03:15:00Z",
    details: { conjunctionId: "CD-2024-0526-0418", action: "added_to_watchlist" },
  },
  {
    id: "AUD-003",
    action: "plan_submit",
    operator: "Team SixthSense",
    timestamp: "2024-05-26T02:45:00Z",
    details: { planId: "MAN-001", action: "submitted_for_approval" },
  },
];
