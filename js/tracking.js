/* SOS · SafeOrbitForSattelites — real-time satellite tracking core
 *
 * Architecture:
 *
 *   Orbital Data (TLE)  ← server /api/v1/tracking/fleet (cached, refreshed 6h)
 *        ↓
 *   SGP4 Propagation    ← satellite.js (client-side, every ~1 s)
 *        ↓
 *   Current UTC Time    ← Date.now() + optional time offset (LIVE / sim mode)
 *        ↓
 *   SatelliteState[]    ← { lat, lon, alt, velocity, position, velocity }
 *        ↓
 *   Frontend (globe + telemetry + list)
 *
 * DATA STATE is kept separate from VISUALIZATION STATE.  This module owns the
 * data state (satellite positions).  The 3D viewer reads positions from here
 * every animation frame but manages its own Three.js objects.
 *
 * Lifecycle:
 *   - init() fetches the fleet TLEs once, builds satrec objects, starts the
 *     propagation loop.
 *   - The propagation loop runs on requestAnimationFrame but only recomputes
 *     positions at most once per ~1 s (PROPAGATION_INTERVAL_MS) to save CPU.
 *     The 3D viewer interpolates / re-reads at 60 fps.
 *   - Intervals/animation frames are cleaned up via destroy().
 */
(function () {
  "use strict";

  const PROPAGATION_INTERVAL_MS = 1000;   // recompute positions every 1 s
  const REFLEET_INTERVAL_MS = 6 * 60 * 60 * 1000; // re-fetch TLEs every 6 h

  // ---- State (DATA STATE) ----
  let satellites = [];        // [{ noradId, name, alias, operator, category, satrec, tle, epoch, ok, state, error }]
  let selectedNoradId = null;
  let fleetStatus = "loading"; // loading | ok | stale | error
  let fleetFetchedAt = null;
  let fleetNewestEpoch = null;
  let satelliteJsReady = false;
  let initialized = false;
  let rafId = null;
  let lastPropagation = 0;
  let fleetRefreshTimer = null;

  // Time control: LIVE = offset 0; simulation = offset in ms from current UTC.
  let timeOffsetMs = 0;
  let isLive = true;
  let playing = true;
  let playSpeed = 1;           // sim playback multiplier (1× = real-time offset shift)

  // Listeners for UI updates
  const listeners = {
    position: [],   // fired ~1 s with full state array
    select: [],     // fired on selection change
    status: [],     // fired on fleet status change
    time: [],       // fired on time-offset / play state change
  };

  function on(event, fn) {
    if (listeners[event]) listeners[event].push(fn);
  }
  function emit(event, data) {
    (listeners[event] || []).forEach(function (fn) {
      try { fn(data); } catch (e) { console.error("[tracking] listener error", e); }
    });
  }

  /* ---- Time helpers ---- */
  function currentTime() {
    return isLive ? new Date() : new Date(Date.now() + timeOffsetMs);
  }

  function setTimeOffset(ms) {
    timeOffsetMs = ms || 0;
    isLive = ms === 0;
    emit("time", { isLive, timeOffsetMs, playing });
    // immediate propagation
    propagateAll(true);
  }

  function setLive() {
    isLive = true;
    timeOffsetMs = 0;
    emit("time", { isLive, timeOffsetMs, playing });
    propagateAll(true);
  }

  function shiftTime(deltaMs) {
    isLive = false;
    timeOffsetMs += deltaMs;
    emit("time", { isLive, timeOffsetMs, playing });
    propagateAll(true);
  }

  function setPlaying(p) {
    playing = p;
    emit("time", { isLive, timeOffsetMs, playing });
  }

  /* ---- Selection ---- */
  function select(noradId) {
    selectedNoradId = noradId;
    satellites.forEach(function (s) { s.selected = (s.noradId === noradId); });
    emit("select", noradId);
  }

  function getSelected() {
    return satellites.find(function (s) { return s.noradId === selectedNoradId; }) || null;
  }

  /* ---- Fleet fetch ---- */
  async function fetchFleet() {
    try {
      const res = await fetch("/api/v1/tracking/fleet");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      fleetStatus = data.status || "ok";
      fleetFetchedAt = data.fetchedAt;
      fleetNewestEpoch = data.newestEpoch;

      const Satellite = window.Satellite;
      if (!Satellite) {
        console.warn("[tracking] satellite.js not yet ready, will retry fleet parse");
        setTimeout(fetchFleet, 2000);
        return;
      }

      satellites = (data.satellites || []).map(function (t) {
        let satrec = null;
        let error = null;
        if (t.ok && t.line1 && t.line2) {
          try {
            satrec = Satellite.twoline2satrec(t.line1, t.line2);
          } catch (e) {
            error = "TLE parse error";
          }
        }
        return {
          noradId: t.noradId,
          name: t.alias || t.name,
          canonicalName: t.name,
          alias: t.alias,
          operator: t.operator,
          category: t.category,
          source: t.source,
          epoch: t.epoch,
          fetchedAt: t.fetchedAt,
          ok: t.ok && !!satrec,
          satrec: satrec,
          tle: { line1: t.line1, line2: t.line2 },
          state: null,
          error: error || (!t.ok ? "No TLE data" : null),
          selected: false,
        };
      });

      // auto-select the first LEO satellite if nothing selected
      if (!selectedNoradId && satellites.length) {
        const firstLeo = satellites.find(function (s) {
          return s.ok && /LEO|SSO/i.test(s.category);
        }) || satellites.find(function (s) { return s.ok; });
        if (firstLeo) select(firstLeo.noradId);
      }

      initialized = true;
      emit("status", getStatus());
      propagateAll(true);
    } catch (e) {
      console.error("[tracking] fleet fetch failed", e);
      fleetStatus = "error";
      emit("status", getStatus());
    }
  }

  function getStatus() {
    const okCount = satellites.filter(function (s) { return s.ok; }).length;
    return {
      status: fleetStatus,
      fetchedAt: fleetFetchedAt,
      newestEpoch: fleetNewestEpoch,
      count: satellites.length,
      okCount: okCount,
      propagation: "active",
      isLive: isLive,
      timeOffsetMs: timeOffsetMs,
      playing: playing,
    };
  }

  function getSatellites() {
    return satellites;
  }

  /* ---- Propagation ----
   * Recomputes positions for all satellites using SGP4 at the current (or
   * offset) UTC time.  Called at most once per PROPAGATION_INTERVAL_MS.
   */
  function propagateAll(force) {
    if (!initialized || !window.Satellite) return;
    const now = performance.now();
    if (!force && now - lastPropagation < PROPAGATION_INTERVAL_MS) return;
    lastPropagation = now;

    const Satellite = window.Satellite;
    const when = currentTime();

    satellites.forEach(function (s) {
      if (!s.ok || !s.satrec) { s.state = null; return; }
      try {
        const result = Satellite.propagate(s.satrec, when);
        const pos = result && result.position;
        const vel = result && result.velocity;
        if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x)) {
          s.state = null;
          s.error = "Propagation error";
          return;
        }
        const gmst = Satellite.gstime(when);
        const geo = Satellite.eciToGeodetic(pos, gmst);
        const vMag = vel ? Math.hypot(vel.x, vel.y, vel.z) : 0;
        s.state = {
          noradId: s.noradId,
          name: s.name,
          latitude: Satellite.degreesLat(geo.latitude),
          longitude: Satellite.degreesLong(geo.longitude),
          altitudeKm: geo.height,
          velocityKms: vMag,
          position: [pos.x, pos.y, pos.z],
          velocity: vel ? [vel.x, vel.y, vel.z] : [0, 0, 0],
          timestamp: when.toISOString(),
        };
        s.error = null;
      } catch (e) {
        s.state = null;
        s.error = "Propagation error";
      }
    });

    emit("position", satellites);
  }

  /* ---- Animation loop ----
   * requestAnimationFrame drives the loop.  Position recomputation is throttled
   * to ~1 s; the UI reads positions every frame (smooth interpolation handled by
   * the 3D viewer's own render loop).
   */
  function loop() {
    propagateAll(false);
    // In simulation playback mode with playing=true, advance the offset.
    if (!isLive && playing) {
      // Advance at real-time × playSpeed (no acceleration needed for sim inspection)
      // Only advance if a significant time has passed since last offset shift.
    }
    rafId = requestAnimationFrame(loop);
  }

  /* ---- Trajectory (orbit trail) generation (client-side) ---- */
  function generateTrajectory(noradId, steps, stepSec) {
    const s = satellites.find(function (x) { return x.noradId === noradId; });
    if (!s || !s.ok || !s.satrec) return { ok: false, points: [] };
    const Satellite = window.Satellite;
    const when = currentTime();
    const startMs = when.getTime();
    const points = [];
    for (let i = 0; i < steps; i++) {
      const t = new Date(startMs + i * stepSec * 1000);
      try {
        const result = Satellite.propagate(s.satrec, t);
        const pos = result && result.position;
        if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x)) continue;
        const gmst = Satellite.gstime(t);
        const geo = Satellite.eciToGeodetic(pos, gmst);
        points.push({
          timestamp: t.toISOString(),
          position: [pos.x, pos.y, pos.z],
          latitude: Satellite.degreesLat(geo.latitude),
          longitude: Satellite.degreesLong(geo.longitude),
          altitudeKm: geo.height,
        });
      } catch (e) { /* skip point */ }
    }
    return { ok: true, points: points };
  }

  /* ---- Init ---- */
  function init() {
    if (initialized && rafId) return;

    function start() {
      if (satelliteJsReady) return; // already started
      satelliteJsReady = true;
      fetchFleet().catch(function (e) { console.error("[tracking] init fetch error", e); });
      rafId = requestAnimationFrame(loop);
      // Re-fetch TLEs periodically.
      if (fleetRefreshTimer) clearInterval(fleetRefreshTimer);
      fleetRefreshTimer = setInterval(fetchFleet, REFLEET_INTERVAL_MS);
    }

    function waitForSatelliteJs() {
      if (window.Satellite) {
        start();
      } else {
        // Poll until satellite.js loads (the loader is a module script that
        // sets window.Satellite + dispatches the event).
        setTimeout(waitForSatelliteJs, 200);
      }
    }

    document.addEventListener("satellitejsready", start, { once: true });
    waitForSatelliteJs();
  }

  /* ---- Cleanup ---- */
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    if (fleetRefreshTimer) clearInterval(fleetRefreshTimer);
    rafId = null;
    fleetRefreshTimer = null;
    initialized = false;
  }

  /* ---- Search ---- */
  function search(query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return satellites;
    return satellites.filter(function (s) {
      return s.name.toLowerCase().includes(q) ||
        (s.alias || "").toLowerCase().includes(q) ||
        s.canonicalName.toLowerCase().includes(q) ||
        String(s.noradId).includes(q) ||
        (s.category || "").toLowerCase().includes(q);
    });
  }

  /* ---- Expose ---- */
  window.SOSTracking = {
    init: init,
    destroy: destroy,
    on: on,
    select: select,
    getSelected: getSelected,
    getSatellites: getSatellites,
    getStatus: getStatus,
    search: search,
    generateTrajectory: generateTrajectory,
    setTimeOffset: setTimeOffset,
    setLive: setLive,
    shiftTime: shiftTime,
    setPlaying: setPlaying,
    currentTime: currentTime,
  };
})();
