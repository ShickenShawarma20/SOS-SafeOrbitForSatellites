import type { Notification } from "../types";

export const notifications: Notification[] = [
  {
    id: "NOT-001",
    type: "conjunction",
    message: "Critical conjunction detected: SAT-51656 ↔ OBJ-8821",
    severity: "critical",
    read: false,
    timestamp: "2024-05-26T04:30:00Z",
    link: "/conjunction.html?id=CD-2024-0526-0417",
  },
  {
    id: "NOT-002",
    type: "conjunction",
    message: "High-risk conjunction: SAT-44804 ↔ OBJ-3421",
    severity: "high",
    read: false,
    timestamp: "2024-05-26T03:15:00Z",
  },
  {
    id: "NOT-003",
    type: "maneuver",
    message: "Maneuver plan MAN-001 ready for review",
    severity: "info",
    read: false,
    timestamp: "2024-05-26T02:45:00Z",
  },
  {
    id: "NOT-004",
    type: "tle",
    message: "New TLE data received from KSAT Svalbard",
    severity: "info",
    read: true,
    timestamp: "2024-05-26T04:11:00Z",
  },
  {
    id: "NOT-005",
    type: "weather",
    message: "Kp index elevated to 4 — minor geomagnetic storm",
    severity: "medium",
    read: true,
    timestamp: "2024-05-26T03:00:00Z",
  },
];
