import type { FeedEvent } from "../types";

export const feedEvents: FeedEvent[] = [
  {
    id: "EVT-001",
    type: "alert",
    message: "Conjunction Alert: SAT-51656 ↔ OBJ-8821",
    severity: "critical",
    timestamp: "2024-05-26T04:30:00Z",
    satelliteId: "SAT-51656",
    objectId: "OBJ-8821",
  },
  {
    id: "EVT-002",
    type: "tracking",
    message: "Tracking Update: OBJ-3421",
    severity: "medium",
    timestamp: "2024-05-26T04:25:00Z",
    objectId: "OBJ-3421",
  },
  {
    id: "EVT-003",
    type: "maneuver",
    message: "Maneuver Completed: SAT-40930",
    severity: "low",
    timestamp: "2024-05-26T04:14:00Z",
    satelliteId: "SAT-40930",
  },
  {
    id: "EVT-004",
    type: "tle",
    message: "New TLE Data Received",
    severity: "info",
    timestamp: "2024-05-26T04:11:00Z",
  },
  {
    id: "EVT-005",
    type: "weather",
    message: "Weather Update: KSAT Ground Station",
    severity: "low",
    timestamp: "2024-05-26T04:00:00Z",
  },
];
