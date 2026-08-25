<<<<<<< HEAD
/* SOS · SafeOrbitForSattelites — API client + live data binding */
(function () {
  "use strict";

  const BASE = "/api/v1";

  async function get(path) {
    const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
    return res.json();
  }

  async function post(path, body) {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
    return res.json();
  }

  const fmtPc = (pc) => {
    if (pc === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(pc)));
    const mant = pc / Math.pow(10, exp);
    return `${mant.toFixed(1)}e${exp}`;
  };

  function fmtMiss(meters) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  }

  function fmtTca(tca) {
    const d = new Date(tca);
    const p = (n) => String(n).padStart(2, "0");
    const diffDays = Math.round((d - Date.now()) / 86400000);
    const time = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
    return diffDays >= 1 ? `${diffDays}d ${time}` : time;
  }

  /* ---------- Dashboard bindings ---------- */

  async function loadCriticalAlert() {
    const el = document.querySelector(".alert-crit");
    if (!el) return;
    try {
      const c = await get("/conjunctions/critical");
      const rows = el.querySelectorAll(".am-row .v");
      if (rows.length >= 5) {
        rows[0].textContent = fmtTca(c.tca);
        rows[1].textContent = `${c.probabilityOfCollision.toExponential(1).replace("e-", " \u00d7 10\u207b").replace("e+", " \u00d7 10")}`;
        rows[2].textContent = fmtMiss(c.missDistanceMeters);
        rows[3].textContent = `${c.relativeVelocityKms} km/s`;
        rows[4].textContent = `${c.relativeSpeedKmh.toLocaleString()} km/h`;
      }
      const pair = el.querySelector(".pair");
      if (pair) pair.innerHTML = `${c.satelliteId} <span class="arrow">\u2194</span> ${c.objectId}`;
      document.title = `${c.satelliteId} \u2194 ${c.objectId} \u00b7 SOS SafeOrbitForSattelites`.replace("SOS SafeOrbitForSattelites", "SOS Mission Control");
    } catch (_) { /* keep mock fallback */ }
  }

  async function loadUpcomingConjunctions() {
    const tbody = document.querySelector(".cx-table tbody");
    if (!tbody || !document.querySelector(".dash-row2")) return;
    try {
      const { items } = await get("/conjunctions/upcoming?limit=5");
      if (!items.length) return;
      const cls = { critical: "row-crit", high: "row-high", medium: "row-med" };
      const pill = { critical: "pc-crit", high: "pc-high", medium: "pc-med", low: "pc-low" };
      tbody.innerHTML = items
        .map(
          (c) => `
        <tr class="${cls[c.severity] || ""}" onclick="location.href='conjunction.html'">
          <td class="sat-id">${c.satelliteId}</td><td class="obj-id">${c.objectId}</td>
          <td>${fmtTca(c.tca)}</td><td>${fmtMiss(c.missDistanceMeters)}</td>
          <td><span class="pc-pill ${pill[c.severity]}">${fmtPc(c.probabilityOfCollision)}</span></td>
        </tr>`
        )
        .join("");
    } catch (_) { /* keep mock fallback */ }
  }

  async function loadFeed() {
    const feed = document.querySelector(".feed");
    if (!feed || !document.querySelector(".dash-row2")) return;
    try {
      const { items } = await get("/events/feed?limit=5");
      if (!items.length) return;
      const dotCls = { critical: "sev-red", high: "sev-red", medium: "sev-yellow", info: "sev-blue", nominal: "sev-green" };
      feed.innerHTML = items
        .map((it) => {
          const mins = Math.max(1, Math.round((Date.now() - new Date(it.time)) / 60000));
          const ago = mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
          const text = it.text.replace(/([A-Z]{2,3}-\d+|OBJ-\d+)/g, "<b>$1</b>");
          return `<div class="feed-item"><span class="sev-dot ${dotCls[it.severity] || "sev-blue"}"></span><div><div class="feed-text">${text}</div><div class="feed-time">${ago}</div></div></div>`;
        })
        .join("");
    } catch (_) { /* keep mock fallback */ }
  }

  async function loadKpis() {
    try {
      const k = await get("/dashboard/kpis");
      const metrics = document.querySelectorAll(".top-metric .v.num");
      if (metrics.length >= 4) {
        metrics[0].textContent = k.activeSatellites;
        metrics[1].textContent = k.conjunctionAlerts;
        metrics[2].textContent = k.maneuversPlanned;
        metrics[3].textContent = `${k.systemHealthPct}%`;
      }
      const badge = document.querySelector('.nav-item[href="conjunction.html"] .nav-badge');
      if (badge) badge.textContent = k.conjunctionAlerts;
      const rows = document.querySelectorAll(".sys-row b");
      if (rows.length >= 3) {
        rows[0].textContent = `${k.trackingSourcesOnline} Online`;
        rows[1].textContent = `${k.dataLatencySec} s`;
        rows[2].textContent = `${k.coveragePct}%`;
      }
    } catch (_) { /* keep mock fallback */ }
  }

  async function loadFuel() {
    const gauge = document.getElementById("fuelGauge");
    if (!gauge) return;
    try {
      const f = await get("/fleet/fuel-summary");
      if (window.renderFuelGauge) window.renderFuelGauge("fuelGauge", f.pctRemaining);
      const pct = document.querySelector("#fuelGauge ~ * .pct") || document.querySelector(".fuel-center .pct");
      if (pct) pct.textContent = `${f.pctRemaining}%`;
      const stats = document.querySelectorAll(".fuel-stat b");
      if (stats.length >= 3) {
        stats[0].textContent = `${f.totalKg.toFixed(1)} kg`;
        stats[1].textContent = `${f.usableKg.toFixed(1)} kg`;
        stats[2].textContent = `${f.reservedKg.toFixed(1)} kg`;
      }
    } catch (_) { /* keep mock fallback */ }
  }

  async function acknowledgeConjunction(id) {
    return post(`/conjunctions/${id}/acknowledge`);
  }

  function watchlist(id) {
    return post(`/conjunctions/${id}/watchlist`);
  }

  function simulate(planId) {
    return post("/maneuvers/simulate", { planId });
  }

  function submitPlan(planId) {
    return post(`/maneuvers/plans/${planId}/submit`);
  }

  function jobStatus(jobId) {
    return get(`/jobs/${jobId}`);
  }

  window.SOSApi = {
    get, post,
    acknowledgeConjunction, watchlist, simulate, submitPlan, jobStatus,
    refreshDashboard() {
      loadCriticalAlert();
      loadUpcomingConjunctions();
      loadFeed();
      loadKpis();
      loadFuel();
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadCriticalAlert();
    loadUpcomingConjunctions();
    loadFeed();
    loadKpis();
    loadFuel();
  });
