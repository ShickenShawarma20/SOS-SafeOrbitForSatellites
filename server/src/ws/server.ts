import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface WSClient {
  ws: WebSocket;
  subscriptions: Set<string>;
}

const clients: Map<WebSocket, WSClient> = new Map();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    const client: WSClient = { ws, subscriptions: new Set() };
    clients.set(ws, client);

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.subscribe && Array.isArray(msg.subscribe)) {
          msg.subscribe.forEach((ch: string) => client.subscriptions.add(ch));
          ws.send(JSON.stringify({ type: "subscribed", channels: msg.subscribe }));
        }
        if (msg.unsubscribe && Array.isArray(msg.unsubscribe)) {
          msg.unsubscribe.forEach((ch: string) => client.subscriptions.delete(ch));
        }
      } catch {
        ws.send(JSON.stringify({ error: { code: "INVALID_MESSAGE", message: "Invalid JSON" } }));
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: "connected", message: "SOS WebSocket connected" }));
  });

  return wss;
}

export function broadcast(event: string, payload: unknown, channel?: string): void {
  const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!channel || client.subscriptions.has(channel) || client.subscriptions.has("*")) {
        client.ws.send(data);
      }
    }
  });
}

export function broadcastJobProgress(jobId: string, pct: number, stage: string): void {
  broadcast("job.progress", { jobId, pct, stage }, "jobs");
}

export function broadcastConjunctionUpdate(conjunction: unknown): void {
  broadcast("conjunction.update", conjunction, "conjunction");
}

export function broadcastTelemetry(satId: string, telemetry: unknown): void {
  broadcast(`telemetry.${satId}`, telemetry, `telemetry.${satId}`);
}

export function broadcastFeedEvent(event: unknown): void {
  broadcast("event.feed", event, "events");
}

export function broadcastWeatherUpdate(weather: unknown): void {
  broadcast("weather.update", weather, "weather");
}

export function broadcastNetworkStatus(status: unknown): void {
  broadcast("network.status", status, "network");
}

export function broadcastManeuverStatus(maneuver: unknown): void {
  broadcast("maneuver.status", maneuver, "maneuver");
}
