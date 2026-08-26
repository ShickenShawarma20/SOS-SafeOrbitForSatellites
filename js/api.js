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
})();
