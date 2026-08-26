/* SOS · SafeOrbitForSattelites — dashboard page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (window.SOS) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;

    setText("skeleton", "Loading\u2026");

    /* ---- Critical Alert ---- */
    S.api("/conjunctions/critical").then(function (c) {
      if (!c) return;
      var alertPair = document.querySelector(".alert-crit .pair");
      if (alertPair) alertPair.innerHTML = c.satelliteId + ' <span class="arrow">\u2194</span> ' + c.objectId;

      var rows = document.querySelectorAll(".alert-crit .am-row");
      if (rows[0]) rows[0].querySelector(".v").textContent = S.fmtTime(c.tca);
      if (rows[1]) rows[1].querySelector(".v").textContent = S.fmtPc(c.probabilityOfCollision);
      if (rows[2]) rows[2].querySelector(".v").textContent = S.fmtDist(c.missDistanceMeters);
      if (rows[3]) rows[3].querySelector(".v").textContent = c.relativeVelocityKms + " km/s";
      if (rows[4]) rows[4].querySelector(".v").textContent = c.relativeSpeedKmh.toLocaleString() + " km/h";

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

      /* Watchlist/Acknowledge buttons */
      var modalBtns = document.querySelectorAll("#alertMenuModal .modal-foot .btn");
      if (modalBtns[0]) {
        modalBtns[0].onclick = function () {
          S.api("/conjunctions/" + encodeURIComponent(c.id) + "/watchlist", { method: "POST" })
            .then(function () { modalBtns[0].textContent = "Added \u2713"; });
        };
      }
      if (modalBtns[1]) {
        modalBtns[1].onclick = function () {
          S.api("/conjunctions/" + encodeURIComponent(c.id) + "/acknowledge", { method: "POST" })
            .then(function () { location.reload(); });
        };
      }
    }).catch(function () {});

    /* ---- Alert Summary ---- */
    S.api("/conjunctions/summary?window=48h").then(function (data) {
      var donut = document.getElementById("alertDonut");
      if (donut) {
        var total = data.total || (data.critical + data.high + data.medium + data.low);
        var center = donut.closest(".donut-row").querySelector(".donut-center .big");
        if (center) center.textContent = total;

        if (window.renderDonut) {
          renderDonut("alertDonut", [
            { v: data.critical || 0, color: "#EF4444", label: "Critical" },
            { v: data.high || 0, color: "#F97316", label: "High" },
            { v: data.medium || 0, color: "#F59E0B", label: "Medium" },
            { v: data.low || 0, color: "#38BDF8", label: "Low" },
          ]);
        }

        var legend = document.querySelectorAll(".legend .legend-row");
        if (legend[0]) legend[0].innerHTML = '<span class="swatch" style="background:#EF4444;"></span>Critical<b>' + (data.critical || 0) + '</b>';
        if (legend[1]) legend[1].innerHTML = '<span class="swatch" style="background:#F97316;"></span>High<b>' + (data.high || 0) + '</b>';
        if (legend[2]) legend[2].innerHTML = '<span class="swatch" style="background:#F59E0B;"></span>Medium<b>' + (data.medium || 0) + '</b>';
        if (legend[3]) legend[3].innerHTML = '<span class="swatch" style="background:#38BDF8;"></span>Low<b>' + (data.low || 0) + '</b>';
      }
    }).catch(function () {});

    /* ---- Upcoming Conjunctions ---- */
    Promise.all([
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
      if (foot && stats) foot.textContent = "Screened against " + stats.trackedObjects.toLocaleString() + " catalogued objects";
    }).catch(function () {});

    /* ---- Next Maneuver ---- */
    S.api("/maneuvers/next").then(function (plan) {
      if (!plan) return;
      var hero = document.querySelector(".maneuver-hero");
      if (hero) {
        var satDiv = hero.querySelector("div div");
        if (satDiv) satDiv.textContent = plan.satelliteId;
      }

      var kvGrid = document.querySelector(".kv-grid");
      if (kvGrid) {
        var earliest = S.fmtDateShort(plan.burnWindow.earliest);
        var latestTime = S.fmtTime(plan.burnWindow.latest);
        var earliestTime = S.fmtTime(plan.burnWindow.earliest);
        var kvs = kvGrid.querySelectorAll(".kv");
        if (kvs[0]) kvs[0].querySelector(".v").textContent = earliest + ", " + earliestTime.replace(/:\d{2}$/, "") + "\u2013" + latestTime.replace(/:\d{2}$/, "") + " UTC";
        if (kvs[1]) kvs[1].querySelector(".v").textContent = plan.deltaVmps + " m/s";
        if (kvs[3]) kvs[3].querySelector(".v").innerHTML = "\u2212" + plan.fuelImpactPct + "% <small>(" + plan.fuelImpactKg + " kg)</small>";
        if (kvs[4]) kvs[4].querySelector(".v").textContent = S.fmtDuration(plan.burnDurationSec);
      }

      var viewLink = document.querySelector(".card-foot a[href='maneuvers.html']");
      if (viewLink) viewLink.href = "maneuvers.html?conjunctionId=" + encodeURIComponent(plan.conjunctionId);
    }).catch(function () {});

    /* ---- System Feed ---- */
    S.api("/events/feed?limit=5").then(function (events) {
      var feed = document.querySelector(".dash-row2 .feed");
      if (feed && Array.isArray(events)) {
        feed.innerHTML = events.map(function (e) {
          return '<div class="feed-item"><span class="sev-dot ' + S.sevClass(e.severity || "low") + '"></span>' +
            '<div><div class="feed-text">' + (e.text || e.description || "") + '</div>' +
            '<div class="feed-time">' + S.timeAgo(e.timestamp) + '</div></div></div>';
        }).join("");
      }
    }).catch(function () {});

    /* ---- AI Insight Bar ---- */
    S.api("/ai/assessments").then(function (data) {
      var items = (data && data.items) || [];
      var a = items[0];
      if (!a) return;
      setText("aiPcPrev", S.fmtPc(a.previousPc));
      setText("aiPcNow", S.fmtPc(a.probabilityOfCollision));
      var driver = (a.trendDrivers && a.trendDrivers[0]) ? a.trendDrivers[0].change : "Updated tracking solution";
      setText("aiDriver", driver);
      setText("aiConfLvl", a.dataConfidence);
      var lbl = document.querySelector(".ai-insight-lbl");
      if (lbl) {
        var trendLbl = a.riskTrend === "rapidly_increasing" ? "RISK RAPIDLY INCREASING"
          : a.riskTrend === "increasing" ? "RISK INCREASED"
          : a.riskTrend === "decreasing" ? "RISK DECREASING" : "RISK STABLE";
        lbl.textContent = trendLbl;
        lbl.style.color = a.riskTrend === "decreasing" ? "var(--nominal)" : "var(--crit)";
      }
    }).catch(function () {});

    /* ---- Orbital Coverage ---- */
    Promise.all([
      S.api("/groundstations"),
      S.api("/network/status"),
    ]).then(function (results) {
      var stations = results[0];
      var status = results[1];
      if (window.SOSCoverage) window.SOSCoverage.drawStations(stations);
      if (status) {
        setText("covOnline", status.stationsOnline);
        setText("covOffline", status.stationsOffline);
        setText("covPct", status.coveragePct + "%");
      }
      /* Update coverage stats pills */
      var pills = document.querySelectorAll(".coverage-stats .cs-pill");
      if (pills[0] && status) { pills[0].querySelector(".v").textContent = status.stationsOnline; }
      if (pills[1] && status) { pills[1].querySelector(".v").textContent = status.stationsOffline; }
      if (pills[2] && status) { pills[2].querySelector(".v").textContent = status.coveragePct + "%"; }
    }).catch(function () {});

    /* ---- Conjunction Timeline ---- */
    S.api("/conjunctions/timeline?window=%C2%B112h").then(function (events) {
      var tracks = {};
      events.forEach(function (ev) {
        if (!tracks[ev.satelliteId]) tracks[ev.satelliteId] = [];
        tracks[ev.satelliteId].push(ev);
      });

      var container = document.querySelector(".cx-timeline");
      if (!container) return;
      /* Remove existing tracks, keep scale */
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
    }).catch(function () {});

    /* ---- Fuel Status ---- */
    S.api("/satellites/SAT-51656").then(function (sat) {
      if (!sat || !sat.fuel) return;
      var fuel = sat.fuel;
      if (window.renderFuelGauge) renderFuelGauge("fuelGauge", fuel.pctRemaining);

      var center = document.querySelector(".fuel-center");
      if (center) {
        center.querySelector(".pct").textContent = fuel.pctRemaining + "%";
      }

      var stats = document.querySelectorAll(".fuel-stats .fuel-stat");
      if (stats[0]) stats[0].querySelector("b").textContent = fuel.totalKg + " kg";
      if (stats[1]) stats[1].querySelector("b").textContent = fuel.usableKg + " kg";
      if (stats[2]) stats[2].querySelector("b").textContent = fuel.reservedKg + " kg";
    }).catch(function () {});

    /* ---- WebSocket: live conjunction updates ---- */
    S.ws.on("conjunction.new", function (data) {
      var badge = document.getElementById("navBadge_conjunctions");
      if (badge) {
        var current = parseInt(badge.textContent) || 0;
        badge.textContent = current + 1;
      }
    });

    S.ws.on("event.feed", function (data) {
      var feed = document.querySelector(".dash-row2 .feed");
      if (feed && data) {
        var item = document.createElement("div");
        item.className = "feed-item";
        item.innerHTML = '<span class="sev-dot ' + S.sevClass(data.severity || "low") + '"></span>' +
          '<div><div class="feed-text">' + (data.text || "") + '</div>' +
          '<div class="feed-time">just now</div></div>';
        feed.insertBefore(item, feed.firstChild);
        if (feed.children.length > 10) feed.removeChild(feed.lastChild);
      }
    });
  });

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
})();
