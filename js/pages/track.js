/* SOS · SafeOrbitForSattelites — tracking page controller
 *
 * Wires together:
 *   - SOSTracking (data state: SGP4 propagation, fleet, selection, time)
 *   - OrbitalViewer (3D Earth visualization state)
 *   - Satellite list + search (left panel)
 *   - Telemetry panel (right)
 *   - Time controls (LIVE / -1h / -30m / -10m / NOW / +10m / +30m / +1h)
 *   - System status bar + LIVE banner
 */
(function () {
  "use strict";

  function onReady(fn) {
    // Always wait for shellready — shell.js reinjects #shell.innerHTML on
    // DOMContentLoaded, wiping elements that existed at parse time.  Querying
    // before shellready would bind to detached nodes.
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var T = window.SOSTracking;
    if (!T) { console.error("SOSTracking not loaded"); return; }

    var viewer = window.sosOrbitalViewer;
    var $list = document.getElementById("satListBody");
    var $search = document.getElementById("satSearch");
    var $telemName = document.getElementById("telemName");
    var $telemTag = document.getElementById("telemTag");
    var $telemBody = document.getElementById("telemBody");
    var $tcLive = document.getElementById("tcLive");
    var $tcPlay = document.getElementById("tcPlay");
    var $tcOffset = document.getElementById("tcOffset");

    var searchQuery = "";

    /* ---- Satellite list rendering ---- */
    function renderList() {
      var sats = T.search(searchQuery);
      if (!sats || !sats.length) {
        var status = T.getStatus();
        if (status.status === "loading" || status.count === 0) {
          $list.innerHTML = '<div class="track-state loading"><div class="ts-msg">Loading orbital data…</div></div>';
        } else if (status.status === "error" && status.count === 0) {
          $list.innerHTML = '<div class="track-state error"><div class="ts-icon">⚠</div><div class="ts-msg">Orbital Data Source Unavailable</div><div class="ts-sub">Could not reach CelesTrak. Retrying automatically.</div></div>';
        } else {
          $list.innerHTML = '<div class="track-state"><div class="ts-msg">No satellites match "' + escapeHtml(searchQuery) + '"</div></div>';
        }
        return;
      }
      var selected = T.getSelected();
      var selId = selected ? selected.noradId : null;
      $list.innerHTML = sats.map(function (s) {
        var isSel = s.noradId === selId;
        var cls = "sat-item" + (isSel ? " selected" : "") + (s.ok ? "" : " unavailable");
        var dot = s.ok ? "" : " off";
        var alt = s.state ? Math.round(s.state.altitudeKm) + " km" : (s.ok ? "…" : "N/A");
        var cat = s.category || "";
        return '<div class="' + cls + '" data-norad="' + s.noradId + '">' +
          '<span class="sat-item-dot' + dot + '"></span>' +
          '<div class="sat-item-info">' +
            '<div class="sat-item-name">' + escapeHtml(s.name) + '</div>' +
            '<div class="sat-item-meta">' + alt + ' · ' + escapeHtml(cat) + '</div>' +
          '</div>' +
        '</div>';
      }).join("");
    }

    /* ---- Telemetry panel rendering ---- */
    function renderTelemetry() {
      var sel = T.getSelected();
      if (!sel) {
        $telemName.textContent = "—";
        $telemBody.innerHTML = '<div class="track-state loading"><div class="ts-msg">Select a satellite</div><div class="ts-sub">Choose a satellite from the list to view its real-time propagated position.</div></div>';
        return;
      }
      $telemName.textContent = sel.name;
      var status = T.getStatus();
      // Update the LIVE/SIM tag in place (avoid outerHTML which invalidates the ref)
      if ($telemTag) {
        $telemTag.className = "telem-tag " + (status.isLive ? "live" : "sim");
        $telemTag.innerHTML = '<span class="live-pip"></span>' + (status.isLive ? "LIVE" : "SIM");
      }

      if (!sel.ok) {
        $telemBody.innerHTML = '<div class="track-state error"><div class="ts-icon">⚠</div><div class="ts-msg">Orbital Data Unavailable</div><div class="ts-sub">' + (sel.error || "No TLE data for this satellite.") + '</div></div>';
        return;
      }
      if (!sel.state) {
        $telemBody.innerHTML = '<div class="track-state loading"><div class="ts-msg">Propagating…</div></div>';
        return;
      }
      var st = sel.state;
      $telemBody.innerHTML =
        '<div class="telem-section-label">Real-Time Propagated Position</div>' +
        '<div class="telem-grid">' +
          telemCell("Latitude", st.latitude.toFixed(3) + "°") +
          telemCell("Longitude", st.longitude.toFixed(3) + "°") +
          telemCell("Altitude", st.altitudeKm.toFixed(1), "km") +
          telemCell("Velocity", st.velocityKms.toFixed(3), "km/s") +
        '</div>' +
        '<div class="telem-meta">' +
          '<div class="telem-meta-row"><span>Orbital data epoch</span><b>' + (sel.epoch ? fmtEpoch(sel.epoch) : "—") + '</b></div>' +
          '<div class="telem-meta-row"><span>Data last updated</span><b>' + (sel.fetchedAt ? timeAgo(sel.fetchedAt) : "—") + '</b></div>' +
          '<div class="telem-meta-row"><span>Position calculation</span><b>' + (status.isLive ? "LIVE (UTC)" : "SIM (" + fmtOffset(status.timeOffsetMs) + ")") + '</b></div>' +
          '<div class="telem-meta-row"><span>Position timestamp</span><b>' + fmtTimeUTC(st.timestamp) + '</b></div>' +
        '</div>';
    }

    function telemCell(k, v, u) {
      return '<div class="telem-cell"><div class="k">' + k + '</div><div class="v">' + v + (u ? ' <span class="u">' + u + '</span>' : '') + '</div></div>';
    }

    /* ---- System status bar ---- */
    function renderStatus() {
      var s = T.getStatus();
      var tb = {
        tbSatCount: s.okCount + "/" + s.count,
        tbProp: s.propagation === "active" ? "ACTIVE" : "IDLE",
        tbData: s.status === "ok" ? "AVAILABLE" : s.status === "stale" ? "STALE" : s.status === "error" ? "UNAVAILABLE" : "LOADING…",
        tbRefresh: s.fetchedAt ? timeAgo(s.fetchedAt) : "—",
      };
      for (var id in tb) setText(id, tb[id]);

      var sourceCls = s.status === "ok" ? "ok" : s.status === "stale" ? "stale" : s.status === "error" ? "err" : "";
      setClass("tsSource", "v " + sourceCls, s.status === "ok" ? "CelesTrak · AVAILABLE" : s.status === "stale" ? "CelesTrak · STALE" : s.status === "error" ? "CelesTrak · UNAVAILABLE" : "Loading…");
      setText("tsTracked", s.okCount + "/" + s.count);
      setText("tsProp", s.propagation === "active" ? "ACTIVE" : "IDLE");
      setText("tsRefresh", s.fetchedAt ? timeAgo(s.fetchedAt) : "—");
      setText("tsEpoch", s.newestEpoch ? fmtEpoch(s.newestEpoch) : "—");
    }

    /* ---- Time controls ---- */
    function renderTime() {
      var s = T.getStatus();
      var live = s.isLive;
      $tcLive.classList.toggle("active", live);
      document.querySelectorAll(".tc-btn[data-shift]").forEach(function (btn) {
        var shift = parseInt(btn.dataset.shift, 10);
        btn.classList.toggle("active", !live && shift === s.timeOffsetMs);
      });
      $tcOffset.textContent = live ? "UTC (LIVE)" : "UTC " + fmtOffset(s.timeOffsetMs);
      $tcPlay.innerHTML = s.playing
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      $tcPlay.setAttribute("aria-label", s.playing ? "Pause" : "Play");
    }

    /* ---- Wire up events ---- */
    $list.addEventListener("click", function (e) {
      var item = e.target.closest(".sat-item");
      if (!item) return;
      var noradId = parseInt(item.dataset.norad, 10);
      T.select(noradId);
      renderList();
      renderTelemetry();
      if (viewer && viewer.liveMode) {
        viewer._liveFocus = noradId;
        viewer._camFollow = true;
        viewer._zoomTarget = 1.6;
      }
    });

    $search.addEventListener("input", function (e) {
      searchQuery = e.target.value;
      renderList();
    });

    $tcLive.addEventListener("click", function () {
      T.setLive();
      renderTime();
    });
    document.querySelectorAll(".tc-btn[data-shift]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var shift = parseInt(btn.dataset.shift, 10);
        if (shift === 0) T.setLive();
        else T.setTimeOffset(shift);
        renderTime();
      });
    });
    $tcPlay.addEventListener("click", function () {
      var s = T.getStatus();
      T.setPlaying(!s.playing);
      renderTime();
    });

    T.on("position", function () {
      renderList();
      renderTelemetry();
      // orbit trails follow time changes; rebuild periodically in sim mode
    });
    T.on("status", function () {
      renderList();
      renderStatus();
      renderTelemetry();
    });
    T.on("select", function () {
      renderList();
      renderTelemetry();
    });
    T.on("time", function () {
      renderTime();
      renderTelemetry();
    });

    /* ---- Enable live tracking on the 3D viewer ---- */
    if (viewer) {
      viewer.enableLiveTracking(T);
    }

    /* ---- Initialize ---- */
    T.init();
    renderList();
    renderStatus();
    renderTime();
    renderTelemetry();

    // periodic UI refresh for time-ago labels
    setInterval(function () { renderStatus(); if (T.getSelected() && T.getSelected().state) renderTelemetry(); }, 5000);
  });

  /* ---- helpers ---- */
  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  function setClass(id, cls, val) { var el = document.getElementById(id); if (el) { el.className = cls; el.textContent = val; } }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtTimeUTC(iso) { if (!iso) return "—"; var d = new Date(iso); var p = function (n) { return String(n).padStart(2, "0"); }; return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + " UTC"; }
  function fmtEpoch(iso) { if (!iso) return "—"; var d = new Date(iso); return d.toISOString().slice(0, 10).replace(/-/g, " ") + " " + d.toISOString().slice(11, 16) + " UTC"; }
  function timeAgo(iso) { if (!iso) return "—"; var diff = (Date.now() - new Date(iso).getTime()) / 1000; if (diff < 60) return "just now"; if (diff < 3600) return Math.floor(diff / 60) + " min ago"; if (diff < 86400) return Math.floor(diff / 3600) + "h ago"; return Math.floor(diff / 86400) + "d ago"; }
  function fmtOffset(ms) { var s = Math.round(ms / 1000); var sign = s >= 0 ? "+" : "−"; s = Math.abs(s); if (s < 3600) return sign + Math.round(s / 60) + "m"; return sign + (s / 3600).toFixed(1) + "h"; }
})();
