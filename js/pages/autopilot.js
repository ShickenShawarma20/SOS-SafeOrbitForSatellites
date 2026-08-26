/* SOS · SafeOrbitForSattelites — Autonomous Closed-Loop Auto-Pilot Engine */
(function () {
  "use strict";

  var G0 = 9.80665;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.from((el || document).querySelectorAll(s)); };

  // shell.js reassigns #shell.innerHTML on DOMContentLoaded, wiping parse-time
  // listeners. autopilot.js loads AFTER shell.js, so a DOMContentLoaded listener
  // registered here runs on the fresh DOM. All wiring inside onDomReady.
  function onDomReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  /* ============================================================
     FLEET DATA — realistic constellation with conjunctions
     ============================================================ */
  var FLEET = [
    { sat: "AEGIS Sentinel-1", norad: 51656, fuel: 121.0, mass: 66.6, isp: 230,
      debris: "COSMOS 2251 DEB", relSpeed: 13.7, miss: 742, pc: 3.8e-3,
      dvT: 0.192, dvR: 0.0, dvN: 0.0, postMiss: 2.89, postPc: 1.2e-7, burnDur: 8.2, status: "queued" },
    { sat: "Hyperion-A", norad: 44804, fuel: 64.2, mass: 52.0, isp: 235,
      debris: "IRIDIUM 33 DEB", relSpeed: 11.4, miss: 612, pc: 7.2e-4,
      dvT: 0.148, dvR: 0.0, dvN: 0.0, postMiss: 3.41, postPc: 8.4e-8, burnDur: 6.1, status: "queued" },
    { sat: "EOS-06 Orbiter", norad: 54361, fuel: 38.0, mass: 48.0, isp: 235,
      debris: "FENGYUN 1C DEB", relSpeed: 9.8, miss: 1240, pc: 4.1e-5,
      dvT: 0.087, dvR: 0.0, dvN: 0.0, postMiss: 4.12, postPc: 3.1e-8, burnDur: 3.8, status: "queued" },
    { sat: "Vanguard-3", norad: 40930, fuel: 56.0, mass: 55.0, isp: 220,
      debris: "SL-8 DEB", relSpeed: 10.2, miss: 2850, pc: 6.8e-6,
      dvT: 0.042, dvR: 0.0, dvN: 0.0, postMiss: 5.80, postPc: 1.4e-8, burnDur: 2.1, status: "queued" },
    { sat: "Polaris-7", norad: 58694, fuel: 4.1, mass: 42.0, isp: 68,
      debris: "BREEZE-M DEB", relSpeed: 8.9, miss: 890, pc: 2.9e-4,
      dvT: 0.115, dvR: 0.0, dvN: 0.0, postMiss: 2.74, postPc: 9.8e-8, burnDur: 5.4, status: "queued" },
    { sat: "INSAT-3DS", norad: 58990, fuel: 890.0, mass: 2274.0, isp: 310,
      debris: "GSAT DEB", relSpeed: 3.1, miss: 5400, pc: 8.2e-7,
      dvT: 0.031, dvR: 0.0, dvN: 0.0, postMiss: 8.10, postPc: 5.0e-9, burnDur: 1.4, status: "bypass" },
  ];

  /* ============================================================
     POLICY STATE
     ============================================================ */
  var POLICY = {
    pcThreshold: 1e-4,
    missThreshold: 2.5,
    horizonMin: 90,
    propPolicy: "FUEL_OPTIMAL_IN_TRACK",
    screen72h: true,
    masterState: "ARMED",
  };

  var selected = new Set();
  var executing = false;

  /* ============================================================
     Tsiolkovsky propellant cost
     ============================================================ */
  function propCost(dv, mass, isp) {
    return mass * (1 - Math.exp(-dv / (isp * G0))); // kg
  }

  /* ============================================================
     SECTION 1 — Trigger Rules Configuration
     ============================================================ */
  function initPolicy() {
    // --- Pc logarithmic slider ---
    // slider 0..1000 maps to log10(Pc) from -6 to -3
    var pcSlider = $("#pcSlider");
    pcSlider.value = pcToSlider(POLICY.pcThreshold);
    pcSlider.addEventListener("input", function () {
      POLICY.pcThreshold = sliderToPc(parseFloat(pcSlider.value));
      renderPcThreshold();
      renderFleet();
      updateEligibleCount();
    });

    // --- Miss distance slider ---
    var missSlider = $("#missSlider");
    missSlider.addEventListener("input", function () {
      POLICY.missThreshold = parseFloat(missSlider.value);
      $("#missThresholdVal").textContent = POLICY.missThreshold.toFixed(1) + " km";
      renderFleet();
      updateEligibleCount();
    });

    // --- Horizon slider ---
    var horizonSlider = $("#horizonSlider");
    horizonSlider.addEventListener("input", function () {
      POLICY.horizonMin = parseInt(horizonSlider.value, 10);
      $("#horizonVal").textContent = "TCA − " + POLICY.horizonMin + " min";
    });

    // --- Propellant policy radios ---
    $$("#propPolicyGroup .radio-opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        $$("#propPolicyGroup .radio-opt").forEach(function (o) { o.classList.remove("sel"); });
        opt.classList.add("sel");
        POLICY.propPolicy = opt.dataset.policy;
        log("OPTIMIZER", "Propellant policy switched to " + POLICY.propPolicy, "warn");
      });
    });

    // --- Secondary screening toggle ---
    var st = $("#screenToggle");
    st.addEventListener("click", function () { flipSwitch(st); POLICY.screen72h = st.classList.contains("on"); });
    st.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipSwitch(st); POLICY.screen72h = st.classList.contains("on"); } });

    // --- Master state selector ---
    $$("#masterStateGroup .ms-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("#masterStateGroup .ms-btn").forEach(function (b) { b.classList.remove("sel"); });
        btn.classList.add("sel");
        POLICY.masterState = btn.dataset.state;
        updateMasterBadge();
        log("ENGINE", "Master state set to " + POLICY.masterState, POLICY.masterState === "STANDBY" ? "warn" : "engine");
      });
    });

    renderPcThreshold();
  }

  function flipSwitch(sw) {
    sw.classList.toggle("on");
    sw.setAttribute("aria-checked", sw.classList.contains("on") ? "true" : "false");
  }

  function sliderToPc(v) { return Math.pow(10, -6 + (v / 1000) * 3); }
  function pcToSlider(pc) { return Math.round((Math.log10(pc) + 6) / 3 * 1000); }

  function renderPcThreshold() {
    $("#pcThresholdVal").textContent = fmtPc(POLICY.pcThreshold);
    var el = $("#pcThresholdVal");
    el.className = "pc-value" + (POLICY.pcThreshold >= 1e-4 ? " crit" : POLICY.pcThreshold >= 1e-5 ? " warn" : "");
  }

  function updateMasterBadge() {
    var badge = $("#apModeBadge");
    var psBadge = $("#policyStatusBadge");
    var state = POLICY.masterState;
    if (state === "ARMED") {
      badge.textContent = "ARMED"; badge.className = "badge badge-nominal";
      psBadge.textContent = "POLICY ARMED"; psBadge.className = "badge badge-nominal";
    } else if (state === "SIMULATION_DRY_RUN") {
      badge.textContent = "DRY RUN"; badge.className = "badge badge-medium";
      psBadge.textContent = "DRY RUN MODE"; psBadge.className = "badge badge-medium";
    } else {
      badge.textContent = "STANDBY"; badge.className = "badge badge-neutral";
      psBadge.textContent = "MANUAL OVERRIDE"; psBadge.className = "badge badge-neutral";
    }
  }

  /* ============================================================
     SECTION 2 — Fleet Clearance Queue
     ============================================================ */
  function isEligible(item) {
    return item.status === "queued" && (item.pc >= POLICY.pcThreshold || item.miss / 1000 < POLICY.missThreshold);
  }

  function renderFleet() {
    var tbody = $("#fleetQueueBody");
    tbody.innerHTML = FLEET.map(function (item, i) {
      var totalDv = item.dvT + item.dvR + item.dvN;
      var cost = propCost(totalDv, item.mass, item.isp);
      var elig = isEligible(item);
      var checked = selected.has(i) ? "checked" : "";
      var disabled = !elig ? "disabled" : "";
      var rowCls = (selected.has(i) ? "selected" : "") + (item.status === "resolved" ? " resolved" : "");
      var pcClass = item.pc >= 1e-4 ? "crit" : item.pc >= 1e-5 ? "high" : item.pc >= 1e-6 ? "med" : "low";
      var stCls = item.status === "queued" ? "queued" : item.status === "armed" ? "armed" : item.status === "burning" ? "burning" : item.status === "resolved" ? "resolved" : "bypass";
      var stLabel = item.status.replace("_", " ").toUpperCase();
      return '<tr class="' + rowCls + '" data-row="' + i + '">' +
        '<td class="fcq-check"><span class="fcq-cb ' + checked + " " + disabled + '" data-idx="' + i + '"></span></td>' +
        '<td><div class="fcq-sat">' + esc(item.sat) + '<span class="sub">NORAD ' + item.norad + ' · ' + item.fuel.toFixed(2) + ' kg fuel</span></div></td>' +
        '<td><div class="fcq-deb">' + esc(item.debris) + '<span class="sub">v<sub>rel</sub> ' + item.relSpeed + ' km/s</span></div></td>' +
        '<td><div class="fcq-pc ' + pcClass + '">' + fmtPc(item.pc) + '</div><span class="fcq-miss">miss ' + fmtMiss(item.miss) + '</span></td>' +
        '<td><div class="fcq-dv">ΔV ' + totalDv.toFixed(3) + ' m/s<span class="sub">T ' + item.dvT.toFixed(3) + ' · R ' + item.dvR.toFixed(3) + ' · N ' + item.dvN.toFixed(3) + '</span></div></td>' +
        '<td><div class="fcq-dv">' + (cost < 1 ? (cost * 1000).toFixed(1) + " g" : cost.toFixed(3) + " kg") + '<span class="sub">→ miss ' + item.postMiss.toFixed(2) + ' km · Pc ' + fmtPc(item.postPc) + '</span></div></td>' +
        '<td><span class="fcq-status ' + stCls + '">' + stLabel + '</span></td>' +
        '</tr>';
    }).join("");

    // wire checkboxes
    $$(".fcq-cb").forEach(function (cb) {
      if (cb.classList.contains("disabled")) return;
      cb.addEventListener("click", function () {
        var idx = parseInt(cb.dataset.idx, 10);
        if (selected.has(idx)) { selected.delete(idx); cb.classList.remove("checked"); }
        else { selected.add(idx); cb.classList.add("checked"); }
        updateSelCount();
      });
    });
    updateEligibleCount();
    updateSelCount();
  }

  function updateEligibleCount() {
    var elig = FLEET.filter(isEligible).length;
    $("#eligibleCount").textContent = elig;
    $("#totalCount").textContent = FLEET.length;
    var threats = FLEET.filter(function (i) { return i.pc >= POLICY.pcThreshold; }).length;
    $("#hsThreats").textContent = threats;
    $("#hsFleet").textContent = FLEET.length;
  }

  function updateSelCount() {
    $("#selCount").textContent = selected.size;
    $("#hsQueued").textContent = selected.size;
  }

  function initFleetActions() {
    $("#selectAllBtn").addEventListener("click", function () {
      selected.clear();
      FLEET.forEach(function (item, i) { if (isEligible(item)) selected.add(i); });
      renderFleet();
      log("ENGINE", "Selected all eligible: " + selected.size + " maneuvers queued.", "engine");
    });
    $("#clearSelBtn").addEventListener("click", function () {
      selected.clear();
      renderFleet();
      log("ENGINE", "Selection cleared.", "warn");
    });

    $("#apBatchScan").addEventListener("click", function () {
      log("ENGINE", "Batch scan initiated: " + FLEET.length + " satellites, 12 active CDMs.", "engine");
      var t = 0;
      FLEET.forEach(function (item, i) {
        t += 300;
        setTimeout(function () {
          var elig = isEligible(item);
          log("ENGINE", "Screened " + item.sat + " vs " + item.debris + " — Pc=" + item.pc.toExponential(1) + (elig ? " > Threshold " + POLICY.pcThreshold.toExponential(1) : " — below threshold.") , elig ? "crit" : "engine");
        }, t);
      });
    });

    $("#apExecute").addEventListener("click", executeFleet);
  }

  /* ============================================================
     SECTION 3 — 5-Stage Execution Pipeline
     ============================================================ */
  var STAGES = [
    { name: "AOCS Telecommand Synthesis & Cryptographic Signing", tag: "AOCS_UPLINK" },
    { name: "Reaction Wheel Attitude Pre-Slew", tag: "AOCS_UPLINK" },
    { name: "Thruster Ignition & Accelerometer Telemetry Loop", tag: "THRUST_CONTROL" },
    { name: "Post-Burn Doppler Orbit Determination", tag: "DOPPLER_OD" },
    { name: "72-Hour Secondary Screening Confirmation", tag: "SAFETY_CONFIRM" },
  ];

  function resetPipeline() {
    $$(".pl-stage").forEach(function (s) { s.classList.remove("done", "active", "burn"); });
  }

  function setStageState(n, state) {
    var el = $('.pl-stage[data-stage="' + n + '"]');
    if (!el) return;
    el.classList.remove("done", "active", "burn");
    if (state) el.classList.add(state);
  }

  function executeFleet() {
    if (executing) return;
    if (selected.size === 0) {
      log("ENGINE", "No maneuvers selected. Select eligible conjunctions first.", "warn");
      if (window.SOSUI) SOSUI.toast("No maneuvers selected", "warn");
      return;
    }
    if (POLICY.masterState === "STANDBY") {
      log("ENGINE", "Master state is STANDBY — auto-execution blocked. Switch to ARMED or DRY RUN.", "warn");
      if (window.SOSUI) SOSUI.toast("Autopilot in STANDBY — switch to ARMED", "warn");
      return;
    }
    executing = true;
    var isDry = POLICY.masterState === "SIMULATION_DRY_RUN";
    log("ENGINE", "=== AUTOMATED FLEET CLEARANCE INITIATED === " + selected.size + " maneuvers · Mode: " + POLICY.masterState, "engine");

    var indices = Array.from(selected).sort(function (a, b) { return FLEET[b].pc - FLEET[a].pc; });
    var queue = indices.slice();

    function runNext() {
      if (queue.length === 0) {
        executing = false;
        selected.clear();
        resetPipeline();
        $("#pipelineDetail").innerHTML = '<div class="pl-idle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg><div>Fleet clearance complete. All threats resolved. <b style="color:var(--ap-emerald);">' + FLEET.filter(function(i){return i.status==="resolved";}).length + '/' + FLEET.length + '</b> safe.</div></div>';
        log("ENGINE", "=== FLEET CLEARANCE COMPLETE === All threats resolved.", "engine");
        if (window.SOSUI) SOSUI.toast("Fleet clearance complete — all threats resolved", "success", 3000);
        renderFleet();
        updateResolvedCount();
        return;
      }
      var idx = queue.shift();
      var item = FLEET[idx];
      item.status = "armed";
      renderFleet();
      updateResolvedCount();
      runStages(idx, isDry, function () {
        renderFleet();
        updateResolvedCount();
        runNext();
      });
    }
    runNext();
  }

  function runStages(idx, isDry, done) {
    var item = FLEET[idx];
    var totalDv = item.dvT + item.dvR + item.dvN;
    var cost = propCost(totalDv, item.mass, item.isp);
    resetPipeline();
    var live = $("#pipelineLive"); if (live) live.style.display = "inline-flex";

    var stageNum = 0;
    function advanceStage() {
      if (stageNum > 0) setStageState(stageNum, "done");
      stageNum++;
      if (stageNum > 5) {
        if (live) live.style.display = "none";
        // finalize
        if (!isDry) {
          item.status = "resolved";
          item.fuel = Math.max(0, item.fuel - cost);
          item.miss = Math.round(item.postMiss * 1000);
          item.pc = item.postPc;
        } else {
          item.status = "queued"; // dry run doesn't change state
        }
        done();
        return;
      }
      setStageState(stageNum, stageNum === 3 ? "burn" : "active");
      renderStageDetail(stageNum, item, isDry);
      runStageTelemetry(stageNum, item, isDry, function () { setTimeout(advanceStage, 200); });
    }
    advanceStage();
  }

  function renderStageDetail(n, item, isDry) {
    var totalDv = item.dvT + item.dvR + item.dvN;
    var cost = propCost(totalDv, item.mass, item.isp);
    var host = $("#pipelineDetail");

    if (n === 1) {
      host.innerHTML = stageCardHtml("Stage 1 · AOCS Telecommand Synthesis", item.sat + " vs " + item.debris, [
        kvHtml("Command Frame", "256 B binary", "cyan"),
        kvHtml("Crypto Scheme", "ECDSA-P256", ""),
        kvHtml("Burn Epoch", "TCA − " + POLICY.horizonMin + "min", "warn"),
        kvHtml("ΔV Command", totalDv.toFixed(3) + " m/s", "cyan"),
      ], "Synthesizing binary command frame with maneuver timestamp, quaternion attitude targets, and burn duration…");
    } else if (n === 2) {
      host.innerHTML = stageCardHtml("Stage 2 · Reaction Wheel Attitude Pre-Slew", item.sat, [
        kvHtml("Target Quaternion", "[0.71, 0.00, 0.71, 0.00]", "cyan"),
        kvHtml("Slew Angle", "92.4°", ""),
        kvHtml("Solar Arrays", "FEATHERED", "warn"),
        kvHtml("Drag Area", "−68%", "ok"),
      ], "Reorienting spacecraft to thrust vector [x̂, ŷ, ẑ] with solar array feathering to minimize cross-sectional drag…");
    } else if (n === 3) {
      host.innerHTML = burnCardHtml(item, cost);
    } else if (n === 4) {
      host.innerHTML = stageCardHtml("Stage 4 · Post-Burn Doppler Orbit Determination", item.sat, [
        kvHtml("ΔV Measured", totalDv.toFixed(4) + " m/s", "ok"),
        kvHtml("Δa (Semi-Major)", "+" + (totalDv * 0.62).toFixed(2) + " km", "cyan"),
        kvHtml("ΔT (Period)", "+" + (totalDv * 0.85).toFixed(2) + " s", "cyan"),
        kvHtml("Doppler Residual", "0.08 m/s", "ok"),
      ], "Ground station pass verifying orbital period change and new semi-major axis via Doppler tracking…");
    } else {
      host.innerHTML = stageCardHtml("Stage 5 · 72-Hour Secondary Screening", item.sat, [
        kvHtml("Catalog Scan", "18 SDS · 21,430 obj", "cyan"),
        kvHtml("Forward Window", "72 h", ""),
        kvHtml("New Threats", "0", "ok"),
        kvHtml("New Miss (Min)", item.postMiss.toFixed(2) + " km", "ok"),
      ], "Confirming no new conjunctions created in the 18 SDS catalog within the 72-hour forward propagation window…");
    }
  }

  function stageCardHtml(title, target, kvs, desc) {
    return '<div class="pl-active-card">' +
      '<div class="plac-head"><span class="plac-title">' + esc(title) + '</span><span class="plac-target">' + esc(target) + '</span></div>' +
      '<div class="plac-grid">' + kvs.join("") + '</div>' +
      '<div style="margin-top:11px;font-size:11.5px;color:var(--text-mid);line-height:1.5;">' + esc(desc) + '</div>' +
      '</div>';
  }

  function burnCardHtml(item, cost) {
    return '<div class="pl-active-card">' +
      '<div class="plac-head"><span class="plac-title">Stage 3 · Thruster Ignition & Accelerometer Loop</span><span class="plac-target">' + esc(item.sat) + '</span></div>' +
      '<div class="plac-grid">' +
        kvHtml("Burn Duration", item.burnDur.toFixed(1) + " s", "warn") +
        kvHtml("Target ΔV", (item.dvT + item.dvR + item.dvN).toFixed(3) + " m/s", "warn") +
        kvHtml("Propellant Cost", cost < 1 ? (cost*1000).toFixed(1) + " g" : cost.toFixed(3) + " kg", "warn") +
        kvHtml("Fuel Remaining", item.fuel.toFixed(2) + " kg", "ok") +
      '</div>' +
      '<div class="burn-bar-wrap">' +
        '<div class="burn-bar-top"><span class="k">Burn Progress</span><span class="v" id="burnTimer">' + item.burnDur.toFixed(1) + 's</span></div>' +
        '<div class="burn-bar"><div class="burn-fill pulsing" id="burnFill"></div></div>' +
      '</div>' +
      '<div style="margin-top:10px;font-size:11px;color:var(--text-mid);">Accelerometer closed-loop verification · thruster pulse modulation active</div>' +
      '</div>';
  }

  function kvHtml(k, v, cls) {
    return '<div class="plac-kv"><div class="k">' + k + '</div><div class="v ' + (cls || "") + '">' + v + '</div></div>';
  }

  function runStageTelemetry(n, item, isDry, done) {
    var totalDv = item.dvT + item.dvR + item.dvN;
    var cost = propCost(totalDv, item.mass, item.isp);

    if (n === 1) {
      log("AOCS_UPLINK", "Command frame synthesized for " + item.sat + " — burn epoch TCA−" + POLICY.horizonMin + "m, ΔV=" + totalDv.toFixed(3) + " m/s, t_burn=" + item.burnDur.toFixed(1) + "s", "uplink");
      setTimeout(function () {
        log("AOCS_UPLINK", "Command frame signed (ECDSA-P256) and queued for S-band uplink" + (isDry ? " [DRY RUN]" : "") + ".", "uplink");
        setTimeout(done, 800);
      }, 800);
    } else if (n === 2) {
      log("AOCS_UPLINK", "Reaction wheel slew initiated — 92.4° reorientation to thrust axis. Solar arrays feathered (−68% drag area).", "uplink");
      setTimeout(done, 1600);
    } else if (n === 3) {
      animateBurn(item, cost, isDry, done);
    } else if (n === 4) {
      log("DOPPLER_OD", "Post-burn Doppler pass complete. Measured ΔV=" + totalDv.toFixed(4) + " m/s (error 0.05%). Δa=+" + (totalDv*0.62).toFixed(2) + "km, ΔT=+" + (totalDv*0.85).toFixed(2) + "s.", "uplink");
      setTimeout(function () {
        log("DOPPLER_OD", "New TLE generated and uplinked to 18 SDS catalog. Orbit determination residual: 0.08 m/s.", "uplink");
        setTimeout(done, 600);
      }, 1000);
    } else {
      log("SAFETY_CONFIRM", "72-hour forward propagation screening — 21,430 catalog objects scanned. 0 new conjunctions detected.", "safety");
      setTimeout(function () {
        log("SAFETY_CONFIRM", "Conjunction RESOLVED. " + item.sat + " vs " + item.debris + " — new miss " + item.postMiss.toFixed(2) + " km, Pc reduced to " + fmtPc(item.postPc) + ".", "safety");
        setTimeout(done, 500);
      }, 1200);
    }
  }

  function animateBurn(item, cost, isDry, done) {
    log("THRUST_CONTROL", "Thrusters IGNITED. Target ΔV=" + (item.dvT+item.dvR+item.dvN).toFixed(3) + " m/s. Burn duration: " + item.burnDur.toFixed(1) + "s.", "thrust");
    var fill = $("#burnFill");
    var timer = $("#burnTimer");
    var elapsed = 0;
    var duration = item.burnDur * 1000; // ms, but compress real-time to ~2.5s max
    var realDur = Math.min(duration, 2500);
    var fuelStart = item.fuel;
    var start = performance.now();

    function frame(now) {
      var t = Math.min((now - start) / realDur, 1);
      if (fill) { fill.style.width = (t * 100) + "%"; }
      if (timer) {
        var remaining = item.burnDur * (1 - t);
        timer.textContent = remaining.toFixed(1) + "s";
      }
      // live fuel deduction
      if (!isDry) {
        var liveFuel = fuelStart - cost * t;
        var fuelKv = $$(".plac-kv .v.ok");
        if (fuelKv.length) fuelKv[fuelKv.length - 1].textContent = liveFuel.toFixed(2) + " kg";
      }
      if (t < 1) requestAnimationFrame(frame);
      else {
        log("THRUST_CONTROL", "Thrusters cutoff. Measured ΔV=" + (item.dvT+item.dvR+item.dvN).toFixed(4) + " m/s (error 0.05%). Propellant consumed: " + (cost < 1 ? (cost*1000).toFixed(1) + " g" : cost.toFixed(3) + " kg") + ".", "thrust");
        setTimeout(done, 400);
      }
    }
    requestAnimationFrame(frame);
  }

  function updateResolvedCount() {
    var resolved = FLEET.filter(function (i) { return i.status === "resolved"; }).length;
    $("#hsResolved").textContent = resolved;
    var totalDvReserve = FLEET.reduce(function (s, i) { return s + i.fuel * i.isp * G0 / i.mass; }, 0);
    $("#hsDv").textContent = Math.round(totalDvReserve).toLocaleString() + " m/s";
  }

  /* ============================================================
     SECTION 4 — Flight Director Terminal Log
   ============================================================ */
  var logCount = 0;

  function log(tag, msg, level) {
    var host = $("#terminalBody");
    if (!host) return;
    var now = new Date();
    var ts = "[" + pad(now.getUTCHours()) + ":" + pad(now.getUTCMinutes()) + ":" + pad(now.getUTCSeconds()) + "." + String(now.getUTCMilliseconds()).padStart(3, "0") + "] ";
    var tagCls = level || "engine";
    var line = document.createElement("div");
    line.className = "term-line";
    line.innerHTML = '<span class="term-time">' + ts + '</span><span class="term-tag ' + tagCls + '">[' + tag + ']</span> <span class="term-msg">' + msg + "</span>";
    host.appendChild(line);
    host.scrollTop = host.scrollHeight;
    logCount++;
    $("#logCount").textContent = logCount + " events";
    // cap at 500 lines
    while (host.children.length > 500) host.removeChild(host.firstChild);
  }

  function initTerminal() {
    $("#logClear").addEventListener("click", function () {
      $("#terminalBody").innerHTML = "";
      logCount = 0;
      $("#logCount").textContent = "0 events";
    });
    // boot log
    log("ENGINE", "Autopilot engine initialized. 6 satellites tracked, 12 active CDMs loaded.", "engine");
    log("ENGINE", "Default policy loaded: Pc threshold 1.0e-4, miss 2.5 km, horizon TCA−90min, FUEL_OPTIMAL_IN_TRACK.", "engine");
    log("ENGINE", "Master state: ARMED. Awaiting operator command or batch scan trigger.", "engine");
  }

  /* ============================================================
     helpers
   ============================================================ */
  function fmtPc(v) {
    if (v >= 1) return v.toFixed(1);
    var exp = Math.floor(Math.log10(v));
    var mantissa = v / Math.pow(10, exp);
    var sup = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
    var expStr = String(Math.abs(exp)).split("").map(function (d) { return sup[d] || d; }).join("");
    return mantissa.toFixed(1) + " × 10⁻" + expStr;
  }
  function fmtMiss(m) { return m < 1000 ? m + " m" : (m / 1000).toFixed(2) + " km"; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }

  /* ============================================================
     boot
   ============================================================ */
  onDomReady(function () {
    initPolicy();
    renderFleet();
    initFleetActions();
    initTerminal();
    updateMasterBadge();
    updateResolvedCount();
  });
})();
