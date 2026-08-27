/* SOS · SafeOrbitForSattelites — maneuver planner page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var conjunctionId = S.param("conjunctionId") || "CD-2024-0526-0417";
    var selectedPlan = null;
    var allPlans = [];

    /* ---- Conjunction Context ---- */
    S.api("/conjunctions/" + encodeURIComponent(conjunctionId)).then(function (c) {
      if (!c) return;
      var crumb = document.querySelector(".crumb");
      if (crumb) crumb.textContent = "Maneuver Planner / " + c.satelliteId;

      var h1 = document.querySelector(".page-head h1");
      if (h1) {
        h1.innerHTML = 'MANEUVER PLANNER <span class="badge badge-info">' + c.id + '</span>';
      }

      var sub = document.querySelector(".page-head .card-sub");
      if (sub) sub.textContent = "Target: " + c.satelliteId + " \u2194 " + c.objectId + " \u00B7 TCA " + S.fmtTime(c.tca) + " UTC \u00B7 Pc " + S.fmtPc(c.probabilityOfCollision);
    }).catch(function () {});

    /* ---- Candidate Plans ---- */
    S.api("/maneuvers/plans?conjunctionId=" + encodeURIComponent(conjunctionId)).then(function (plans) {
      if (!Array.isArray(plans)) return;
      allPlans = plans;

      var container = document.querySelector(".plan-cards");
      if (!container) return;

      container.innerHTML = plans.map(function (p, i) {
        var isRec = p.recommended;
        var isSelected = i === 0;
        return '<button class="plan-card' + (isSelected ? ' selected' : '') + '" data-plan="' + p.id + '">' +
          '<div class="plan-head">' +
          '<span class="plan-name" style="color:' + (isRec ? "#4ADE80" : i === 1 ? "var(--warn)" : "#A78BFA") + ';">PLAN ' + String.fromCharCode(65 + i) + '</span>' +
          (isRec ? '<span class="rec-badge">RECOMMENDED</span>' : '') +
          '</div>' +
          '<div class="plan-stats">' +
          '<div class="plan-stat"><span class="k">\u0394V</span><span class="v num">' + p.deltaVmps + ' m/s</span></div>' +
          '<div class="plan-stat"><span class="k">Fuel Impact</span><span class="v num">' + (p.fuelImpactPct > 0 ? "+" : "\u2212") + Math.abs(p.fuelImpactPct) + '%</span></div>' +
          '<div class="plan-stat"><span class="k">New Miss Distance</span><span class="v num" style="color:var(--nominal);">' + S.fmtDistKm(p.newMissDistanceKm) + '</span></div>' +
          '<div class="plan-stat"><span class="k">Risk Reduction</span><span class="v num" style="color:var(--nominal);">' + p.riskReductionPct + '%</span></div>' +
          '</div></button>';
      }).join("");

      /* Re-bind plan card selection */
      container.querySelectorAll(".plan-card").forEach(function (card) {
        card.addEventListener("click", function () {
          container.querySelectorAll(".plan-card").forEach(function (c) { c.classList.remove("selected"); });
          card.classList.add("selected");
          container.querySelectorAll(".sel-check").forEach(function (b) { b.remove(); });
          var badge = card.querySelector(".plan-head");
          var tag = document.createElement("span");
          tag.className = "sel-check";
          tag.textContent = "SELECTED";
          badge.appendChild(tag);
          selectPlan(card.dataset.plan);
        });
      });

      /* Select first plan */
      if (plans.length > 0) selectPlan(plans[0].id);

      /* ---- Burn Window ---- */
      if (plans[0] && plans[0].burnWindow) {
        var winBoxes = document.querySelectorAll(".window-bar .win-box");
        if (winBoxes[0]) winBoxes[0].querySelector(".v").textContent = S.fmtDateShort(plans[0].burnWindow.earliest) + ", " + S.fmtTime(plans[0].burnWindow.earliest).replace(/:\d{2}$/, "") + " UTC";
        if (winBoxes[1]) winBoxes[1].querySelector(".v").textContent = S.fmtDateShort(plans[0].burnWindow.latest) + ", " + S.fmtTime(plans[0].burnWindow.latest).replace(/:\d{2}$/, "") + " UTC";
      }
    }).catch(function () {});

    function selectPlan(planId) {
      selectedPlan = allPlans.find(function (p) { return p.id === planId; });
      if (!selectedPlan) return;

      /* Plan Details */
      var detailTitle = document.querySelector(".two-col:last-of-type .card:last-child .card-title");
      var planIdx = allPlans.indexOf(selectedPlan);
      var planLabel = "PLAN " + String.fromCharCode(65 + planIdx);
      if (detailTitle) detailTitle.textContent = planLabel + " Details";

      var detGrid = document.querySelectorAll(".two-col:last-of-type .detail-grid .info-tile");
      if (detGrid[0]) detGrid[0].querySelector(".v").textContent = selectedPlan.direction.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
      if (detGrid[1]) detGrid[1].querySelector(".v").textContent = S.fmtDuration(selectedPlan.burnDurationSec);
      if (detGrid[2]) detGrid[2].querySelector(".v").textContent = selectedPlan.thrustN + " N";
      if (detGrid[3]) detGrid[3].querySelector(".v").textContent = (selectedPlan.altitudeChangeKm > 0 ? "+" : "") + selectedPlan.altitudeChangeKm + " km";
      if (detGrid[4]) detGrid[4].querySelector(".v").textContent = S.fmtPc(selectedPlan.postBurnPc);
      if (detGrid[5]) detGrid[5].querySelector(".v").textContent = selectedPlan.groundTrackShiftKm + " km";

      /* Summary bar */
      setText("sumPlan", planLabel);
      setText("sumDv", selectedPlan.deltaVmps + " m/s");
      setText("sumDur", S.fmtDuration(selectedPlan.burnDurationSec));
      setText("sumFuel", "\u2212" + selectedPlan.fuelImpactPct + "% (" + selectedPlan.fuelImpactKg + " kg)");
      setText("sumMiss", S.fmtDistKm(selectedPlan.newMissDistanceKm));
      setText("sumRisk", selectedPlan.riskReductionPct + "%");

      /* Modal labels */
      setText("simPlanLabel", planLabel);
      setText("savePlanLabel", planLabel);
    }

    /* ---- Simulate Button ---- */
    var simConfirmBtn = document.querySelector("#simulateModal .modal-foot .btn-primary");
    if (simConfirmBtn) {
      simConfirmBtn.onclick = function () {
        if (!selectedPlan) return;
        S.api("/maneuvers/simulate", { method: "POST", body: { planId: selectedPlan.id } })
          .then(function (result) {
            if (result && result.jobId) {
              /* Poll job status */
              pollJob(result.jobId);
            }
          });
      };
    }

    /* ---- Submit for Approval Button ---- */
    var saveConfirmBtn = document.querySelector("#saveModal .modal-foot .btn-danger");
    if (saveConfirmBtn) {
      saveConfirmBtn.onclick = function () {
        if (!selectedPlan) return;
        S.api("/maneuvers/plans/" + encodeURIComponent(selectedPlan.id) + "/submit", { method: "POST" })
          .then(function () {
            alert("Plan submitted for approval.");
          });
      };
    }

    /* ---- Export Button ---- */
    var exportBtn = document.querySelector(".page-head-actions .btn:first-child");
    if (exportBtn) {
      exportBtn.onclick = function () {
        if (!selectedPlan) return;
        S.api("/maneuvers/plans/" + encodeURIComponent(selectedPlan.id) + "/export?format=json")
          .then(function (data) {
            var blob = new Blob([JSON.stringify(data.plan, null, 2)], { type: "application/json" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = selectedPlan.id + "_export.json";
            a.click();
            URL.revokeObjectURL(url);
          });
      };
    }

    function pollJob(jobId) {
      S.api("/jobs/" + jobId).then(function (job) {
        if (job.status === "running" || job.status === "queued") {
          setTimeout(function () { pollJob(jobId); }, 2000);
        } else if (job.status === "completed" || job.status === "complete") {
          if (window.SOSUI) SOSUI.toast("Simulation complete — trajectory is clear for 72 h.", "success");
          if (job.result && job.result.summary && window.SOSUI) SOSUI.toast(job.result.summary, "info", 5000);
        } else if (job.status === "failed") {
          if (window.SOSUI) SOSUI.toast("Simulation failed: " + (job.error || "unknown error"), "error");
        }
      }).catch(function () {});
    }

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  });
})();
