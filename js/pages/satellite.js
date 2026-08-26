/* SOS · SafeOrbitForSattelites — satellite detail page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (window.SOS) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var satId = S.param("id");

    /* ---- List view (no id) ---- */
    if (!satId) {
      document.getElementById("satListView").removeAttribute("hidden");
      document.getElementById("satDetailView").setAttribute("hidden", "");
      document.title = "Satellite Registry · SOS SafeOrbitForSattelites";
      var allSats = [];
      var statusFilter = "all";
      var query = "";

      S.api("/satellites?page=1&limit=100").then(function (data) {
        if (!data || !Array.isArray(data.items)) return;
        allSats = data.items;
        setText("satListCount", allSats.length + " satellites");
        renderTable();
      }).catch(function (err) {
        console.error("sat list load failed:", err && err.message);
        var tb = document.getElementById("satTableBody");
        if (tb) tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--crit);">Failed to load satellites.</td></tr>';
      });

      function renderTable() {
        var tb = document.getElementById("satTableBody");
        if (!tb) return;
        var list = allSats;
        if (statusFilter !== "all") list = list.filter(function (s) { return s.status === statusFilter; });
        if (query) {
          var q = query.toLowerCase();
          list = list.filter(function (s) {
            return (s.id + " " + s.name + " " + s.noradId).toLowerCase().indexOf(q) !== -1;
          });
        }
        if (!list.length) {
          tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--text-low);">No satellites match the current filter.</td></tr>';
          return;
        }
        tb.innerHTML = list.map(function (s) {
          var e = s.elements || {};
          var badge = s.status === "operational" ? "nominal" : s.status === "degraded" ? "high" : s.status === "standby" ? "medium" : "crit";
          return '<tr style="cursor:pointer;" onclick="location.href=\'satellite.html?id=' + encodeURIComponent(s.id) + '\'">' +
            '<td class="sat-id" style="color:var(--accent);font-weight:600;">' + s.id + '</td>' +
            '<td>' + s.name + '</td>' +
            '<td class="mono" style="font-family:var(--mono);">' + s.noradId + '</td>' +
            '<td style="color:var(--text-mid);">' + s.type + '</td>' +
            '<td>' + s.operator + '</td>' +
            '<td><span class="badge badge-' + badge + '">' + s.status.toUpperCase() + '</span></td>' +
            '<td class="mono" style="font-family:var(--mono);">' + (e.altitudeKm != null ? e.altitudeKm.toLocaleString() + " km" : "—") + '</td>' +
            '<td class="mono" style="font-family:var(--mono);">' + (e.inclinationDeg != null ? e.inclinationDeg + "\u00B0" : "—") + '</td>' +
            '<td style="color:var(--text-mid);">' + (s.orbitClass || "—") + '</td>' +
            '</tr>';
        }).join("");
      }

      document.querySelectorAll("[data-satfilter]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll("[data-satfilter]").forEach(function (b) { b.classList.remove("on"); });
          btn.classList.add("on");
          statusFilter = btn.getAttribute("data-satfilter");
          renderTable();
        });
      });

      var search = document.getElementById("satSearch");
      if (search) search.addEventListener("input", function () { query = search.value.trim(); renderTable(); });

      return;
    }

    /* ---- Detail view (id present) ---- */
    document.getElementById("satDetailView").removeAttribute("hidden");
    document.getElementById("satListView").setAttribute("hidden", "");

    /* ---- Satellite Profile ---- */
    S.api("/satellites/" + encodeURIComponent(satId)).then(function (sat) {
      if (!sat) return;

      document.title = sat.id + " \u00B7 SOS SafeOrbitForSattelites";

      /* Header */
      var h1 = document.querySelector(".page-head h1");
      if (h1) {
        h1.innerHTML = sat.id +
          ' <span class="badge badge-' + (sat.status === "operational" ? "nominal" : sat.status === "critical" ? "crit" : "high") + '">' + sat.status.toUpperCase() + '</span>';
      }

      /* Check for critical conjunctions */
      S.api("/satellites/" + encodeURIComponent(satId) + "/conjunctions?severity=critical&active=true").then(function (conjs) {
        if (conjs && conjs.length > 0 && h1) {
          h1.innerHTML += ' <span class="badge badge-crit">' + conjs.length + ' CRITICAL CONJUNCTION' + (conjs.length > 1 ? "S" : "") + '</span>';
        }
      }).catch(function () {});

      var crumb = document.querySelector(".crumb");
      if (crumb) crumb.textContent = "Satellite Registry / " + sat.type;

      /* Identity strip */
      var tiles = document.querySelectorAll(".detail-grid .info-tile");
      if (tiles[0]) tiles[0].querySelector(".v").textContent = sat.type;
      if (tiles[1]) tiles[1].querySelector(".v").textContent = sat.operator;
      if (tiles[2]) tiles[2].querySelector(".v").textContent = S.fmtDateShort(sat.launchDate);
      if (tiles[3]) tiles[3].querySelector(".v").textContent = sat.massKg.toLocaleString() + " kg";
      if (tiles[4]) tiles[4].querySelector(".v").textContent = sat.noradId;

      /* Mission elapsed */
      if (tiles[5]) {
        var launch = new Date(sat.launchDate);
        var now = new Date();
        var diffMs = now - launch;
        var years = Math.floor(diffMs / (365.25 * 24 * 3600 * 1000));
        var days = Math.floor((diffMs % (365.25 * 24 * 3600 * 1000)) / (24 * 3600 * 1000));
        tiles[5].querySelector(".v").textContent = years + "y " + days + "d";
      }

      /* Fuel */
      if (sat.fuel) {
        var fuel = sat.fuel;
        if (window.renderFuelGauge) renderFuelGauge("satFuelGauge", fuel.pctRemaining);
        var fuelCenter = document.querySelector("#satFuelGauge + .fuel-center");
        if (!fuelCenter) fuelCenter = document.querySelector(".fuel-center");
        if (fuelCenter) fuelCenter.querySelector(".pct").textContent = fuel.pctRemaining + "%";

        var fuelStats = document.querySelectorAll(".fuel-stats .fuel-stat");
        if (fuelStats[0]) fuelStats[0].querySelector("b").textContent = fuel.totalKg + " kg";
        if (fuelStats[1]) fuelStats[1].querySelector("b").textContent = fuel.usableKg + " kg";
        if (fuelStats[2]) fuelStats[2].querySelector("b").textContent = fuel.reservedKg + " kg";
        if (fuelStats[3]) fuelStats[3].querySelector("b").textContent = fuel.estEndOfLife;
      }

      /* Current Orbit */
      if (sat.elements) {
        var e = sat.elements;
        var orbitGrid = document.querySelectorAll(".three-col .card:last-child .detail-grid .info-tile");
        if (orbitGrid[0]) orbitGrid[0].querySelector(".v").textContent = e.altitudeKm + " km";
        if (orbitGrid[1]) orbitGrid[1].querySelector(".v").textContent = e.inclinationDeg + "\u00B0";
        if (orbitGrid[2]) orbitGrid[2].querySelector(".v").textContent = e.raanDeg + "\u00B0";
        if (orbitGrid[3]) orbitGrid[3].querySelector(".v").textContent = e.eccentricity;
        if (orbitGrid[4]) orbitGrid[4].querySelector(".v").textContent = e.periodMin + " min";
        if (orbitGrid[5]) orbitGrid[5].querySelector(".v").textContent = e.argPerigeeDeg + "\u00B0";

        var orbitSub = document.querySelector(".three-col .card:last-child .card-sub");
        if (orbitSub) orbitSub.textContent = sat.orbitClass || "SSO \u00B7 Sun-synchronous";
      }

      /* Download TLE button */
      var tleBtn = document.querySelector(".page-head-actions .btn:first-child");
      if (tleBtn) {
        tleBtn.onclick = function () {
          S.api("/satellites/" + encodeURIComponent(satId) + "/tle").then(function (tle) {
            var blob = new Blob([tle.line1 + "\n" +tle.line2], { type: "text/plain" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = satId + "_TLE.txt";
            a.click();
            URL.revokeObjectURL(url);
          });
        };
      }
    }).catch(function () {});

    /* ---- Subsystem Status ---- */
    S.api("/satellites/" + encodeURIComponent(satId) + "/subsystems").then(function (subsystems) {
      if (!Array.isArray(subsystems)) return;
      var list = document.querySelector(".status-list");
      if (!list) return;
      list.innerHTML = subsystems.map(function (s) {
        var isOk = s.status === "nominal";
        return '<div class="status-row"><span class="sys-name">' + (s.name || s.id) + '</span>' +
          '<span class="status-' + (isOk ? "ok" : "warn") + '">' + (s.status.charAt(0).toUpperCase() + s.status.slice(1)) + '</span></div>';
      }).join("");
    }).catch(function () {});

    /* ---- Recent Events ---- */
    S.api("/satellites/" + encodeURIComponent(satId) + "/events").then(function (events) {
      if (!Array.isArray(events)) return;
      var feed = document.querySelectorAll(".two-col .feed")[0];
      if (!feed) return;
      if (events.length === 0) {
        feed.innerHTML = '<div class="feed-item"><span class="sev-dot sev-blue"></span><div><div class="feed-text">No recent events</div></div></div>';
        return;
      }
      feed.innerHTML = events.slice(0, 8).map(function (e) {
        return '<div class="feed-item"><span class="sev-dot ' + S.sevClass(e.severity || "low") + '"></span>' +
          '<div><div class="feed-text">' + (e.text || e.description || "") + '</div>' +
          '<div class="feed-time">' + S.timeAgo(e.timestamp) + '</div></div></div>';
      }).join("");
    }).catch(function () {});

    /* ---- Upcoming Ground Passes ---- */
    S.api("/satellites/" + encodeURIComponent(satId) + "/passes?hours=24").then(function (passes) {
      if (!Array.isArray(passes)) return;
      var tbody = document.querySelectorAll(".two-col .cx-table tbody")[0];
      if (!tbody) return;
      tbody.innerHTML = passes.slice(0, 6).map(function (p) {
        return '<tr><td>' + S.fmtTime(p.aos) + '</td>' +
          '<td>' + p.stationName + '</td>' +
          '<td>' + S.fmtDuration(p.durationSec) + '</td>' +
          '<td>' + p.maxElevationDeg + '\u00B0</td></tr>';
      }).join("");
    }).catch(function () {});
  });

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
})();
