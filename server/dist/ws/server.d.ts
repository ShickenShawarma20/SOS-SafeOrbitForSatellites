import { WebSocketServer } from "ws";
import { Server } from "http";
export declare function setupWebSocket(server: Server): WebSocketServer;
export declare function broadcast(event: string, payload: unknown, channel?: string): void;
export declare function broadcastJobProgress(jobId: string, pct: number, stage: string): void;
export declare function broadcastConjunctionUpdate(conjunction: unknown): void;
export declare function broadcastTelemetry(satId: string, telemetry: unknown): void;
export declare function broadcastFeedEvent(event: unknown): void;
export declare function broadcastWeatherUpdate(weather: unknown): void;
export declare function broadcastNetworkStatus(status: unknown): void;
export declare function broadcastManeuverStatus(maneuver: unknown): void;
//# sourceMappingURL=server.d.ts.map