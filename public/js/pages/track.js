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
    // We need BOTH:
    //   - shellready (shell.js reinjects #shell.innerHTML on DOMContentLoaded)
    //   - viewerready (orbital.js creates window.sosOrbitalViewer in a later
    //     DOMContentLoaded handler, AFTER shellready fires)
    // Without viewerready, enableLiveTracking() would never be called.
    function check() {
      if (document.querySelector(".main-col") && window.sosOrbitalViewer) {
        fn();
      } else if (document.querySelector(".main-col")) {
        // Shell is ready but viewer isn't yet — wait for viewerready event.
        document.addEventListener("viewerready", fn, { once: true });
      } else {
        document.addEventListener("shellready", function () {
          if (window.sosOrbitalViewer) fn();
          else document.addEventListener("viewerready", fn, { once: true });
        }, { once: true });
      }
    }
    check();
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
    var searchDebounce = null;
    var listBuilt = false;
    var telemBuilt = false;
    var lastTelemVals = {};

    /* ---- Satellite list rendering (in-place update, preserves scroll/focus) ---- */
    function renderList() {
      var sats = T.search(searchQuery);
      if (!sats || !sats.length) {
        var status = T.getStatus();
        if (status.status === "loading" || status.count === 0) {
          $list.innerHTML = '<div class="track-state loading"><div class="ts-msg">Loading orbital data…</div></div>';
        } else if (status.status === "error" && status.count === 0) {
          $list.innerHTML = '<div class="track-state error"><div class="ts-msg">Orbital Data Source Unavailable</div><div class="ts-sub">Could not reach CelesTrak. Retrying automatically.</div></div>';
        } else {
          $list.innerHTML = '<div class="track-state"><div class="ts-msg">No satellites match "' + escapeHtml(searchQuery) + '"</div><div class="ts-sub">Try a different search term.</div></div>';
        }
        listBuilt = false;
        return;
      }
      var selected = T.getSelected();
      var selId = selected ? selected.noradId : null;

      // Build the list structure once, then update in place
      if (!listBuilt || $list.children.length !== sats.length) {
        $list.innerHTML = sats.map(function (s) {
          return '<div class="sat-item" data-norad="' + s.noradId + '" tabindex="0">' +
            '<span class="sat-item-dot"></span>' +
            '<div class="sat-item-info">' +
              '<div class="sat-item-name"></div>' +
              '<div class="sat-item-meta"></div>' +
            '</div>' +
          '</div>';
        }).join("");
        listBuilt = true;
      }

      // Update each item in place
      var items = $list.querySelectorAll(".sat-item");
      sats.forEach(function (s, i) {
        var el = items[i];
        if (!el) return;
        var isSel = s.noradId === selId;
        el.classList.toggle("selected", isSel);
        el.classList.toggle("unavailable", !s.ok);
        var dot = el.querySelector(".sat-item-dot");
        dot.className = "sat-item-dot" + (s.ok ? "" : " off") + (s.ok && /GEO|GSO/.test(s.category) ? " geo" : "");
        var alt = s.state ? Math.round(s.state.altitudeKm) + " km" : (s.ok ? "…" : "N/A");
        el.querySelector(".sat-item-name").textContent = s.name;
        el.querySelector(".sat-item-meta").textContent = alt + " · " + (s.category || "");
        el.setAttribute("title", s.name + " · NORAD " + s.noradId + " · " + (s.category || ""));
      });
    }

    /* ---- Telemetry panel rendering (in-place update, enables value flash) ---- */
    function renderTelemetry() {
      var sel = T.getSelected();
      if (!sel) {
        $telemName.textContent = "—";
        if (!telemBuilt || $telemBody.querySelector(".track-state") === null) {
          $telemBody.innerHTML = '<div class="track-state loading"><div class="ts-msg">Select a satellite</div><div class="ts-sub">Choose a satellite from the list to view its real-time propagated position.</div></div>';
          telemBuilt = false;
        }
        return;
      }
      $telemName.textContent = sel.name;
      var status = T.getStatus();
      if ($telemTag) {
        $telemTag.className = "telem-tag " + (status.isLive ? "live" : "sim");
        $telemTag.innerHTML = '<span class="live-pip"></span>' + (status.isLive ? "LIVE" : "SIM");
      }

      if (!sel.ok) {
        $telemBody.innerHTML = '<div class="track-state error"><div class="ts-msg">Orbital Data Unavailable</div><div class="ts-sub">' + (sel.error || "No TLE data for this satellite.") + '</div></div>';
        telemBuilt = false;
        return;
      }
      if (!sel.state) {
        if (!telemBuilt || $telemBody.querySelector(".track-state") === null) {
          $telemBody.innerHTML = '<div class="track-state loading"><div class="ts-msg">Propagating…</div></div>';
          telemBuilt = false;
        }
        return;
      }

      // Build the telemetry structure once, then update values in place
      if (!telemBuilt) {
        $telemBody.innerHTML =
          '<div class="telem-section-label">Real-Time Propagated Position</div>' +
          '<div class="telem-grid">' +
            '<div class="telem-cell" data-key="lat"><div class="k">Latitude</div><div class="v">—</div></div>' +
            '<div class="telem-cell" data-key="lon"><div class="k">Longitude</div><div class="v">—</div></div>' +
            '<div class="telem-cell" data-key="alt"><div class="k">Altitude</div><div class="v">— <span class="u">km</span></div></div>' +
            '<div class="telem-cell" data-key="vel"><div class="k">Velocity</div><div class="v">— <span class="u">km/s</span></div></div>' +
          '</div>' +
          '<div class="telem-meta">' +
            '<div class="telem-meta-row"><span>Orbital data epoch</span><b data-key="epoch">—</b></div>' +
            '<div class="telem-meta-row"><span>Data last updated</span><b data-key="updated">—</b></div>' +
            '<div class="telem-meta-row"><span>Position calculation</span><b data-key="calc">—</b></div>' +
            '<div class="telem-meta-row"><span>Position timestamp</span><b data-key="ts">—</b></div>' +
          '</div>';
        telemBuilt = true;
        lastTelemVals = {};
      }

      // Update values in place with flash on change
      var st = sel.state;
      updateCell("lat", st.latitude.toFixed(3) + "°");
      updateCell("lon", st.longitude.toFixed(3) + "°");
      updateCell("alt", st.altitudeKm.toFixed(1), "km");
      updateCell("vel", st.velocityKms.toFixed(3), "km/s");
      updateMeta("epoch", sel.epoch ? fmtEpoch(sel.epoch) : "—");
      updateMeta("updated", sel.fetchedAt ? timeAgo(sel.fetchedAt) : "—");
      updateMeta("calc", status.isLive ? "LIVE (UTC)" : "SIM (" + fmtOffset(status.timeOffsetMs) + ")");
      updateMeta("ts", fmtTimeUTC(st.timestamp));
    }

    function updateCell(key, val, unit) {
      var cell = $telemBody.querySelector('[data-key="' + key + '"]');
      if (!cell) return;
      var vEl = cell.querySelector(".v");
      if (!vEl) return;
      var text = val + (unit ? ' <span class="u">' + unit + '</span>' : '');
      if (lastTelemVals[key] !== val) {
        vEl.innerHTML = text;
        lastTelemVals[key] = val;
        // brief flash highlight on value change
        cell.classList.remove("flash");
        void cell.offsetWidth; // force reflow to restart animation
        cell.classList.add("flash");
      }
    }

    function updateMeta(key, val) {
      var el = $telemBody.querySelector('[data-key="' + key + '"]');
      if (el && el.textContent !== val) el.textContent = val;
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

      // Status-reactive LIVE banner
      var tbLive = document.querySelector(".tb-live");
      if (tbLive) {
        tbLive.classList.remove("stale", "error", "loading");
        if (s.status === "stale") tbLive.classList.add("stale");
        else if (s.status === "error") tbLive.classList.add("error");
        else if (s.status === "initializing" || s.count === 0) tbLive.classList.add("loading");
      }

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
        viewer._camFollow = true;
        viewer._zoomTarget = 1.6;
      }
    });

    // Keyboard navigation: arrow up/down to move, Enter to select
    $list.addEventListener("keydown", function (e) {
      var items = Array.from($list.querySelectorAll(".sat-item"));
      var current = document.activeElement;
      var idx = items.indexOf(current);
      if (idx === -1) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = items[Math.min(idx + 1, items.length - 1)];
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var prev = items[Math.max(idx - 1, 0)];
        if (prev) prev.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        var noradId = parseInt(current.dataset.norad, 10);
        T.select(noradId);
        renderList();
        renderTelemetry();
        if (viewer && viewer.liveMode) { viewer._camFollow = true; viewer._zoomTarget = 1.6; }
      }
    });

    // Debounced search
    $search.addEventListener("input", function (e) {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () {
        searchQuery = e.target.value;
        renderList();
      }, 150);
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
