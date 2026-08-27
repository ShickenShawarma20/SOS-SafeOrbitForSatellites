"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groundStations = void 0;
/* Real ground stations used for satellite tracking and Telemetry, Tracking &
 * Command (TT&C) operations.  Coordinates are publicly available facility
 * locations (Wikipedia, agency websites, Space-Track).  Status is a prototype
 * indicator — "online" = active in the prototype, "offline" = maintenance.
 *
 * Includes ISRO's ISTRAC network, major NASA/DoD stations, ESA ESTRACK, and
 * commercial KSAT stations.
 */
exports.groundStations = [
    // ---- ISRO ISTRAC network ----
    { id: "GS-001", name: "Bengaluru", lat: 13.0, lon: 77.6, status: "online" },
    { id: "GS-002", name: "Lucknow", lat: 26.8, lon: 80.9, status: "online" },
    { id: "GS-003", name: "Sriharikota", lat: 13.7, lon: 80.2, status: "online" },
    { id: "GS-004", name: "Port Blair", lat: 11.6, lon: 92.7, status: "online" },
    { id: "GS-005", name: "Thiruvananthapuram", lat: 8.5, lon: 76.9, status: "online" },
    { id: "GS-006", name: "Brunei", lat: 4.9, lon: 114.9, status: "online" },
    { id: "GS-007", name: "Biak (Indonesia)", lat: -1.2, lon: 136.0, status: "online" },
    { id: "GS-008", name: "Mauritius", lat: -20.3, lon: 57.5, status: "online" },
    { id: "GS-009", name: "Kourou (ISRO)", lat: 5.2, lon: -52.8, status: "online" },
    // ---- Major NASA / DoD stations ----
    { id: "GS-010", name: "Svalbard", lat: 78.2, lon: 15.4, status: "online" },
    { id: "GS-011", name: "Fairbanks", lat: 64.8, lon: -147.7, status: "online" },
    { id: "GS-012", name: "Wallops", lat: 37.9, lon: -75.5, status: "online" },
    { id: "GS-013", name: "Cape Canaveral", lat: 28.4, lon: -80.6, status: "online" },
    { id: "GS-014", name: "Thule", lat: 76.5, lon: -68.7, status: "online" },
    { id: "GS-015", name: "Pine Gap", lat: -23.7, lon: 133.8, status: "online" },
    { id: "GS-016", name: "Diego Garcia", lat: -7.3, lon: 72.4, status: "online" },
    { id: "GS-017", name: "Kwajalein", lat: 9.4, lon: 167.7, status: "online" },
    { id: "GS-018", name: "Misawa", lat: 40.7, lon: 141.4, status: "online" },
    { id: "GS-019", name: "White Sands", lat: 32.5, lon: -106.6, status: "online" },
    { id: "GS-020", name: "Goldstone", lat: 35.4, lon: -116.9, status: "online" },
    // ---- ESA ESTRACK ----
    { id: "GS-021", name: "Kourou (ESA)", lat: 5.2, lon: -52.7, status: "online" },
    { id: "GS-022", name: "Cebreros", lat: 40.5, lon: -4.4, status: "online" },
    { id: "GS-023", name: "Malargüe", lat: -35.8, lon: -69.4, status: "online" },
    { id: "GS-024", name: "New Norcia", lat: -31.0, lon: 116.2, status: "online" },
    { id: "GS-025", name: "Santa Maria", lat: 36.9, lon: -25.2, status: "online" },
    // ---- KSAT (Kongsberg) commercial network ----
    { id: "GS-026", name: "Troll (Antarctica)", lat: -72.0, lon: 2.5, status: "online" },
    { id: "GS-027", name: "Svalbard KSAT", lat: 78.9, lon: 11.9, status: "online" },
    { id: "GS-028", name: "Puerto Rico", lat: 18.1, lon: -66.6, status: "online" },
    { id: "GS-029", name: "Singapore", lat: 1.4, lon: 103.8, status: "online" },
    { id: "GS-030", name: "Hawaii", lat: 21.3, lon: -157.8, status: "online" },
    { id: "GS-031", name: "Dubai", lat: 25.3, lon: 55.4, status: "online" },
    { id: "GS-032", name: "Buenos Aires", lat: -34.6, lon: -58.4, status: "online" },
    // ---- Additional global stations ----
    { id: "GS-033", name: "Santiago", lat: -33.4, lon: -70.7, status: "online" },
    { id: "GS-034", name: "Ascension", lat: -7.9, lon: -14.4, status: "online" },
    { id: "GS-035", name: "Nairobi", lat: -1.3, lon: 36.8, status: "offline" },
    { id: "GS-036", name: "Hartebeesthoek", lat: -25.9, lon: 27.7, status: "online" },
    { id: "GS-037", name: "Dongara", lat: -29.2, lon: 114.7, status: "online" },
    { id: "GS-038", name: "Pretoria", lat: -25.7, lon: 28.3, status: "offline" },
    { id: "GS-039", name: "Tokyo (JAXA)", lat: 35.7, lon: 139.4, status: "online" },
    { id: "GS-040", name: "Tanegashima", lat: 30.4, lon: 130.97, status: "online" },
];
//# sourceMappingURL=groundstations.js.map