/* SOS · SafeOrbitForSattelites — settings page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;

    /* ---- Load settings ---- */
    S.api("/settings").then(function (settings) {
      if (!settings) return;

      /* Alert thresholds */
      if (settings.alertThresholds) {
        var t = settings.alertThresholds;
        setInput("critPc", t.criticalPc);
        setInput("highPc", t.highPc);
        setInput("medPc", t.mediumPc);
        setInput("lowPc", t.lowPc);
        setInput("missWarn", t.missDistanceWarningM);
        setInput("missCrit", t.missDistanceCriticalM);
      }

      /* Screening volumes */
      if (settings.screeningVolumes) {
        var sv = settings.screeningVolumes;
        setInput("volLeo", (sv.leo || []).join(", "));
        setInput("volMeo", (sv.meo || []).join(", "));
        setInput("volGeo", (sv.geo || []).join(", "));
        setInput("volHeo", (sv.heo || []).join(", "));
      }

      /* Notification prefs */
      if (settings.notificationPrefs) {
        var np = settings.notificationPrefs;
        setToggle("notifEmail", np.email);
        setToggle("notifDesktop", np.desktop);
        setToggle("notifCritOnly", np.criticalOnly);
        setInput("notifDigest", np.digestIntervalHours);
      }

      /* Layer defaults */
      if (settings.layerDefaults) {
        var ld = settings.layerDefaults;
        setToggle("layerTraj", ld.showTrajectory);
        setToggle("layerDebris", ld.showDebris);
        setToggle("layerConj", ld.showConjunction);
        setToggle("layerGS", ld.showGroundStations);
        setToggle("layerCov", ld.showCoverage);
      }

      /* AI engine config */
      if (settings.aiConfig) {
        var ai = settings.aiConfig;
        setToggle("aiScreening", ai.conjunctionScreening);
        setToggle("aiRiskAssess", ai.continuousRiskAssessment);
        setToggle("aiRecs", ai.maneuverRecommendations);
        setToggle("aiAutoSim", ai.automaticSimulation);
        setToggle("aiAutonomous", ai.autonomousExecution);
        if (ai.thresholds) {
          var at = ai.thresholds;
          setInput("aiCritPc", at.criticalPc);
          setInput("aiHighPc", at.highRiskPc);
          setInput("aiMinMiss", at.minimumMissDistanceM);
          setInput("aiHorizon", at.maximumPredictionHorizonH);
          setInput("aiMinConf", at.minimumDataConfidence);
        }
      }
    }).catch(function () {});

    /* ---- Load audit log ---- */
    S.api("/audit").then(function (entries) {
      var container = document.getElementById("auditLog");
      if (!container) return;
      if (!Array.isArray(entries) || entries.length === 0) {
        container.innerHTML = '<div style="color:var(--text-low);font-size:12px;">No audit entries found.</div>';
        return;
      }
      container.innerHTML = entries.map(function (e) {
        return '<div class="audit-item">' +
          '<span class="action">' + formatAction(e.action) + '</span>' +
          ' by <span class="op">' + (e.operator || "System") + '</span> ' +
          '<span class="time">' + formatTime(e.timestamp) + '</span>' +
          (e.details ? '<div style="color:var(--text-low);font-size:11px;margin-top:3px;">' + JSON.stringify(e.details) + '</div>' : '') +
          '</div>';
      }).join("");
    }).catch(function () {});

    /* ---- Toggle clicks ---- */
    document.querySelectorAll(".toggle").forEach(function (el) {
      el.addEventListener("click", function () {
        el.classList.toggle("on");
      });
    });

    /* ---- Save button ---- */
    var saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var payload = {
          alertThresholds: {
            criticalPc: getNum("critPc"),
            highPc: getNum("highPc"),
            mediumPc: getNum("medPc"),
            lowPc: getNum("lowPc"),
            missDistanceWarningM: getNum("missWarn"),
            missDistanceCriticalM: getNum("missCrit"),
          },
          screeningVolumes: {
            leo: parseVol("volLeo"),
            meo: parseVol("volMeo"),
            geo: parseVol("volGeo"),
            heo: parseVol("volHeo"),
          },
          notificationPrefs: {
            email: isToggleOn("notifEmail"),
            desktop: isToggleOn("notifDesktop"),
            criticalOnly: isToggleOn("notifCritOnly"),
            digestIntervalHours: getNum("notifDigest"),
          },
          layerDefaults: {
            showTrajectory: isToggleOn("layerTraj"),
            showDebris: isToggleOn("layerDebris"),
            showConjunction: isToggleOn("layerConj"),
            showGroundStations: isToggleOn("layerGS"),
            showCoverage: isToggleOn("layerCov"),
          },
          aiConfig: {
            conjunctionScreening: isToggleOn("aiScreening"),
            continuousRiskAssessment: isToggleOn("aiRiskAssess"),
            maneuverRecommendations: isToggleOn("aiRecs"),
            automaticSimulation: isToggleOn("aiAutoSim"),
            autonomousExecution: isToggleOn("aiAutonomous"),
            thresholds: {
              criticalPc: getNum("aiCritPc"),
              highRiskPc: getNum("aiHighPc"),
              minimumMissDistanceM: getNum("aiMinMiss"),
              maximumPredictionHorizonH: getNum("aiHorizon"),
              minimumDataConfidence: getNum("aiMinConf"),
            },
          },
        };

        S.api("/settings", { method: "PUT", body: payload }).then(function () {
          document.getElementById("saveModal").classList.add("open");
        }).catch(function () {
          alert("Failed to save settings.");
        });
      });
    }

    /* ---- Reset button ---- */
    var resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!confirm("Reset all settings to defaults?")) return;
        var defaults = {
          alertThresholds: { criticalPc: 1e-4, highPc: 1e-5, mediumPc: 1e-6, lowPc: 1e-7, missDistanceWarningM: 1000, missDistanceCriticalM: 500 },
          screeningVolumes: { leo: [10, 10, 10], meo: [25, 25, 25], geo: [50, 50, 50], heo: [30, 30, 30] },
          notificationPrefs: { email: true, desktop: true, criticalOnly: false, digestIntervalHours: 4 },
          layerDefaults: { showTrajectory: true, showDebris: true, showConjunction: true, showGroundStations: true, showCoverage: false },
          aiConfig: { conjunctionScreening: true, continuousRiskAssessment: true, maneuverRecommendations: true, automaticSimulation: true, autonomousExecution: false, thresholds: { criticalPc: 1e-4, highRiskPc: 1e-5, minimumMissDistanceM: 1000, maximumPredictionHorizonH: 72, minimumDataConfidence: 0.8 } },
        };
        S.api("/settings", { method: "PUT", body: defaults }).then(function () { location.reload(); });
      });
    }

    /* ---- Helpers ---- */
    function setInput(id, val) {
      var el = document.getElementById(id);
      if (el && val != null) el.value = val;
    }

    function setToggle(id, on) {
      var el = document.getElementById(id);
      if (el) { if (on) el.classList.add("on"); else el.classList.remove("on"); }
    }

    function isToggleOn(id) {
      var el = document.getElementById(id);
      return el ? el.classList.contains("on") : false;
    }

    function getNum(id) {
      var el = document.getElementById(id);
      return el ? parseFloat(el.value) || 0 : 0;
    }

    function parseVol(id) {
      var el = document.getElementById(id);
      if (!el) return [0, 0, 0];
      return el.value.split(",").map(function (s) { return parseFloat(s.trim()) || 0; });
    }

    function formatAction(action) {
      var map = {
        acknowledge: "Alert Acknowledged",
        watchlist_add: "Added to Watchlist",
        plan_submit: "Maneuver Plan Submitted",
        plan_approve: "Maneuver Plan Approved",
        plan_reject: "Maneuver Plan Rejected",
        settings_update: "Settings Updated",
      };
      return map[action] || action;
    }

    function formatTime(iso) {
      if (!iso) return "";
      var d = new Date(iso);
      return d.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) + " UTC";
    }
  });
})();
