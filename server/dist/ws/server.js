"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcast = broadcast;
exports.broadcastJobProgress = broadcastJobProgress;
exports.broadcastConjunctionUpdate = broadcastConjunctionUpdate;
exports.broadcastTelemetry = broadcastTelemetry;
exports.broadcastFeedEvent = broadcastFeedEvent;
exports.broadcastWeatherUpdate = broadcastWeatherUpdate;
exports.broadcastNetworkStatus = broadcastNetworkStatus;
exports.broadcastManeuverStatus = broadcastManeuverStatus;
const ws_1 = require("ws");
const clients = new Map();
function setupWebSocket(server) {
    const wss = new ws_1.WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (ws) => {
        const client = { ws, subscriptions: new Set() };
        clients.set(ws, client);
        ws.on("message", (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.subscribe && Array.isArray(msg.subscribe)) {
                    msg.subscribe.forEach((ch) => client.subscriptions.add(ch));
                    ws.send(JSON.stringify({ type: "subscribed", channels: msg.subscribe }));
                }
                if (msg.unsubscribe && Array.isArray(msg.unsubscribe)) {
                    msg.unsubscribe.forEach((ch) => client.subscriptions.delete(ch));
                }
            }
            catch {
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
function broadcast(event, payload, channel) {
    const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    clients.forEach((client) => {
        if (client.ws.readyState === ws_1.WebSocket.OPEN) {
            if (!channel || client.subscriptions.has(channel) || client.subscriptions.has("*")) {
                client.ws.send(data);
            }
        }
    });
}
function broadcastJobProgress(jobId, pct, stage) {
    broadcast("job.progress", { jobId, pct, stage }, "jobs");
}
function broadcastConjunctionUpdate(conjunction) {
    broadcast("conjunction.update", conjunction, "conjunction");
}
function broadcastTelemetry(satId, telemetry) {
    broadcast(`telemetry.${satId}`, telemetry, `telemetry.${satId}`);
}
function broadcastFeedEvent(event) {
    broadcast("event.feed", event, "events");
}
function broadcastWeatherUpdate(weather) {
    broadcast("weather.update", weather, "weather");
}
function broadcastNetworkStatus(status) {
    broadcast("network.status", status, "network");
}
function broadcastManeuverStatus(maneuver) {
    broadcast("maneuver.status", maneuver, "maneuver");
}
//# sourceMappingURL=server.js.map