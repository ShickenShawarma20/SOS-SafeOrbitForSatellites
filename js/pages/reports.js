/* SOS · SafeOrbitForSattelites — reports page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var UI = window.SOSUI;

    function loadReport() {
      S.api("/analytics/report").then(function (r) {
        if (!r) return;

        /* Summary metrics */
        var s = r.summary;
        setText("rptTotal", s.totalConjunctions);
        setText("rptCritical", s.critical);
        setText("rptManeuvers", s.maneuversPlanned);
        setText("rptRiskReduction", s.avgRiskReductionPct + "%");
        setText("rptAvgPc", S.fmtPc(s.avgPc));
        setText("rptAvgMiss", S.fmtDist(s.avgMissDistanceM));
        setText("rptAvgRelV", s.avgRelVelocityKms + " km/s");
        setText("rptActive", s.activeAlerts);
        setText("rptTotalDv", s.totalDeltaV + " m/s");
        setText("rptTotalFuel", s.totalFuelImpactKg + " kg");

        /* Conjunction table */
        var conjBody = document.getElementById("rptConjTable");
        if (conjBody && r.conjunctions) {
          conjBody.innerHTML = r.conjunctions.map(function (c) {
            var sevClass = c.severity === "critical" ? "row-crit" : c.severity === "high" ? "row-high" : c.severity === "medium" ? "row-med" : "";
            var status = c.acknowledged ? '<span style="color:var(--text-low);">Ack</span>' : '<span style="color:var(--crit);">Active</span>';
            return '<tr class="' + sevClass + '">' +
              '<td class="mono" style="font-size:10px;">' + c.id + '</td>' +
              '<td class="sat-id">' + c.satelliteId + '</td>' +
              '<td class="obj-id">' + c.objectId + '</td>' +
              '<td>' + c.severity.charAt(0).toUpperCase() + c.severity.slice(1) + '</td>' +
              '<td><span class="pc-pill ' + S.pcClass(c.probabilityOfCollision) + '">' + c.probabilityOfCollision.toExponential(1) + '</span></td>' +
              '<td>' + S.fmtDist(c.missDistanceMeters) + '</td>' +
              '<td>' + c.relativeVelocityKms + ' km/s</td>' +
              '<td>' + status + '</td></tr>';
          }).join("");
        }

        /* Per-satellite risk */
        var satBody = document.getElementById("rptSatRisk");
        if (satBody && r.satelliteRisk) {
          satBody.innerHTML = r.satelliteRisk.map(function (s) {
            var riskCol = s.riskLevel === "critical" ? "var(--crit)" : s.riskLevel === "high" ? "var(--high)" : s.riskLevel === "medium" ? "var(--warn)" : "var(--text-mid)";
            return '<tr>' +
              '<td class="sat-id">' + s.satelliteId + '</td>' +
              '<td>' + s.conjunctions + '</td>' +
              '<td><span class="num">' + S.fmtPc(s.maxPc) + '</span></td>' +
              '<td>' + S.fmtDist(s.minMissM) + '</td>' +
              '<td style="color:' + riskCol + ';font-weight:700;">' + s.riskLevel.toUpperCase() + '</td></tr>';
          }).join("");
        }

        /* CDM evolution */
        var cdmBody = document.getElementById("rptCdmTable");
        if (cdmBody && r.cdmEvolution) {
          cdmBody.innerHTML = r.cdmEvolution.map(function (cdm, i) {
            var trend = "";
            if (i > 0) {
              var prev = r.cdmEvolution[i - 1].probabilityOfCollision;
              if (cdm.probabilityOfCollision > prev) trend = '<td style="color:var(--crit);">▲ ' + cdm.trendPct + '%</td>';
              else trend = '<td style="color:var(--nominal);">▼</td>';
            } else trend = '<td style="color:var(--text-mid);">—</td>';
            return '<tr><td class="mono">' + cdm.id + '</td>' +
              '<td>' + S.fmtDateShort(cdm.epoch) + ' ' + S.fmtTime(cdm.epoch).replace(/:\d{2}$/, "") + '</td>' +
              '<td>' + S.fmtDist(cdm.missDistanceMeters) + '</td>' +
              '<td><span class="pc-pill ' + S.pcClass(cdm.probabilityOfCollision) + '">' + cdm.probabilityOfCollision.toExponential(1) + '</span></td>' +
              trend + '</tr>';
          }).join("");
        }

        /* Maneuver plans */
        var planBody = document.getElementById("rptPlanTable");
        if (planBody && r.maneuverPlans) {
          planBody.innerHTML = r.maneuverPlans.map(function (p) {
            var recBadge = p.recommended ? '<span class="badge badge-nominal" style="font-size:8px;padding:1px 5px;margin-right:4px;">REC</span>' : "";
            return '<tr>' +
              '<td>' + recBadge + p.label + '</td>' +
              '<td class="sat-id">' + p.satelliteId + '</td>' +
              '<td class="num">' + p.deltaVmps + ' m/s</td>' +
              '<td class="num">' + p.fuelImpactKg + ' kg</td>' +
              '<td class="num" style="color:var(--nominal);">' + p.newMissDistanceKm + ' km</td>' +
              '<td class="num" style="color:var(--nominal);">' + p.riskReductionPct + '%</td>' +
              '<td>' + p.approvalStatus + '</td></tr>';
          }).join("");
        }
      }).catch(function () {
        if (UI) UI.toast("Failed to load report data", "error");
      });
    }

    loadReport();

    /* Refresh button */
    var refreshBtn = document.getElementById("reportRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      if (UI) UI.toast("Refreshing report data…", "info", 1400);
      loadReport();
    });

    /* Export CSV */
    var exportBtn = document.getElementById("reportExportCsv");
    if (exportBtn) exportBtn.addEventListener("click", function () {
      window.open(S.api_base ? S.api_base + "/analytics/report/export?format=csv" : "/api/v1/analytics/report/export?format=csv", "_blank");
    });

    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  });
})();
