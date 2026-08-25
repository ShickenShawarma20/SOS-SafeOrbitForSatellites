/* SOS · SafeOrbitForSattelites — analytics page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (window.SOS) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var currentRange = "30d";

    /* ---- Analytics Summary ---- */
    function loadSummary(range) {
      S.api("/analytics/summary?range=" + range).then(function (data) {
        if (!data) return;
        var cards = document.querySelectorAll(".metric-card");
        if (cards[0]) {
          cards[0].querySelector(".metric-val").textContent = data.totalConjunctions;
          var trend0 = cards[0].querySelector(".metric-trend");
          if (trend0 && data.trends && data.trends.conjunctions) {
            var t = data.trends.conjunctions;
            var sign = t.changePct > 0 ? "\u25B2 " : "\u25BC ";
            trend0.textContent = sign + Math.abs(t.changePct).toFixed(1) + "% vs prev. period";
          }
        }
        if (cards[1]) {
          cards[1].querySelector(".metric-val").textContent = S.fmtPc(data.avgPc);
          var trend1 = cards[1].querySelector(".metric-trend");
          if (trend1 && data.trends && data.trends.avgPc) {
            var t1 = data.trends.avgPc;
            var sign1 = t1.changePct > 0 ? "\u25B2 " : "\u25BC ";
            trend1.textContent = sign1 + Math.abs(t1.changePct).toFixed(1) + "% vs prev. period";
          }
        }
        if (cards[2]) {
          cards[2].querySelector(".metric-val").textContent = data.maneuversExecuted;
          var trend2 = cards[2].querySelector(".metric-trend");
          if (trend2 && data.trends && data.trends.maneuvers) {
            var t2 = data.trends.maneuvers;
            var sign2 = t2.changePct > 0 ? "\u25B2 " : "\u25BC ";
            trend2.textContent = sign2 + Math.abs(t2.current - t2.previous) + " vs prev. period";
          }
        }
        if (cards[3]) {
          cards[3].querySelector(".metric-val").textContent = data.riskReductionPct + "%";
          var trend3 = cards[3].querySelector(".metric-trend");
          if (trend3 && data.trends && data.trends.riskReduction) {
            var t3 = data.trends.riskReduction;
            var sign3 = t3.changePct > 0 ? "\u25B2 " : "\u25BC ";
            trend3.textContent = sign3 + Math.abs(t3.changePct).toFixed(1) + " pts vs prev. period";
          }
        }
      }).catch(function () {});
    }

    loadSummary(currentRange);

    /* ---- Time range chips ---- */
    document.querySelectorAll(".page-head-actions .btn-sm").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".page-head-actions .btn-sm").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var range = btn.textContent.trim().toLowerCase();
        if (range === "7d") currentRange = "7d";
        else if (range === "14d") currentRange = "14d";
        else currentRange = "30d";
        loadSummary(currentRange);
      });
    });

    /* ---- Export button ---- */
    var exportBtn = document.querySelector(".page-head-actions .btn:not(.btn-sm)");
    if (exportBtn) {
      exportBtn.onclick = function () {
        S.api("/analytics/report/export?range=" + currentRange + "&format=pdf").then(function (data) {
          alert("Report generated at " + data.generatedAt + " (format: " + data.format + ")");
        }).catch(function () {});
      };
    }

    /* ---- Chart Data: Conjunctions Over Time ---- */
    S.api("/analytics/conjunctions-over-time?range=" + currentRange + "&bucket=week").then(function (data) {
      if (data && data.series) {
        /* Store for charts.js to pick up */
        window.__chartTimeData = data.series;
      }
    }).catch(function () {});

    /* ---- Chart Data: By Severity ---- */
    S.api("/analytics/by-severity?groupBy=regime").then(function (data) {
      if (data) {
        window.__chartSeverityData = data;
      }
    }).catch(function () {});

    /* ---- Chart Data: Top Objects ---- */
    S.api("/analytics/top-objects?range=" + currentRange + "&limit=5").then(function (data) {
      if (Array.isArray(data)) {
        window.__chartTopObjectsData = data;
      }
    }).catch(function () {});

    /* ---- Chart Data: Altitude Bands ---- */
    S.api("/analytics/by-altitude-band?range=" + currentRange).then(function (data) {
      if (Array.isArray(data)) {
        window.__chartAltitudeData = data;
      }
    }).catch(function () {});
  });
})();
