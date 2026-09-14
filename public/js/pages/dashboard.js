/* SOS · SafeOrbitForSattelites — dashboard page loader with real-time updates */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  function fadeReplace(oldEl, newHtml, duration = 500) {
    if (!oldEl) { oldEl.textContent = newHtml; return; }
    oldEl.style.transition = `opacity ${duration}ms ease-out`;
    oldEl.style.opacity = "0";
    setTimeout(() => {
      oldEl.innerHTML = newHtml;
      oldEl.style.opacity = "1";
      oldEl.style.transition = "";
    }, duration);
  }

  function animateNumber(oldEl, newVal, prefix = "", suffix = "", duration = 500) {
    if (!oldEl) return;
    const oldNum = parseFloat(oldEl.textContent) || 0;
    if (oldNum === newVal) return;
    oldEl.style.transition = `none`;
    oldEl.textContent = `${prefix}${newVal}${suffix}`;
    // Force reflow for transition
    oldEl.offsetHeight;
    oldEl.style.transition = `color ${duration}ms ease`;
    if (newVal > oldNum) oldEl.style.color = "#10b981";
    else if (newVal < oldNum) oldEl.style.color = "#ef4444";
    setTimeout(() => oldEl.style.color = "", duration);
  }

  onReady(function () {
    var S = window.SOS;
    var refreshInterval = 30000; // 30 seconds
    var lastUpdated = null;
    var criticalTcaIso = "2024-05-26T04:32:18Z";

    /* ---- Live Timestamp ---- */
    function updateTimestamp() {
      lastUpdated = new Date();
      var tsEl = document.getElementById("lastUpdated");
      if (tsEl) tsEl.textContent = lastUpdated.toLocaleTimeString();
    }
    updateTimestamp();
    setInterval(updateTimestamp, 1000);

    /* ---- Live TCA Countdown ---- */
    function fmtCountdown(iso) {
      if (!iso) return "—";
      var tca = new Date(iso).getTime();
      var now = Date.now();
      var diff = tca - now;
      var sign = diff < 0 ? "+" : "−";
      var abs = Math.abs(diff);
      var d = Math.floor(abs / 86400000);
      var h = Math.floor((abs % 86400000) / 3600000);
      var m = Math.floor((abs % 3600000) / 60000);
      var s = Math.floor((abs % 60000) / 1000);
      if (d > 0) return "T" + sign + d + "d " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      return "T" + sign + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    function updateTcaCountdown() {
      if (!criticalTcaIso) return;
      var el = document.querySelector(".alert-crit .am-row .v.red.num");
      if (el) el.textContent = fmtCountdown(criticalTcaIso);
    }
    setInterval(updateTcaCountdown, 1000);

    /* ---- Periodic Data Refresh Loop ---- */
    async function refreshAll() {
      try {
        /* Critical Alert (refresh every interval) */
        await S.api("/conjunctions/critical").then(function (c) {
          if (!c) return;
          var alertPair = document.querySelector(".alert-crit .pair");
          if (alertPair) fadeReplace(alertPair, c.satelliteId + ' \u2194 ' + c.objectId);

          var rows = document.querySelectorAll(".alert-crit .am-row");
          criticalTcaIso = c.tca;
          if (rows[0]) { var tcaEl = rows[0].querySelector(".v"); if (tcaEl) tcaEl.textContent = fmtCountdown(c.tca); }
          if (rows[1]) animateNumber(rows[1].querySelector(".v"), S.fmtPc(c.probabilityOfCollision), "", "", 300);
          if (rows[2]) animateNumber(rows[2].querySelector(".v"), S.fmtDist(c.missDistanceMeters), "", " m", 300);
          if (rows[3]) animateNumber(rows[3].querySelector(".v"), c.relativeVelocityKms + " km/s", "", "", 300);
          if (rows[4]) animateNumber(rows[4].querySelector(".v"), c.relativeSpeedKmh.toLocaleString() + " km/h", "", "", 300);

          var title = document.querySelector(".alert-crit .alert-title");
          if (title) title.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 9.5v4.5M12 17.2v.3" stroke-linecap="round"/></svg> CRITICAL ALERT';

          var badge = document.querySelector(".alert-crit .badge");
          if (badge) {
            badge.textContent = c.severity.toUpperCase() + " RISK";
            badge.className = "badge badge-" + (c.severity === "critical" ? "crit" : c.severity === "high" ? "high" : "med");
          }

          var viewBtn = document.querySelector(".alert-crit a.btn-primary");
          if (viewBtn) viewBtn.href = "conjunction.html?id=" + encodeURIComponent(c.id);

          var modalTitle = document.getElementById("alertMenuTitle");
          if (modalTitle) modalTitle.textContent = "Alert Actions \u00B7 " + c.satelliteId + " \u2194 " + c.objectId;
        });

        /* Alert Summary */
        await S.api("/conjunctions/summary?window=48h").then(function (data) {
          var donut = document.getElementById("alertDonut");
          if (donut) {
            var total = data.total || (data.critical + data.high + data.medium + data.low);
            var center = donut.closest(".donut-row").querySelector(".donut-center .big");
            if (center) fadeReplace(center, total);

            if (window.renderDonut) {
              renderDonut("alertDonut", [
                { v: data.critical || 0, color: "#EF4444", label: "Critical" },
                { v: data.high || 0, color: "#F97316", label: "High" },
                { v: data.medium || 0, color: "#F59E0B", label: "Medium" },
                { v: data.low || 0, color: "#38BDF8", label: "Low" },
              ]);
            }

            var legend = document.querySelectorAll(".legend .legend-row");
            if (legend[0]) fadeReplace(legend[0].innerHTML, '<span class="swatch" style="background:#EF4444;"></span>Critical<b>' + (data.critical || 0) + '</b>');
            if (legend[1]) fadeReplace(legend[1].innerHTML, '<span class="swatch" style="background:#F97316;"></span>High<b>' + (data.high || 0) + '</b>');
            if (legend[2]) fadeReplace(legend[2].innerHTML, '<span class="swatch" style="background:#F59E0B;"></span>Medium<b>' + (data.medium || 0) + '</b>');
            if (legend[3]) fadeReplace(legend[3].innerHTML, '<span class="swatch" style="background:#38BDF8;"></span>Low<b>' + (data.low || 0) + '</b>');
          }
        });

        /* Upcoming Conjunctions */
        await Promise.all([
          S.api("/conjunctions/upcoming?limit=5"),
          S.api("/catalog/stats"),
        ]).then(function (results) {
          var data = results[0];
          var stats = results[1];
          var tbody = document.querySelector(".cx-table tbody");
          if (tbody && data.items) {
            tbody.innerHTML = data.items.map(function (c) {
              var tcaStr = S.fmtTime(c.tca);
              var dist = S.fmtDist(c.missDistanceMeters);
              return '<tr class="' + S.rowClass(c.severity) + '" onclick="location.href=\'conjunction.html?id=' + encodeURIComponent(c.id) + '\'">' +
                '<td class="sat-id">' + c.satelliteId + '</td><td class="obj-id">' + c.objectId + '</td>' +
                '<td>' + tcaStr + '</td><td>' + dist + '</td>' +
                '<td><span class="pc-pill ' + S.pcClass(c.probabilityOfCollision) + '">' + c.probabilityOfCollision.toExponential(1) + '</span></td></tr>';
            }).join("");
          }
          var foot = document.querySelector(".cx-table").closest(".card").querySelector(".card-foot .card-sub");
          if (foot && stats) fadeReplace(foot, "Screened against " + stats.trackedObjects.toLocaleString() + " catalogued objects");
        });

        /* Next Maneuver */
        await S.api("/maneuvers/next").then(function (plan) {
          if (!plan) return;
          var hero = document.querySelector(".maneuver-hero");
          if (hero) {
            var satDiv = hero.querySelector("div div");
            if (satDiv) fadeReplace(satDiv, plan.satelliteId);
          }

          var kvGrid = document.querySelector(".kv-grid");
          if (kvGrid) {
            var earliest = S.fmtDateShort(plan.burnWindow.earliest);
            var latestTime = S.fmtTime(plan.burnWindow.latest);
            var earliestTime = S.fmtTime(plan.burnWindow.earliest);
            var kvs = kvGrid.querySelectorAll(".kv");
            if (kvs[0]) fadeReplace(kvs[0].querySelector(".v").textContent = earliest + ", " + earliestTime.replace(/:\d{2}$/, "") + "\u2013" + latestTime.replace(/:\d{2}$/, "") + " UTC");
            if (kvs[1]) animateNumber(kvs[1].querySelector(".v"), plan.deltaVmps + " m/s", "", "", 300);
            if (kvs[3]) fadeReplace(kvs[3].innerHTML, "\u2212" + plan.fuelImpactPct + "% <small>(" + plan.fuelImpactKg + " kg)</small>");
            if (kvs[4]) animateNumber(kvs[4].querySelector(".v"), S.fmtDuration(plan.burnDurationSec), "", "", 300);
          }

          var viewLink = document.querySelector(".card-foot a[href='maneuvers.html']");
          if (viewLink) viewLink.href = "maneuvers.html?conjunctionId=" + encodeURIComponent(plan.conjunctionId);
        });

        /* System Feed (refresh every 15s concept - fetch fresh) */
        await S.api("/events/feed?limit=5").then(function (events) {
          var feed = document.querySelector(".dash-row2 .feed");
          if (feed && Array.isArray(events)) {
            fadeReplace(feed.innerHTML, events.map(function (e) {
              return '<div class="feed-item"><span class="sev-dot ' + S.sevClass(e.severity || "low") + '"></span>' +
                '<div><div class="feed-text">' + (e.text || e.description || "") + '</div>' +
                '<div class="feed-time">' + S.timeAgo(e.timestamp) + '</div></div></div>';
            }).join(""));
          }
        });

        /* AI Insight Bar */
        await S.api("/ai/assessments").then(function (data) {
          var items = (data && data.items) || [];
          var a = items[0];
          if (!a) return;
          animateNumber(document.getElementById("aiPcPrev"), S.fmtPc(a.previousPc), "", "", 300);
          animateNumber(document.getElementById("aiPcNow"), S.fmtPc(a.probabilityOfCollision), "", "", 300);
          var driver = (a.trendDrivers && a.trendDrivers[0]) ? a.trendDrivers[0].change : "Updated tracking solution";
          animateNumber(document.getElementById("aiDriver"), driver, "", "", 300); // text, not number - but function handles it
          animateNumber(document.getElementById("aiConfLvl"), a.dataConfidence, "", "", 300);
          var lbl = document.querySelector(".ai-insight-lbl");
          if (lbl) {
            var trendLbl = a.riskTrend === "rapidly_increasing" ? "RISK RAPIDLY INCREASING"
              : a.riskTrend === "increasing" ? "RISK INCREASED"
              : a.riskTrend === "decreasing" ? "RISK DECREASING" : "RISK STABLE";
            fadeReplace(lbl, trendLbl);
            lbl.style.color = a.riskTrend === "decreasing" ? "var(--nominal)" : "var(--crit)";
          }
        });

        /* Orbital Coverage */
        await Promise.all([
          S.api("/groundstations"),
          S.api("/network/status"),
        ]).then(function (results) {
          var stations = results[0];
          var status = results[1];
          if (window.SOSCoverage) window.SOSCoverage.drawStations(stations);
          if (status) {
            animateNumber(document.getElementById("covOnline"), status.stationsOnline, "", "", 300);
            animateNumber(document.getElementById("covOffline"), status.stationsOffline, "", "", 300);
            animateNumber(document.getElementById("covPct"), status.coveragePct + "%", "", "", 300);
          }
          var pills = document.querySelectorAll(".coverage-stats .cs-pill");
          if (pills[0] && status) fadeReplace(pills[0].querySelector(".v").textContent, status.stationsOnline);
          if (pills[1] && status) fadeReplace(pills[1].querySelector(".v").textContent, status.stationsOffline);
          if (pills[2] && status) fadeReplace(pills[2].querySelector(".v").textContent, status.coveragePct + "%");
        });

        /* Conjunction Timeline */
        await S.api("/conjunctions/timeline?window=%C2%B112h").then(function (events) {
          var tracks = {};
          events.forEach(function (ev) {
            if (!tracks[ev.satelliteId]) tracks[ev.satelliteId] = [];
            tracks[ev.satelliteId].push(ev);
          });

          var container = document.querySelector(".cx-timeline");
          if (!container) return;
          var scale = container.querySelector(".tl-scale");
          container.innerHTML = "";
          if (scale) container.appendChild(scale);

          var nowMs = Date.now();
          var windowMs = 12 * 3600 * 1000;

          Object.keys(tracks).forEach(function (satId) {
            var trackDiv = document.createElement("div");
            trackDiv.className = "tl-track";
            trackDiv.innerHTML = '<span class="tl-name">' + satId + '</span>';

            var lane = document.createElement("div");
            lane.className = "tl-lane";
            lane.innerHTML = '<span class="now-line" style="left:50%;"></span>';

            tracks[satId].forEach(function (ev) {
              var pct = 50 + (ev.offsetHours / 12) * 50;
              pct = Math.max(0, Math.min(99, pct));
              var evClass = ev.severity === "critical" ? "ev-crit" : ev.severity === "high" ? "ev-high" : ev.severity === "medium" ? "ev-med" : "ev-low";
              var label = (ev.offsetHours >= 0 ? "+" : "") + ev.offsetHours + "h \u00B7 Pc " + ev.probabilityOfCollision.toExponential(1);
              var span = document.createElement("span");
              span.className = "tl-event " + evClass;
              span.style.left = pct + "%";
              span.setAttribute("data-label", label);
              lane.appendChild(span);
            });

            trackDiv.appendChild(lane);
            container.appendChild(trackDiv);
          });
        });

        /* Fuel Status */
        await S.api("/satellites/SAT-51656").then(function (sat) {
          if (!sat || !sat.fuel) return;
          var fuel = sat.fuel;
          if (window.renderFuelGauge) renderFuelGauge("fuelGauge", fuel.pctRemaining);

          var center = document.querySelector(".fuel-center");
          if (center) fadeReplace(center.querySelector(".pct"), fuel.pctRemaining + "%");

          var stats = document.querySelectorAll(".fuel-stats .fuel-stat");
          if (stats[0]) fadeReplace(stats[0].querySelector("b").textContent, fuel.totalKg + " kg");
          if (stats[1]) fadeReplace(stats[1].querySelector("b").textContent, fuel.usableKg + " kg");
          if (stats[2]) fadeReplace(stats[2].querySelector("b").textContent, fuel.reservedKg + " kg");
        });

      } catch (e) {
        console.error("[dashboard] refresh error:", e);
      }
    }

    /* Initial load + periodic refresh */
    refreshAll();
    setInterval(refreshAll, refreshInterval);
  });

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
})();