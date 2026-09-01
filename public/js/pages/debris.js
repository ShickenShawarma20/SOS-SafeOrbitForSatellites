/* SOS · SafeOrbitForSattelites — debris detail page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function classifyOrbit(altKm) {
    if (altKm < 2000) return "LEO";
    if (altKm < 35786) return "MEO";
    if (altKm >= 35786 && altKm <= 36000) return "GEO";
    return "HEO";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  onReady(function () {
    var S = window.SOS;
    var debrisId = S.param("id");

    /* ---- List view (no id) ---- */
    if (!debrisId) {
      document.getElementById("debrisListView").removeAttribute("hidden");
      document.getElementById("debrisDetailView").setAttribute("hidden", "");
      document.title = "Debris Catalog · SOS SafeOrbitForSattelites";
      var allDebris = [];
      var typeFilter = "all";
      var query = "";

      S.api("/debris?page=1&limit=100").then(function (data) {
        if (!data || !Array.isArray(data.items)) return;
        allDebris = data.items;
        setText("debrisListCount", allDebris.length + " objects");
        renderTable();
      }).catch(function (err) {
        console.error("debris list load failed:", err && err.message);
        var tb = document.getElementById("debrisTableBody");
        if (tb) tb.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--crit);">Failed to load debris catalog.</td></tr>';
      });

      function renderTable() {
        var tb = document.getElementById("debrisTableBody");
        if (!tb) return;
        var list = allDebris;
        if (typeFilter !== "all") list = list.filter(function (d) { return d.type === typeFilter; });
        if (query) {
          var q = query.toLowerCase();
          list = list.filter(function (d) {
            return (d.id + " " + d.name + " " + d.origin + " " + (d.noradId || "")).toLowerCase().indexOf(q) !== -1;
          });
        }
        if (!list.length) {
          tb.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--text-low);">No debris objects match the current filter.</td></tr>';
          return;
        }
        tb.innerHTML = list.map(function (d) {
          var e = d.elements || {};
          var typeLabel = d.type.replace("_", " ").toUpperCase();
          var riskBadge = d.riskLevel === "critical" ? "crit" : d.riskLevel === "high" ? "high" : d.riskLevel === "medium" ? "medium" : "nominal";
          return '<tr style="cursor:pointer;" onclick="location.href=\'debris.html?id=' + encodeURIComponent(d.id) + '\'">' +
            '<td class="obj-id" style="color:var(--high);font-weight:600;">' + esc(d.id) + '</td>' +
            '<td style="color:var(--text-hi);">' + esc(d.name) + '</td>' +
            '<td class="mono" style="font-family:var(--mono);">' + (d.noradId || "—") + '</td>' +
            '<td style="color:var(--text-mid);">' + typeLabel + '</td>' +
            '<td style="color:var(--text-mid);">' + esc(d.origin) + '</td>' +
            '<td class="mono" style="font-family:var(--mono);">' + (e.altitudeKm != null ? e.altitudeKm.toLocaleString() + " km" : "—") + '</td>' +
            '<td class="mono" style="font-family:var(--mono);">' + (e.inclinationDeg != null ? e.inclinationDeg + "\u00B0" : "—") + '</td>' +
            '<td><span class="badge badge-' + riskBadge + '">' + d.riskLevel.toUpperCase() + '</span></td>' +
            '</tr>';
        }).join("");
      }

      document.querySelectorAll("[data-debrisfilter]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll("[data-debrisfilter]").forEach(function (b) { b.classList.remove("on"); });
          btn.classList.add("on");
          typeFilter = btn.getAttribute("data-debrisfilter");
          renderTable();
        });
      });

      var search = document.getElementById("debrisSearch");
      if (search) search.addEventListener("input", function () { query = search.value.trim(); renderTable(); });

      return;
    }

    /* ---- Detail view (id present) ---- */
    document.getElementById("debrisDetailView").removeAttribute("hidden");
    document.getElementById("debrisListView").setAttribute("hidden", "");

    /* ---- Debris Profile ---- */
    S.api("/debris/" + encodeURIComponent(debrisId)).then(function (d) {
      if (!d) return;

      document.title = d.name + " · SOS SafeOrbitForSattelites";

      setText("debrisCrumbId", d.id);
      setText("debrisTitleName", d.name);
      setText("debrisDetailName", d.name);
      setText("debrisDescription", d.description);
      setText("debrisOriginSub", d.origin + " \u00B7 " + d.sourceMission);

      /* Type badge */
      var typeBadge = document.getElementById("debrisTypeBadge");
      if (typeBadge) {
        typeBadge.textContent = d.type.replace("_", " ").toUpperCase();
        typeBadge.className = "badge badge-info";
      }

      /* Risk badge */
      var riskBadge = document.getElementById("debrisRiskBadge");
      if (riskBadge) {
        var riskClass = d.riskLevel === "critical" ? "crit" : d.riskLevel === "high" ? "high" : d.riskLevel === "medium" ? "medium" : "nominal";
        riskBadge.textContent = d.riskLevel.toUpperCase();
        riskBadge.className = "badge badge-" + riskClass;
      }

      /* Identity tiles */
      setText("debrisType", d.type.replace("_", " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }));
      setText("debrisSourceMission", d.sourceMission);
      setText("debrisEventDate", S.fmtDateShort ? S.fmtDateShort(d.eventDate) : d.eventDate);
      setText("debrisMass", d.massKg.toLocaleString() + " kg");
      setText("debrisSize", d.sizeCategory.charAt(0).toUpperCase() + d.sizeCategory.slice(1));
      setText("debrisNoradId", d.noradId || "—");

      /* Orbital parameters */
      if (d.elements) {
        var e = d.elements;
        setText("debrisAltitude", e.altitudeKm + " km");
        setText("debrisInclination", e.inclinationDeg + "\u00B0");
        setText("debrisRaan", e.raanDeg + "\u00B0");
        setText("debrisEccentricity", e.eccentricity);
        setText("debrisPeriod", e.periodMin + " min");
        setText("debrisArgPerigee", e.argPerigeeDeg + "\u00B0");
        setText("debrisOrbitRegime", classifyOrbit(e.altitudeKm));
        setText("debrisOrbitContext", classifyOrbit(e.altitudeKm) + " orbit at " + e.altitudeKm + " km altitude");
      }

      /* Risk & Decay */
      var riskLevelEl = document.getElementById("debrisRiskLevel");
      if (riskLevelEl) {
        var rc = d.riskLevel === "critical" ? "var(--crit)" : d.riskLevel === "high" ? "var(--high)" : d.riskLevel === "medium" ? "var(--warn)" : "var(--nominal)";
        riskLevelEl.textContent = d.riskLevel.toUpperCase();
        riskLevelEl.style.color = rc;
      }
      setText("debrisDecayEstimate", d.decayEstimate);

      /* Risk note */
      var riskText = "";
      if (d.riskLevel === "critical") {
        riskText = "This debris object poses a significant collision risk to operational spacecraft in its orbital regime. Close monitoring and potential collision avoidance maneuvers may be required.";
      } else if (d.riskLevel === "high") {
        riskText = "This debris object is tracked closely due to its size and orbital characteristics. Multiple conjunction events with active satellites have been recorded.";
      } else if (d.riskLevel === "medium") {
        riskText = "This debris object is monitored periodically. While the current risk is moderate, its orbital decay may change the threat profile over time.";
      } else {
        riskText = "This debris object currently poses minimal risk to operational spacecraft. Continued tracking is maintained for catalog completeness.";
      }
      setText("debrisRiskText", riskText);

      /* Origin story */
      setText("debrisOriginStory", d.description);

      /* Conjunction link */
      var conjLink = document.getElementById("debrisConjunctionLink");
      if (conjLink) {
        conjLink.href = "conjunction.html?objectId=" + encodeURIComponent(d.id);
      }

      /* Initialize 3D orbit viewer */
      initOrbitViewer(d);

    }).catch(function (err) {
      console.error("debris load failed:", err && err.message);
    });

    /* ---- Conjunction History ---- */
    S.api("/debris/" + encodeURIComponent(debrisId) + "/conjunctions").then(function (conjs) {
      if (!Array.isArray(conjs) || !conjs.length) return;
      setText("debrisConjCount", conjs.length);
      setText("debrisConjunctionCount", conjs.length + " events tracked");

      var card = document.getElementById("debrisConjCard");
      if (card) card.removeAttribute("hidden");

      var tbody = document.getElementById("debrisConjTableBody");
      if (!tbody) return;
      tbody.innerHTML = conjs.map(function (c) {
        var riskBadge = c.severity === "critical" ? "crit" : c.severity === "high" ? "high" : c.severity === "medium" ? "medium" : "nominal";
        return '<tr style="cursor:pointer;" onclick="location.href=\'conjunction.html?id=' + encodeURIComponent(c.id) + '\'">' +
          '<td style="color:var(--accent);font-weight:600;">' + c.id + '</td>' +
          '<td>' + c.satelliteId + '</td>' +
          '<td><span class="badge badge-' + riskBadge + '">' + c.severity.toUpperCase() + '</span></td>' +
          '<td class="mono" style="font-family:var(--mono);">' + S.fmtTime(c.tca) + '</td>' +
          '<td><span class="pc-pill ' + S.pcClass(c.probabilityOfCollision) + '">' + c.probabilityOfCollision.toExponential(1) + '</span></td>' +
          '<td class="mono" style="font-family:var(--mono);">' + S.fmtDist(c.missDistanceMeters) + '</td>' +
          '</tr>';
      }).join("");
    }).catch(function () {});

    /* ---- 3D Orbit Viewer ---- */
    function initOrbitViewer(d) {
      var canvas = document.getElementById("debrisOrbitCanvas");
      if (!canvas || !window.SOSOrbitalViewer) return;

      var EARTH_R = 6378;
      var e = d.elements;
      var debrisSpec = {
        name: d.id,
        norad: d.noradId,
        kind: "debris",
        danger: d.riskLevel === "critical" || d.riskLevel === "high",
        color: d.riskLevel === "critical" ? "#ef4444" : d.riskLevel === "high" ? "#f59e0b" : "#94A3B8",
        kepler: {
          a_km: EARTH_R + (e.altitudeKm || 450),
          e: e.eccentricity || 0,
          i_deg: e.inclinationDeg || 0,
          raanDeg: e.raanDeg || 0,
          argPerigeeDeg: e.argPerigeeDeg || 0,
          periodMin: e.periodMin || 95,
          meanAnomaly0Deg: ((e.raanDeg || 0) + (e.argPerigeeDeg || 0)) % 360,
        },
      };

      var viewer = new SOSOrbitalViewer(canvas, {
        satellites: [debrisSpec],
        showConjunction: false,
        cameraDist: 16,
      });
      window.sosOrbitalViewer = viewer;
      setTimeout(function () { viewer.resize(); }, 250);
      window.addEventListener("load", function () { viewer.resize(); });
    }
  });
})();
