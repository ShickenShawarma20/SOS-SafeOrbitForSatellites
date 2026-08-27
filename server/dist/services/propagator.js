"use strict";
/* SOS — SafeOrbitForSattelites · SGP4 propagation service
 *
 * Uses the `satellite.js` library (v7, ESM-only) for SGP4/SDP4 propagation.
 * Because the server compiles to CommonJS, `satellite.js` is loaded via a
 * dynamic import() which is cached after first call.
 *
 * This module is the single source of truth for orbital propagation.  It is
 * kept separate from UI/route code so it can be reused for conjunction
 * screening and trajectory prediction later.
 *
 * Reusable interfaces (Phase 15 — architecture for future collision detection):
 *   SatelliteState  — current propagated position/velocity + timestamp
 *   TrajectoryPoint — a future position/velocity at a timestamp
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.propagateAt = propagateAt;
exports.propagateNow = propagateNow;
exports.propagateTrajectory = propagateTrajectory;
let satelliteJsPromise = null;
async function getSatelliteJs() {
    if (!satelliteJsPromise) {
        satelliteJsPromise = Promise.resolve().then(() => __importStar(require("satellite.js")));
    }
    return satelliteJsPromise;
}
// Cache compiled satrec objects so we don't re-parse TLEs on every propagation.
/* eslint-disable @typescript-eslint/no-explicit-any */
const satrecCache = new Map();
/* Build (or fetch from cache) a satellite.js satrec from a TLE pair. */
async function getSatrec(noradId, line1, line2, epoch) {
    const cached = satrecCache.get(noradId);
    if (cached && cached.epoch === epoch)
        return cached.satrec;
    try {
        const s = await getSatelliteJs();
        const satrec = s.twoline2satrec(line1, line2);
        if (!satrec || (satrec.satellite === null && satrec.error))
            return null;
        satrecCache.set(noradId, { satrec, epoch });
        return satrec;
    }
    catch {
        return null;
    }
}
/* Propagate a single satellite to a specific UTC time. */
async function propagateAt(noradId, name, line1, line2, epoch, when) {
    if (!line1 || !line2)
        return { ok: false, status: "no_tle", error: "No TLE data" };
    const satrec = await getSatrec(noradId, line1, line2, epoch);
    if (!satrec)
        return { ok: false, status: "propagation_error", error: "Invalid TLE" };
    try {
        const s = await getSatelliteJs();
        const result = s.propagate(satrec, when);
        const pos = result?.position;
        const vel = result?.velocity;
        if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x)) {
            return { ok: false, status: "propagation_error", error: "Propagation returned NaN" };
        }
        const gmst = s.gstime(when);
        const geo = s.eciToGeodetic(pos, gmst);
        const vMag = vel ? Math.hypot(vel.x, vel.y, vel.z) : 0;
        const state = {
            noradId,
            name,
            latitude: s.degreesLat(geo.latitude),
            longitude: s.degreesLong(geo.longitude),
            altitudeKm: geo.height,
            velocityKms: vMag,
            position: [pos.x, pos.y, pos.z],
            velocity: vel ? [vel.x, vel.y, vel.z] : [0, 0, 0],
            timestamp: when.toISOString(),
        };
        return { ok: true, status: "ok", state };
    }
    catch (e) {
        return { ok: false, status: "propagation_error", error: e.message };
    }
}
/* Propagate now (current UTC). */
async function propagateNow(noradId, name, line1, line2, epoch) {
    return propagateAt(noradId, name, line1, line2, epoch, new Date());
}
/* Generate a predicted trajectory (orbit trail) from a TLE.
 * Produces `steps` points at `stepSec` intervals starting from `startWhen`.
 * For a LEO satellite, ~180 points × 300 s covers a full ~90 min orbit.
 * For GEO/GSO, the caller should pass a longer step or fewer points. */
async function propagateTrajectory(noradId, name, line1, line2, epoch, startWhen, steps, stepSec) {
    if (!line1 || !line2)
        return { ok: false, points: [], error: "No TLE data" };
    const satrec = await getSatrec(noradId, line1, line2, epoch);
    if (!satrec)
        return { ok: false, points: [], error: "Invalid TLE" };
    try {
        const s = await getSatelliteJs();
        const points = [];
        const startTime = startWhen.getTime();
        for (let i = 0; i < steps; i++) {
            const t = new Date(startTime + i * stepSec * 1000);
            const result = s.propagate(satrec, t);
            const pos = result?.position;
            const vel = result?.velocity;
            if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x))
                continue;
            const gmst = s.gstime(t);
            const geo = s.eciToGeodetic(pos, gmst);
            points.push({
                timestamp: t.toISOString(),
                position: [pos.x, pos.y, pos.z],
                velocity: vel ? [vel.x, vel.y, vel.z] : [0, 0, 0],
                latitude: s.degreesLat(geo.latitude),
                longitude: s.degreesLong(geo.longitude),
                altitudeKm: geo.height,
            });
        }
        return { ok: true, points };
    }
    catch (e) {
        return { ok: false, points: [], error: e.message };
    }
}
//# sourceMappingURL=propagator.js.map