=======
/* SOS · SafeOrbitForSattelites — shared API client */
(function () {
  "use strict";

  var BASE = "/api/v1";

  function api(path, opts) {
    var url = BASE + path;
    var config = { headers: { "Content-Type": "application/json" } };
    if (opts) {
      if (opts.method) config.method = opts.method;
      if (opts.body) config.body = JSON.stringify(opts.body);
    }
    return fetch(url, config).then(function (res) {
      if (!res.ok) throw new Error("API " + res.status + " " + url);
      return res.json();
    });
  }

  /* ---------- WebSocket ---------- */
  var ws = null;
  var wsListeners = {};
  var wsReconnectTimer = null;

  function wsConnect() {
    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    var url = protocol + "//" + location.host + "/ws";
    try {
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws.onopen = function () {
      wsSend({ subscribe: ["conjunction", "telemetry", "event", "weather", "network", "job", "maneuver"] });
    };
    ws.onmessage = function (ev) {
      try {
        var msg = JSON.parse(ev.data);
        if (msg.channel && wsListeners[msg.channel]) {
          wsListeners[msg.channel].forEach(function (fn) { fn(msg.data); });
        }
        if (msg.event && wsListeners["*"]) {
          wsListeners["*"].forEach(function (fn) { fn(msg.event, msg.data); });
        }
      } catch (e) {}
    };
    ws.onclose = function () { scheduleReconnect(); };
    ws.onerror = function () {};
  }

  function scheduleReconnect() {
    if (wsReconnectTimer) return;
    wsReconnectTimer = setTimeout(function () {
      wsReconnectTimer = null;
      wsConnect();
    }, 5000);
  }

  function wsSend(data) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
  }

  function wsOn(channel, fn) {
    if (!wsListeners[channel]) wsListeners[channel] = [];
    wsListeners[channel].push(fn);
  }

  /* ---------- URL param helpers ---------- */
  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getHashParam() {
    var hash = window.location.hash;
    return hash ? hash.replace("#", "") : null;
  }

  /* ---------- Formatting helpers ---------- */
  function fmtPc(val) {
    if (val == null) return "—";
    if (val >= 1) return val.toFixed(1);
    var exp = Math.floor(Math.log10(val));
    var mantissa = val / Math.pow(10, exp);
    var superscripts = { "0": "\u2070", "1": "\u00B9", "2": "\u00B2", "3": "\u00B3", "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079" };
    var expStr = String(Math.abs(exp)).split("").map(function (d) { return superscripts[d] || d; }).join("");
    return mantissa.toFixed(1) + " \u00D7 10\u207B" + expStr;
  }

  function fmtDist(meters) {
    if (meters == null) return "—";
    if (meters < 1000) return meters + " m";
    return (meters / 1000).toFixed(1) + " km";
  }

  function fmtDistKm(km) {
    if (km == null) return "—";
    if (km < 1) return Math.round(km * 1000) + " m";
    return km.toFixed(1) + " km";
  }

  function fmtTime(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    var p = function (n) { return String(n).padStart(2, "0"); };
    return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds());
  }

  function fmtDateShort(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[d.getUTCMonth()] + " " + d.getUTCDate();
  }

  function fmtDuration(sec) {
    if (sec == null) return "—";
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + "m " + String(Math.round(s)).padStart(2, "0") + "s";
  }

  function sevClass(sev) {
    if (sev === "critical") return "sev-red";
    if (sev === "high") return "sev-yellow";
    if (sev === "medium") return "sev-blue";
    return "sev-green";
  }

  function pcClass(pc) {
    if (pc >= 1e-4) return "pc-crit";
    if (pc >= 1e-5) return "pc-high";
    if (pc >= 1e-6) return "pc-med";
    return "pc-low";
  }

  function rowClass(sev) {
    if (sev === "critical") return "row-crit";
    if (sev === "high") return "row-high";
    if (sev === "medium") return "row-med";
    return "";
  }

  function timeAgo(iso) {
    if (!iso) return "";
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + " min ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  /* ---------- Expose ---------- */
  window.SOS = {
    api: api,
    ws: { connect: wsConnect, on: wsOn, send: wsSend },
    param: getParam,
    hash: getHashParam,
    fmtPc: fmtPc,
    fmtDist: fmtDist,
    fmtDistKm: fmtDistKm,
    fmtTime: fmtTime,
    fmtDateShort: fmtDateShort,
    fmtDuration: fmtDuration,
    sevClass: sevClass,
    pcClass: pcClass,
    rowClass: rowClass,
    timeAgo: timeAgo,
  };
>>>>>>> 9d5f73c (fixed routes)
})();
