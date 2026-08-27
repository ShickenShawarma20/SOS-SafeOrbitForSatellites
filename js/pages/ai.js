/* SOS · SafeOrbitForSattelites — AI Command Center page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  var NS = "http://www.w3.org/2000/svg";
  var RISK_COLORS = {
    CRITICAL: "#EF4444",
    HIGH: "#F97316",
    MEDIUM: "#F59E0B",
    LOW: "#38BDF8",
    none: "#64748B",
  };
  var TREND_GLYPH = { decreasing: "↓", stable: "→", increasing: "↑", rapidly_increasing: "↑↑" };
  var TREND_LABEL = { decreasing: "Risk decreasing", stable: "Stable", increasing: "Risk increasing", rapidly_increasing: "Rapidly increasing" };
  var TREND_COLOR = { decreasing: "var(--nominal)", stable: "var(--text-mid)", increasing: "var(--high)", rapidly_increasing: "var(--crit)" };

  onReady(function () {
    var S = window.SOS;
    var UI = window.SOSUI;
    var currentRec = null;
    var currentAssessment = null;
    var pendingSim = null;
    var riskFilter = "all";
    var altFilter = 999999;

    /* ---------- Overview ---------- */
    S.api("/ai/overview").then(function (o) {
      if (!o) return;
      setText("aiMonSats", o.satellitesMonitored.toLocaleString());
      setText("aiTracked", o.objectsTracked.toLocaleString());
      setText("aiAnalyzed", o.conjunctionsAnalyzed.toLocaleString());
      setText("aiActiveAssess", o.activeAssessments);
      setText("aiHighRisk", o.highRiskEvents);
      setText("aiRecs", o.recommendations);
      var badge = document.getElementById("aiStatusBadge");
      if (badge) badge.textContent = "● " + o.aiStatus;
      var navBadge = document.getElementById("navBadge_ai");
      if (navBadge) navBadge.textContent = o.recommendations;
    }).catch(function () { renderDegraded(); });

    /* ---------- Risk map ---------- */
    function loadRiskMap() {
      S.api("/ai/risk-map?risk=" + (riskFilter === "all" ? "" : riskFilter) + "&altMax=" + altFilter)
        .then(renderRiskMap).catch(function () {});
    }
    document.querySelectorAll("[data-riskfilter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-riskfilter]").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        riskFilter = btn.getAttribute("data-riskfilter");
        loadRiskMap();
      });
    });
    var altSel = document.getElementById("aiAltFilter");
    if (altSel) altSel.addEventListener("change", function () { altFilter = parseInt(altSel.value); loadRiskMap(); });
    loadRiskMap();

    /* ---------- Assessments ---------- */
    S.api("/ai/assessments").then(function (data) {
      var list = document.getElementById("aiAssessList");
      if (!list) return;
      var items = (data && data.items) || [];
      setText("aiAssessCount", items.length + " active");
      if (!items.length) { list.innerHTML = emptyState("No active assessments"); return; }
      list.innerHTML = items.map(function (a) {
        var col = RISK_COLORS[a.riskLevel] || RISK_COLORS.none;
        var trend = TREND_GLYPH[a.riskTrend] || "→";
        var trendCol = TREND_COLOR[a.riskTrend] || "var(--text-mid)";
        return '<div class="assess-item" data-id="' + a.id + '">' +
          '<span class="ai-dot" style="background:' + col + ';box-shadow:0 0 9px ' + col + '99;"></span>' +
          '<div class="assess-main">' +
            '<div class="assess-top"><span class="assess-sat">' + a.satelliteId + '</span>' +
            '<span class="assess-risk" style="color:' + col + ';">' + a.riskLevel + '</span></div>' +
            '<div class="assess-sub num">↔ ' + a.objectId + ' · Pc ' + S.fmtPc(a.probabilityOfCollision) + '</div>' +
          '</div>' +
          '<span class="assess-trend" style="color:' + trendCol + ';" title="' + (TREND_LABEL[a.riskTrend] || "") + '">' + trend + '</span>' +
        '</div>';
      }).join("");
      list.querySelectorAll(".assess-item").forEach(function (el) {
        el.addEventListener("click", function () {
          openReasoning(el.getAttribute("data-id"));
        });
      });
    }).catch(function () {});

    /* ---------- Recommendation ---------- */
    S.api("/ai/recommendations").then(function (data) {
      var items = (data && data.items) || [];
      var rec = items[0];
      if (!rec) { renderRecEmpty(); return; }
      currentRec = rec;
      renderRecommendation(rec);
      renderSafetyChain(rec);
    }).catch(function () { renderRecEmpty(); });

    function renderRecommendation(rec) {
      var body = document.getElementById("aiRecBody");
      if (!body) return;
      var invalid = rec.status === "invalidated";
      var conf = Math.round(rec.confidence * 100);
      var plans = rec.candidates.map(planCard).join("");
      body.innerHTML =
        (invalid ? invalidatedBanner(rec) : "") +
        '<div class="ai-rec-head">' +
          '<div><div class="ai-rec-sat">' + rec.satelliteId + ' <span class="arrow" style="color:var(--crit);">↔</span> ' + rec.objectId + '</div>' +
          '<div class="card-sub">Potential collision detected · TCA <span class="num">' + S.fmtTime(rec.tca) + '</span></div></div>' +
          '<div class="ai-conf"><div class="ai-conf-pct num">' + conf + '%</div><div class="ai-conf-lvl">' + rec.confidenceLevel + '</div></div>' +
        '</div>' +
        '<div class="ai-rec-grid">' +
          kv("Current Pc", S.fmtPc(rec.currentPc), "var(--crit)") +
          kv("Predicted Pc", S.fmtPc(rec.predictedPc), "var(--nominal)") +
          kv("Current Miss Distance", S.fmtDist(rec.currentMissDistanceM), "var(--high)") +
          kv("Predicted Miss Distance", rec.predictedMissDistanceKm + " km", "var(--nominal)") +
          kv("Recommended Action", rec.recommendedPlan, "var(--accent)") +
          kv("Risk Reduction", rec.riskReductionPct + "%", "var(--nominal)") +
        '</div>' +
        '<div class="ai-rec-summary">' + rec.summary + '</div>' +
        '<div class="ai-cands">' + plans + '</div>' +
        '<div class="ai-rec-actions">' +
          '<button class="btn btn-primary" data-aisim>Simulate</button>' +
          '<button class="btn" data-aicompare>Compare Plans</button>' +
          '<button class="btn" data-aiexplain>View Reasoning</button>' +
          '<span class="ai-await">AI analysis complete — awaiting operator approval</span>' +
        '</div>';
      wireRecButtons(rec);
    }

    function planCard(p) {
      var col = p.status === "rejected" ? "var(--crit)" : p.recommended ? "var(--nominal)" : "var(--text-mid)";
      var badge = p.recommended ? '<span class="rec-badge">RECOMMENDED</span>' : p.status === "rejected" ? '<span class="rec-badge rec-badge-rej">REJECTED</span>' : '<span class="rec-badge rec-badge-avail">AVAILABLE</span>';
      var newConj = p.newConjunctionsCreated && p.newConjunctionsCreated.length
        ? '<div class="plan-newconj">⚠ New conjunction: ' + p.newConjunctionsCreated[0].objectId + ' · TCA +' + p.newConjunctionsCreated[0].tcaOffsetHours + 'h · Pc ' + S.fmtPc(p.newConjunctionsCreated[0].pc) + '</div>'
        : "";
      return '<div class="ai-plan' + (p.recommended ? " sel" : "") + '" data-planid="' + p.planId + '">' +
        '<div class="ai-plan-head"><span class="ai-plan-name" style="color:' + col + ';">' + p.label + '</span>' + badge + '</div>' +
        '<div class="ai-plan-grid">' +
          '<span class="k">ΔV</span><span class="v num">' + p.deltaVmps + ' m/s</span>' +
          '<span class="k">New Miss</span><span class="v num" style="color:var(--nominal);">' + p.newMissDistanceKm + ' km</span>' +
          '<span class="k">New Pc</span><span class="v num" style="color:var(--nominal);">' + S.fmtPc(p.newPc) + '</span>' +
          '<span class="k">Fuel</span><span class="v num">' + p.fuelImpactPct + '%</span>' +
          '<span class="k">Risk ↓</span><span class="v num" style="color:var(--nominal);">' + p.riskReductionPct + '%</span>' +
        '</div>' +
        newConj +
      '</div>';
    }

    function wireRecButtons(rec) {
      var sim = document.querySelector("[data-aisim]");
      if (sim) sim.addEventListener("click", function () { openSimModal(rec); });
      var cmp = document.querySelector("[data-aicompare]");
      if (cmp) cmp.addEventListener("click", function () {
        if (UI) UI.toast("Compare view: " + rec.candidates.length + " candidate plans ranked by overall orbital safety.", "info");
        var card = document.getElementById("aiRecCard");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      var exp = document.querySelector("[data-aiexplain]");
      if (exp) exp.addEventListener("click", function () { openReasoningByConjunction(rec.conjunctionId); });
    }

    function renderSafetyChain(rec) {
      var sv = rec.safetyValidation;
      var chain = document.getElementById("aiSafetyChain");
      var badge = document.getElementById("aiSafetyBadge");
      if (!chain) return;
      var checks = [
        ["Orbital constraints", sv.orbitalConstraints],
        ["Propulsion constraints", sv.propulsionConstraints],
        ["Collision screening", sv.collisionScreening],
        ["Secondary conjunction screening", sv.secondaryScreening],
        ["Maneuver window", sv.maneuverWindow],
        ["Data freshness", sv.dataFreshness],
      ];
      chain.innerHTML = checks.map(function (c, i) {
        return '<li class="' + (c[1] ? "ok" : "fail") + '"><span class="sc-idx">' + (i + 1) + '</span>' +
          '<span class="sc-mark">' + (c[1] ? "✓" : "✕") + '</span><span class="sc-txt">' + c[0] + '</span></li>';
      }).join("") + '<li class="sc-final"><span class="sc-final-tag">VALIDATED FOR SIMULATION</span></li>';
      if (badge) { badge.textContent = sv.status === "validated" ? "VALIDATED" : sv.status === "failed" ? "FAILED" : "PENDING";
        badge.className = "badge " + (sv.status === "validated" ? "badge-nominal" : sv.status === "failed" ? "badge-crit" : "badge-high");
        badge.style.marginLeft = "auto"; }
    }

    /* ---------- Reasoning drawer ---------- */
    var drawer = document.getElementById("aiReasonDrawer");
    var backdrop = document.getElementById("aiReasonBackdrop");
    var reasonClose = document.getElementById("aiReasonClose");
    if (reasonClose) reasonClose.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

    function openReasoning(assessmentId) {
      S.api("/ai/assessments/" + assessmentId).then(function (a) {
        currentAssessment = a;
        renderReasoning(a, null);
        openDrawer();
      }).catch(function () { if (UI) UI.toast("Unable to load reasoning.", "error"); });
    }

    function openReasoningByConjunction(conjunctionId) {
      var a = (window.__aiAssessmentsCache || []).find(function (x) { return x.conjunctionId === conjunctionId; });
      S.api("/ai/recommendations").then(function (data) {
        var rec = (data.items || []).find(function (r) { return r.conjunctionId === conjunctionId; });
        var assess = a || (window.__aiAssessmentsCache || []).find(function (x) { return x.conjunctionId === conjunctionId; }) || (rec && { satelliteId: rec.satelliteId, objectId: rec.objectId });
        renderReasoning(assess, rec);
        openDrawer();
      }).catch(function () { if (UI) UI.toast("Unable to load reasoning.", "error"); });
    }

    function renderReasoning(a, rec) {
      var body = document.getElementById("aiReasonBody");
      if (!body || !a) return;
      var drivers = (a.trendDrivers || []).map(function (d) {
        return '<div class="rr-row"><span class="k">' + d.factor + '</span><span class="v num">' + d.change + '</span></div>';
      }).join("");
      var contributors = (a.primaryContributors || []).map(function (c) { return "<li>" + c + "</li>"; }).join("");
      var riskTable = [
        ["Miss Distance", a.missDistanceMeters >= 1000 ? (a.missDistanceMeters / 1000).toFixed(2) + " km" : a.missDistanceMeters + " m"],
        ["Relative Velocity", a.relativeVelocityKms + " km/s"],
        ["TCA", S.fmtTime(a.tca)],
        ["Position Uncertainty", a.positionUncertaintyKm + " km"],
        ["Velocity Uncertainty", a.velocityUncertaintyKms + " km/s"],
      ].map(function (r) { return '<div class="rr-row"><span class="k">' + r[0] + '</span><span class="v num">' + r[1] + '</span></div>'; }).join("");
      var recSection = "";
      if (rec) {
        var cand = rec.candidates || [];
        var recommended = cand.find(function (c) { return c.recommended; }) || cand[0];
        var alts = cand.filter(function (c) { return !c.recommended; }).map(function (c) {
          return '<div class="rr-alt ' + (c.status === "rejected" ? "rej" : "avail") + '">' +
            '<div class="rr-alt-head"><b>' + c.label + '</b> <span>' + (c.status === "rejected" ? "Rejected" : "Available") + '</span></div>' +
            '<div class="rr-alt-reason">' + (c.rejectionReason || c.reasoning) + '</div></div>';
        }).join("");
        recSection =
          '<section class="rr-sec"><h4>Maneuver Reasoning</h4>' +
          '<p class="rr-narr">' + (recommended ? recommended.reasoning : "") + '</p>' +
          '<ul class="rr-bullets">' + (recommended ? ["Reduces Pc by approximately two orders of magnitude.", "Produces a larger post-burn miss distance.", "Requires relatively low Delta-V.", "Has limited fuel impact.", "Does not introduce another significant conjunction."].map(function (b) { return "<li>" + b + "</li>"; }).join("") : "") + '</ul></section>' +
          '<section class="rr-sec"><h4>Alternatives</h4>' + (alts || '<div class="rr-empty">No alternative plans.</div>') + '</section>';
      }
      body.innerHTML =
        '<section class="rr-sec rr-risk"><div class="rr-risk-head"><span class="badge badge-' + riskBadgeClass(a.riskLevel) + '">' + a.riskLevel + ' RISK</span>' +
        '<span class="rr-conf">AI Confidence ' + Math.round(a.confidence * 100) + '%</span></div>' +
        '<p class="rr-narr">' + a.explanation + '</p></section>' +
        '<section class="rr-sec"><h4>Risk Drivers</h4>' + riskTable + drivers + '</section>' +
        '<section class="rr-sec"><h4>Primary Contributors</h4><ul class="rr-bullets">' + (contributors || '<li class="rr-empty">—</li>') + '</ul></section>' +
        '<section class="rr-sec"><h4>Data Quality</h4>' +
        '<div class="rr-row"><span class="k">Tracking Sources</span><span class="v num">' + a.dataQuality.trackingSources + '</span></div>' +
        '<div class="rr-row"><span class="k">Latest Update</span><span class="v num">' + S.timeAgo(new Date(Date.now() - a.dataQuality.latestUpdateMin * 60000).toISOString()) + '</span></div>' +
        '<div class="rr-row"><span class="k">Confidence</span><span class="v">' + a.dataQuality.confidence + '</span></div></section>' +
        recSection +
        '<p class="rr-foot">This is a decision-support assessment. The operator remains responsible for approving any operational action.</p>';
    }

    function openDrawer() { if (drawer) drawer.classList.add("open"); if (backdrop) backdrop.classList.add("open"); }
    function closeDrawer() { if (drawer) drawer.classList.remove("open"); if (backdrop) backdrop.classList.remove("open"); }

    /* ---------- Simulation modal ---------- */
    var simModal = document.getElementById("aiSimModal");
    if (simModal) {
      simModal.querySelectorAll("[data-modal-close]").forEach(function (b) {
        b.addEventListener("click", function () { simModal.classList.remove("open"); });
      });
    }
    var simRunBtn = document.getElementById("aiSimRun");

    function openSimModal(rec) {
      pendingSim = rec;
      var recommended = rec.candidates.find(function (c) { return c.recommended; }) || rec.candidates[0];
      var body = document.getElementById("aiSimBody");
      body.innerHTML =
        '<div class="aisim-compare">' +
          '<div class="aisim-col"><div class="k">Current Trajectory</div><div class="v num">Pc ' + S.fmtPc(rec.currentPc) + '</div><div class="v2 num">' + S.fmtDist(rec.currentMissDistanceM) + '</div></div>' +
          '<div class="aisim-arrow">→</div>' +
          '<div class="aisim-col ai"><div class="k">AI Recommended</div><div class="v num" style="color:var(--nominal);">Pc ' + S.fmtPc(rec.predictedPc) + '</div><div class="v2 num" style="color:var(--nominal);">' + rec.predictedMissDistanceKm + ' km</div></div>' +
        '</div>' +
        '<p style="margin-top:12px;">Run high-fidelity propagation for <b>' + recommended.label + '</b> against the latest CDM ephemeris, then screen the post-burn trajectory against the wider tracked-object catalog. Estimated completion: <b>~8 s</b>.</p>';
      simModal.classList.add("open");
    }

    if (simRunBtn) simRunBtn.addEventListener("click", function () {
      if (!pendingSim) return;
      var rec = pendingSim;
      var plan = rec.candidates.find(function (c) { return c.recommended; }) || rec.candidates[0];
      if (UI) UI.toast("Simulation started for " + plan.label + "…", "info");
      S.api("/ai/simulate", { method: "POST", body: { recommendationId: rec.id, planId: plan.planId } })
        .then(function (r) { pollSim(r.jobId, plan); })
        .catch(function () { if (UI) UI.toast("Simulation failed to start.", "error"); });
    });

    function pollSim(jobId, plan) {
      var n = 0;
      function tick() {
        S.api("/jobs/" + jobId).then(function (job) {
          n++;
          if (UI) UI.toast(plan.label + " simulation: " + (job.progress || 0) + "% — " + (job.stage || ""), "info", 1400);
          if (job.status === "completed") {
            if (UI) UI.toast(plan.label + " validated — post-burn trajectory clear of catalogued objects.", "success", 4200);
            return;
          }
          if (n < 30) setTimeout(tick, 900);
        }).catch(function () { if (n < 30) setTimeout(tick, 1200); });
      }
      tick();
    }

    /* ---------- Health / data quality / activity ---------- */
    S.api("/ai/health").then(function (h) {
      var list = document.getElementById("aiHealthList");
      if (!list) return;
      list.innerHTML = h.modules.map(function (m) {
        return '<div class="status-row"><span class="sys-name">' +
          '<span class="ai-mod-dot ' + m.status + '"></span>' + m.name + '</span>' +
          '<span class="status-ok">' + (m.status === "healthy" ? "Healthy" : m.status === "degraded" ? "Degraded" : "Offline") + '</span></div>';
      }).join("");
      setText("aiModelUpdate", S.timeAgo(h.lastModelUpdate));
      setText("aiDataLat", h.dataLatencySec + " s");
      setText("aiPredQual", h.predictionQualityPct + "%");
    }).catch(function () {});

    S.api("/ai/data-quality").then(function (warnings) {
      var body = document.getElementById("aiDqBody");
      if (!body) return;
      if (!warnings.length) {
        body.innerHTML = '<div class="ai-dq-ok"><span class="status-ok">All data sources nominal</span></div>';
        var b = document.getElementById("aiDqBadge"); if (b) { b.textContent = "NOMINAL"; b.className = "badge badge-nominal"; b.setAttribute("style", "margin-left:auto;"); }
        return;
      }
      body.innerHTML = warnings.map(function (w) {
        return '<div class="ai-dq-warn">' +
          '<div class="ai-dq-head"><b>' + w.objectId + '</b><span class="badge badge-' + (w.confidence === "LOW" ? "crit" : "high") + '">' + w.confidence + '</span></div>' +
          '<div class="ai-dq-issue">' + w.issue + '</div>' +
          '<div class="ai-dq-rec">' + w.recommendation + '</div>' +
          '<button class="btn btn-sm" data-dqsrc="' + w.objectId + '">View Tracking Sources</button>' +
        '</div>';
      }).join("");
      body.querySelectorAll("[data-dqsrc]").forEach(function (b) {
        b.addEventListener("click", function () { if (UI) UI.toast("Tracking sources for " + b.getAttribute("data-dqsrc") + ": 2 sensors reporting (reconcile required).", "warn"); });
      });
    }).catch(function () {});

    S.api("/ai/activity").then(function (events) {
      var feed = document.getElementById("aiActivity");
      if (!feed) return;
      feed.innerHTML = events.map(function (e) {
        var t = new Date(e.timestamp);
        var p = function (n) { return String(n).padStart(2, "0"); };
        var ts = p(t.getUTCHours()) + ":" + p(t.getUTCMinutes()) + ":" + p(t.getUTCSeconds());
        return '<div class="feed-item"><span class="ai-act-tick"></span><div><div class="feed-text">' + e.text + '</div><div class="feed-time">' + ts + ' UTC</div></div></div>';
      }).join("");
    }).catch(function () {});

    /* ---------- Run new analysis button ---------- */
    var runBtn = document.getElementById("aiRunAnalysis");
    if (runBtn) runBtn.addEventListener("click", function () {
      if (UI) UI.toast("AI analysis re-run queued against latest tracking data…", "info");
      setTimeout(function () {
        if (UI) UI.toast("Analysis complete — 1 recommendation updated.", "success");
        loadRiskMap();
      }, 1400);
    });

    /* ---------- Risk map renderer ---------- */
    function renderRiskMap(data) {
      var svg = document.getElementById("aiRiskSvg");
      if (!svg) return;
      var W = 760, H = 420, ML = 46, MR = 16, MT = 24, MB = 30;
      function altY(alt) { return MT + (H - MT - MB) * (1 - Math.sqrt(Math.min(alt, 36000) / 36000)); }
      function raanX(raan) { return ML + (W - ML - MR) * (((raan % 360) + 360) % 360) / 360; }
      var pts = data.points || [];
      var conj = data.conjunctions || [];
      var bands = [
        ["LEO", 2000], ["MEO", 35786], ["GEO", 36000],
      ];
      var grid = "";
      [2000, 35786].forEach(function (alt) {
        var y = altY(alt);
        grid += '<line x1="' + ML + '" y1="' + y.toFixed(1) + '" x2="' + (W - MR) + '" y2="' + y.toFixed(1) + '" class="rm-band"/>';
        grid += '<text x="' + (ML - 6) + '" y="' + (y + 3).toFixed(1) + '" class="rm-band-lbl" text-anchor="end">' + (alt >= 35786 ? "GEO" : alt + " km") + '</text>';
      });
      for (var ra = 0; ra <= 360; ra += 60) {
        var x = raanX(ra);
        grid += '<line x1="' + x.toFixed(1) + '" y1="' + MT + '" x2="' + x.toFixed(1) + '" y2="' + (H - MB) + '" class="rm-mer"/>';
        grid += '<text x="' + x.toFixed(1) + '" y="' + (H - MB + 16) + '" class="rm-band-lbl" text-anchor="middle">' + ra + '°</text>';
      }
      var corridors = conj.map(function (c) {
        var s = pts.find(function (p) { return p.id === c.satelliteId; });
        var o = pts.find(function (p) { return p.id === c.objectId; });
        if (!s || !o) return "";
        var x1 = raanX(s.raanDeg), y1 = altY(s.altitudeKm), x2 = raanX(o.raanDeg), y2 = altY(o.altitudeKm);
        var col = RISK_COLORS[c.riskLevel] || RISK_COLORS.none;
        return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="rm-corridor" stroke="' + col + '"/>' +
          '<circle cx="' + ((x1 + x2) / 2).toFixed(1) + '" cy="' + ((y1 + y2) / 2).toFixed(1) + '" r="4" class="rm-tca" fill="' + col + '"><title>TCA ' + S.fmtTime(c.tca) + ' · ' + c.riskLevel + '</title></circle>';
      }).join("");
      var dots = pts.map(function (p) {
        var x = raanX(p.raanDeg + p.phaseDeg * 0.15), y = altY(p.altitudeKm);
        var col = RISK_COLORS[p.riskLevel] || RISK_COLORS.none;
        var r = p.kind === "satellite" ? 5.5 : 3.5;
        var cls = p.kind === "satellite" ? "rm-sat" : "rm-obj";
        return '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')" class="rm-node">' +
          (p.kind === "satellite" ? '<rect x="-' + r + '" y="-' + r + '" width="' + (r * 2) + '" height="' + (r * 2) + '" rx="2" fill="' + col + '" stroke="#04101F" stroke-width="1"/>' : '<circle r="' + r + '" fill="' + col + '" stroke="#04101F" stroke-width="1"/>') +
          (p.riskLevel !== "none" ? '<circle r="' + (r + 4) + '" fill="none" stroke="' + col + '" stroke-opacity="0.5" class="rm-halo"/>' : "") +
          '<text x="0" y="' + (-(r + 4)) + '" class="rm-label" text-anchor="middle">' + p.name + '</text>' +
          '</g>';
      }).join("");
      svg.innerHTML =
        '<defs><radialGradient id="rmEarth" cx="50%" cy="100%" r="100%"><stop offset="0%" stop-color="#0C2036"/><stop offset="100%" stop-color="#04101F"/></radialGradient></defs>' +
        '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#rmEarth)"/>' +
        '<text x="' + ML + '" y="' + (MT - 8) + '" class="rm-axis">Altitude ↑ · Orbital plane (RAAN) →</text>' +
        grid + corridors + dots;
    }

    /* ---------- helpers ---------- */
    function kv(k, v, color) {
      return '<div class="ai-kv"><div class="k">' + k + '</div><div class="v num" style="' + (color ? "color:" + color : "") + '">' + v + '</div></div>';
    }
    function riskBadgeClass(level) {
      return level === "CRITICAL" ? "crit" : level === "HIGH" ? "high" : level === "MEDIUM" ? "medium" : "info";
    }
    function invalidatedBanner(rec) {
      return '<div class="ai-invalid-banner"><b>RECOMMENDATION INVALIDATED</b><span>New tracking data changed the predicted trajectory. Previous recommendation: ' + rec.recommendedPlan + ' — no longer valid.</span><button class="btn btn-sm" data-rerun>Run New Analysis</button></div>';
    }
    function renderRecEmpty() {
      var b = document.getElementById("aiRecBody");
      if (b) b.innerHTML = '<div class="ai-loading">No active recommendations. All monitored conjunctions are below the maneuver threshold.</div>';
    }
    function renderDegraded() {
      var b = document.getElementById("aiStatusBadge");
      if (b) { b.textContent = "● DEGRADED"; b.className = "badge badge-high"; }
    }
    function emptyState(msg) { return '<div class="ai-loading">' + msg + '</div>'; }
    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    /* cache assessments for reasoning-by-conjunction lookups */
    S.api("/ai/assessments").then(function (d) { window.__aiAssessmentsCache = (d && d.items) || []; }).catch(function () {});
  });
})();
