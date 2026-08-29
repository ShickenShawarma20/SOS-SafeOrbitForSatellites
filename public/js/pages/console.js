/* SOS · SafeOrbitForSattelites — SSA Tactical Console (6-module) page logic */
(function () {
  "use strict";

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.from((el || document).querySelectorAll(s)); };
  var G0 = 9.80665;            // standard gravitational acceleration (m/s^2)
  var PC_NOMINAL = 2.8e-4;     // Pc at nominal miss (742 m)
  var MISS_NOMINAL = 742;      // nominal miss distance (m)
  var PC_SCALE = 180;          // Pc decay scale (m)
  var WET_MASS = 66.6;         // SAT-51656 wet mass (kg) — calibrated: 0.42 m/s -> 12.4 g

  // shell.js reassigns #shell.innerHTML on DOMContentLoaded, wiping parse-time
  // listeners and resetting containers. console.js loads AFTER shell.js, so a
  // DOMContentLoaded listener registered here runs AFTER that reinjection ->
  // we wire everything on the final, correctly-laid-out DOM.
  var booted = false;
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // app.js wires [data-modal-open] at parse time, which gets wiped by the shell
  // reinjection — re-wire modals locally on the fresh DOM.
  function wireModals() {
    $$("[data-modal-open]").forEach(function (btn) {
      if (btn.dataset.modalWired) return;
      btn.dataset.modalWired = "1";
      btn.addEventListener("click", function () {
        var m = document.getElementById(btn.getAttribute("data-modal-open"));
        if (m) m.classList.add("open");
      });
    });
    $$("[data-modal-close]").forEach(function (btn) {
      if (btn.dataset.modalWired) return;
      btn.dataset.modalWired = "1";
      btn.addEventListener("click", function () {
        var bd = btn.closest(".modal-backdrop");
        if (bd) bd.classList.remove("open");
      });
    });
    $$(".modal-backdrop").forEach(function (bd) {
      if (bd.dataset.bgWired) return;
      bd.dataset.bgWired = "1";
      bd.addEventListener("click", function (e) { if (e.target === bd) bd.classList.remove("open"); });
    });
  }

  /* ============================================================
     MOCK MISSION DATA (deterministic fallback; matches backend schema)
     ============================================================ */
  var CONJUNCTIONS = [
    {
      id: "CD-2024-0526-0417", cls: "crit", label: "CRITICAL",
      primary: "SAT-51656", secondary: "OBJ-8821", noradP: "51656", noradS: "8821",
      typeP: "LEO Sun-Sync", typeS: "Fragmentation Debris",
      relV: 13.7, pc: 2.8e-4, miss: 742,
      r: 312, t: 588, n: 241, cdm: "CDM-06", tcaOffsetSec: 2 * 3600 + 32 * 60 + 18
    },
    {
      id: "CD-2024-0526-0912", cls: "high", label: "HIGH",
      primary: "SAT-44804", secondary: "OBJ-3421", noradP: "44804", noradS: "3421",
      typeP: "LEO Earth-Obs", typeS: "Rocket Body",
      relV: 11.2, pc: 7.6e-6, miss: 1180,
      r: 640, t: 812, n: 502, cdm: "CDM-04", tcaOffsetSec: 5 * 3600 + 1 * 60 + 24
    },
    {
      id: "CD-2024-0526-1542", cls: "routine", label: "ROUTINE",
      primary: "SAT-54361", secondary: "OBJ-1123", noradP: "54361", noradS: "1123",
      typeP: "LEO Comms", typeS: "NaK Droplet",
      relV: 9.4, pc: 1.2e-6, miss: 3820,
      r: 1840, t: 2510, n: 1720, cdm: "CDM-03", tcaOffsetSec: 11 * 3600 + 26 * 60 + 3
    }
  ];

  var FLEET = [
    { id: "SAT-51656", state: "maneuvering", alt: 529, period: 95.2, incl: 97.5, vel: 7.59,
      thruster: "Hydrazine Monoprop", isp: 230, pchamber: 22.4, dvTotal: 285, dvRemain: 142, fuel: 121.0, eol: 0.042 },
    { id: "SAT-44804", state: "active", alt: 612, period: 96.8, incl: 97.9, vel: 7.56,
      thruster: "Hall-Effect Electric Ion", isp: 1600, pchamber: 0.18, dvTotal: 920, dvRemain: 602, fuel: 8.4, eol: 0.009 },
    { id: "SAT-54361", state: "comm_pass", alt: 780, period: 100.4, incl: 98.2, vel: 7.45,
      thruster: "Hydrazine Monoprop", isp: 235, pchamber: 21.8, dvTotal: 240, dvRemain: 96, fuel: 64.2, eol: 0.051 },
    { id: "SAT-58694", state: "safe_hold", alt: 498, period: 94.4, incl: 97.4, vel: 7.62,
      thruster: "Cold Gas N2", isp: 68, pchamber: 4.1, dvTotal: 120, dvRemain: 38, fuel: 4.1, eol: 0.118 },
    { id: "SAT-58990", state: "active", alt: 645, period: 97.5, incl: 98.0, vel: 7.53,
      thruster: "Hall-Effect Electric Ion", isp: 1580, pchamber: 0.17, dvTotal: 880, dvRemain: 551, fuel: 7.9, eol: 0.011 }
  ];

  var SCREEN72 = [
    { t: "T+12h", obj: "OBJ-7781", md: "5.6 km", clear: true },
    { t: "T+28h", obj: "OBJ-9912", md: "8.1 km", clear: true },
    { t: "T+45h", obj: "OBJ-3421", md: "1.9 km", clear: false },
    { t: "T+61h", obj: "OBJ-4410", md: "4.4 km", clear: true }
  ];

  /* ============================================================
     MODULE 1 — Conjunction queue cards + live TCA countdown
     ============================================================ */
  function renderQueue() {
    var host = $("#cxQueue");
    if (!host) return;
    host.innerHTML = CONJUNCTIONS.map(function (c) {
      return '<div class="cxq-card ' + c.cls + '" data-cx="' + c.id + '">' +
        '<div class="cxq-top">' +
          '<span class="cxq-class ' + c.cls + '">' + c.label + '</span>' +
          '<span class="cxq-cdm">' + c.cdm + ' · 18 SDS</span>' +
        '</div>' +
        '<div class="cxq-pair"><span class="pri">' + c.primary + '</span><span class="vs">↔</span><span class="sec">' + c.secondary + '</span></div>' +
        '<div class="cxq-meta"><span>NORAD <b>' + c.noradP + '</b></span><span>NORAD <b>' + c.noradS + '</b></span><span>v<sub>rel</sub> <b>' + c.relV + ' km/s</b></span></div>' +
        '<div class="cxq-meta" style="margin-top:3px;"><span>' + c.typeP + '</span><span style="color:var(--text-low);">·</span><span>' + c.typeS + '</span></div>' +
        '<div class="cxq-tca">' +
          '<span class="lbl">TCA COUNTDOWN</span>' +
          '<span class="clock ' + c.cls + '" data-countdown="' + c.tcaOffsetSec + '">T-00:00:00</span>' +
        '</div>' +
        '<div class="cxq-miss">' +
          '<div class="cxq-axis"><div class="ax">RADIAL R</div><div class="val r">' + fmtM(c.r) + '</div></div>' +
          '<div class="cxq-axis"><div class="ax">IN-TRACK T</div><div class="val t">' + fmtM(c.t) + '</div></div>' +
          '<div class="cxq-axis"><div class="ax">CROSS N</div><div class="val n">' + fmtM(c.n) + '</div></div>' +
        '</div>' +
        '<div class="cxq-pc-row"><span class="k">Pc · Miss</span><span class="v" style="color:' + pcColor(c.pc) + ';">' + fmtPc(c.pc) + ' · ' + fmtMiss(c.miss) + '</span></div>' +
      '</div>';
    }).join("");

    // initial target epochs
    var now = Date.now();
    $$(".cxq-card", host).forEach(function (card, i) {
      card._tcaEpoch = now + CONJUNCTIONS[i].tcaOffsetSec * 1000;
    });
    tickCountdowns();
  }

  function tickCountdowns() {
    $$(".cxq-card .clock[data-countdown]").forEach(function (el) {
      var card = el.closest(".cxq-card");
      var epoch = card && card._tcaEpoch;
      if (!epoch) return;
      var diff = Math.max(0, (epoch - Date.now()) / 1000);
      var h = Math.floor(diff / 3600);
      var m = Math.floor((diff % 3600) / 60);
      var s = Math.floor(diff % 60);
      el.textContent = "T-" + pad(h) + ":" + pad(m) + ":" + pad(s);
      if (diff <= 0) el.textContent = "T+00:00:00";
    });
  }

  /* ============================================================
     MODULE 2 — Fleet & propulsion telemetry
     ============================================================ */
  function renderFleet() {
    var host = $("#fleetList");
    if (!host) return;
    host.innerHTML = FLEET.map(function (f) {
      var pct = (f.dvRemain / f.dvTotal) * 100;
      var low = pct < 25;
      var stateLbl = f.state.toUpperCase().replace("_", " ");
      return '<div class="fleet-card" data-sat="' + f.id + '">' +
        '<div class="fc-top"><span class="fc-satid">' + f.id + '</span>' +
          '<span class="fc-state ' + f.state + '">' + stateLbl + '</span></div>' +
        '<div class="fc-orbit">' +
          '<div><div class="k">Altitude</div><div class="v">' + f.alt + ' km</div></div>' +
          '<div><div class="k">Period</div><div class="v">' + f.period + ' min</div></div>' +
          '<div><div class="k">Inclination</div><div class="v">' + f.incl + '°</div></div>' +
          '<div><div class="k">Velocity</div><div class="v">' + f.vel + ' km/s</div></div>' +
        '</div>' +
        '<div class="fc-prop-head">Propulsion Subsystem</div>' +
        '<div class="fc-prop">' +
          '<div class="k">Thruster</div><div class="v" style="font-size:10.5px;text-align:right;">' + f.thruster + '</div>' +
          '<div class="k">Isp</div><div class="v">' + f.isp + ' s</div>' +
          '<div class="k">Chamber P</div><div class="v">' + f.pchamber + ' bar</div>' +
          '<div class="k">Fuel Remaining</div><div class="v">' + f.fuel + ' kg</div>' +
        '</div>' +
        '<div class="dv-gauge">' +
          '<div class="dv-top"><span class="k">ΔV BUDGET RESERVE</span><span class="v">' + f.dvRemain + ' / ' + f.dvTotal + ' m/s</span></div>' +
          '<div class="dv-bar"><div class="dv-fill' + (low ? " low" : "") + '" style="width:' + pct + '%;"></div></div>' +
          '<div class="dv-foot"><span>' + pct.toFixed(1) + '% remaining</span><span>EOL decay ' + f.eol + ' m/s·yr⁻¹</span></div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  /* ============================================================
     MODULE 4 — ΔV solvers + Tsiolkovsky physics engine
     ============================================================ */
  var DV = { T: 0.42, R: 0.00, N: 0.00 };
  var DIR = { T: "prograde", R: "radial_out", N: "normal" };
  var ISP = 230;             // hydrazine monopropellant for SAT-51656
  var EFF = { T: 4.07, R: 1.20, N: 0.80 };   // km miss gain per (m/s)

  function initSolvers() {
    // sync state from the (fresh) slider DOM
    $$('input[type=range][data-axis]').forEach(function (rng) {
      var axis = rng.dataset.axis;
      DV[axis] = parseInt(rng.value, 10) / 100;
      var vEl = $("#dv" + axis + "Val");
      if (vEl) vEl.textContent = DV[axis].toFixed(2) + " m/s";
    });

    // direction buttons
    $$(".dir-pair").forEach(function (pair) {
      var axis = pair.dataset.axis;
      $$(".dir-btn", pair).forEach(function (btn) {
        btn.addEventListener("click", function () {
          $$(".dir-btn", pair).forEach(function (b) { b.classList.remove("sel"); });
          btn.classList.add("sel");
          DIR[axis] = btn.dataset.dir;
          updateResults();
        });
      });
    });

    // range sliders (value in 0.01 m/s; slider 0..300 -> 0..3.00 m/s)
    $$('input[type=range][data-axis]').forEach(function (rng) {
      var axis = rng.dataset.axis;
      rng.addEventListener("input", function () {
        DV[axis] = parseInt(rng.value, 10) / 100;
        var vEl = $("#dv" + axis + "Val");
        if (vEl) vEl.textContent = DV[axis].toFixed(2) + " m/s";
        updateResults();
      });
    });
    updateResults();
  }

  function totalDv() { return DV.T + DV.R + DV.N; }

  function updateResults() {
    var dv = totalDv();
    // Tsiolkovsky propellant expenditure
    var dm = WET_MASS * (1 - Math.exp(-dv / (ISP * G0))); // kg
    // Miss distance gain
    var gain = EFF.T * DV.T + EFF.R * DV.R + EFF.N * DV.N; // km
    var newMiss = MISS_NOMINAL / 1000 + gain;              // km
    if (newMiss < 0) newMiss = 0;
    var newMissM = newMiss * 1000;
    // Projected Pc (exponential decay from nominal)
    var pc = PC_NOMINAL * Math.exp(-(newMissM - MISS_NOMINAL) / PC_SCALE);
    if (pc < 1e-12) pc = 1e-12;
    // Orbital period shift (dominated by in-track component)
    var vOrbit = 7.59;          // km/s
    var Tperiod = 95.2 * 60;    // seconds
    var sgn = DIR.T === "retrograde" ? -1 : 1;
    var dT = 3 * (DV.T / 1000) / vOrbit * Tperiod * sgn;   // seconds

    setText("resDv", dv.toFixed(2) + " m/s");
    setText("resVec", "T" + (DIR.T === "retrograde" ? "−" : "+") + DV.T.toFixed(2) + " R" + (DIR.R === "radial_in" ? "−" : "+") + DV.R.toFixed(2) + " N" + (DIR.N === "anti_normal" ? "−" : "+") + DV.N.toFixed(2));
    setText("resDm", fmtDm(dm));
    setText("resDmSub", "Tsiolkovsky · Isp " + ISP + "s · ΔT " + (dT >= 0 ? "+" : "") + dT.toFixed(2) + "s");
    setText("resMiss", newMiss.toFixed(2) + " km");
    setText("resMissSub", "+" + Math.round((gain / (MISS_NOMINAL / 1000)) * 100) + "% vs nominal · ΔT " + (dT >= 0 ? "+" : "") + dT.toFixed(2) + "s");
    setText("resPc", fmtPc(pc));
    var ok = pc < 1e-7;
    setClass("resPc", "v", ok ? "ok" : (pc < 1e-4 ? "warn" : "crit"));
    setText("resPcSub", ok ? "< 10⁻⁷ threshold · CLEAR" : (pc < 1e-4 ? "below 10⁻⁴ trigger" : "ABOVE 10⁻⁴ TRIGGER"));

    // 72h screening reflect burn (mark the near one watch if small miss)
    renderScreen72(newMiss);
  }

  function renderScreen72(newMissKm) {
    var host = $("#screen72List");
    if (!host) return;
    host.innerHTML = SCREEN72.map(function (s) {
      var md = parseFloat(s.md);
      var clear = md > 2.0; // post-burn safe corridor > 2 km
      return '<div class="screen72-row">' +
        '<span class="t">' + s.t + '</span>' +
        '<span class="obj">' + s.obj + '</span>' +
        '<span class="md">miss ' + s.md + '</span>' +
        '<span class="stat ' + (clear ? "clear" : "watch") + '">' + (clear ? "CLEAR" : "WATCH") + '</span>' +
      '</div>';
    }).join("");
  }

  /* ============================================================
     MODULE 3 — B-Plane encounter plane canvas
     ============================================================ */
  var bplane = {
    canvas: null, ctx: null, w: 0, h: 0, dpr: 1,
    fov: 2500,             // half-range in meters (+/- 2.5 km)
    dragMul: 1.0,
    sigmaXi: 180,          // cross-track dispersion (m)
    sigmaZeta: 260,        // in-plane / radial dispersion (m) — drag-expanded
    nominal: { xi: 520, zeta: 528 },     // 742 m combined
    shifted: { xi: 300, zeta: 2430 }     // 2.45 km along in-plane
  };

  function initBPlane() {
    bplane.canvas = $("#bplaneCanvas");
    if (!bplane.canvas) return;
    bplane.ctx = bplane.canvas.getContext("2d");
    resizeBPlane();
    window.addEventListener("resize", resizeBPlane);

    var toggle = $("#dragToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        bplane.dragMul = bplane.dragMul === 1.0 ? 1.38 : (bplane.dragMul === 1.38 ? 1.75 : 1.0);
        $("#dragMul").textContent = bplane.dragMul.toFixed(2);
        toggle.classList.toggle("on", bplane.dragMul > 1.0);
        drawBPlane();
        if (window.SOSUI) SOSUI.toast("Space-weather drag multiplier ×" + bplane.dragMul.toFixed(2) + " — in-track covariance expanded", "warn", 2200);
      });
    }
    drawBPlane();
  }

  function resizeBPlane() {
    if (!bplane.canvas) return;
    var c = bplane.canvas;
    bplane.dpr = window.devicePixelRatio || 1;
    var rect = c.getBoundingClientRect();
    bplane.w = rect.width;
    bplane.h = rect.height;
    c.width = Math.round(bplane.w * bplane.dpr);
    c.height = Math.round(bplane.h * bplane.dpr);
    bplane.ctx.setTransform(bplane.dpr, 0, 0, bplane.dpr, 0, 0);
    drawBPlane();
  }

  function m2px() { return (Math.min(bplane.w, bplane.h) / 2) / bplane.fov; } // px per meter
  function cx() { return bplane.w / 2; }
  function cy() { return bplane.h / 2; }

  function drawBPlane() {
    var ctx = bplane.ctx;
    if (!ctx) return;
    var k = m2px();
    ctx.clearRect(0, 0, bplane.w, bplane.h);

    // grid
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    var step = 500; // 500 m grid
    for (var m = -bplane.fov; m <= bplane.fov; m += step) {
      var p = m * k;
      ctx.beginPath(); ctx.moveTo(cx() + p, 0); ctx.lineTo(cx() + p, bplane.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy() + p); ctx.lineTo(bplane.w, cy() + p); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = "rgba(148,163,184,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, cy()); ctx.lineTo(bplane.w, cy()); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx(), 0); ctx.lineTo(cx(), bplane.h); ctx.stroke();

    // axis labels
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.fillText("ξ  (Cross-Track) →", bplane.w - 132, cy() - 8);
    ctx.save(); ctx.translate(cx() + 10, 16); ctx.fillText("ζ  (In-Plane / Radial) →", 0, 0); ctx.restore();
    // scale ticks
    ctx.font = "500 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(100,116,139,0.9)";
    ctx.fillText("±2.5 km", 8, bplane.h - 8);

    var sZeta = bplane.sigmaZeta * bplane.dragMul;

    // covariance ellipses 3σ, 2σ, 1σ (centered on nominal miss)
    var nx = cx() + bplane.nominal.xi * k;
    var ny = cy() - bplane.nominal.zeta * k;   // invert: +ζ up
    var ellipses = [
      { n: 3, col: "rgba(245,158,11,0.12)", stroke: "rgba(245,158,11,0.55)" },
      { n: 2, col: "rgba(56,189,248,0.12)", stroke: "rgba(56,189,248,0.6)" },
      { n: 1, col: "rgba(56,189,248,0.18)", stroke: "rgba(56,189,248,0.85)" }
    ];
    ellipses.forEach(function (e) {
      var rx = bplane.sigmaXi * e.n * k;
      var ry = sZeta * e.n * k;
      ctx.beginPath();
      ctx.ellipse(nx, ny, rx, ry, 0, 0, 2 * Math.PI);
      ctx.fillStyle = e.col; ctx.fill();
      ctx.strokeStyle = e.stroke; ctx.lineWidth = 1.3; ctx.setLineDash(e.n === 3 ? [5, 4] : []); ctx.stroke();
      ctx.setLineDash([]);
    });

    // satellite silhouette at center (origin)
    drawSatellite(ctx, cx(), cy(), 14);
    // HBR keep-out circle (50 m)
    ctx.beginPath();
    ctx.arc(cx(), cy(), Math.max(50 * k, 10), 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(244,63,94,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(244,63,94,0.07)"; ctx.fill();
    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(244,63,94,0.9)";
    ctx.fillText("HBR 50 m", cx() + 14, cy() + 4);

    // nominal miss crosshair (red)
    drawCrosshair(ctx, nx, ny, "rgba(244,63,94,1)", "NOMINAL · 742 m");
    // post-maneuver miss crosshair (green)
    var px = cx() + bplane.shifted.xi * k;
    var py = cy() - bplane.shifted.zeta * k;
    drawCrosshair(ctx, px, py, "rgba(16,185,129,1)", "POST-BURN · 2.45 km");

    // shift vector arrow (nominal -> shifted)
    ctx.strokeStyle = "rgba(16,185,129,0.5)";
    ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
  }

  function drawSatellite(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "rgba(6,182,212,0.85)";
    ctx.lineWidth = 1.4;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    // solar panels
    ctx.fillStyle = "rgba(6,182,212,0.18)";
    ctx.strokeStyle = "rgba(6,182,212,0.6)";
    ctx.fillRect(-s * 1.6, -s * 0.18, s * 0.7, s * 0.36);
    ctx.strokeRect(-s * 1.6, -s * 0.18, s * 0.7, s * 0.36);
    ctx.fillRect(s * 0.9, -s * 0.18, s * 0.7, s * 0.36);
    ctx.strokeRect(s * 0.9, -s * 0.18, s * 0.7, s * 0.36);
    ctx.restore();
  }

  function drawCrosshair(ctx, x, y, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
    ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.font = "700 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = color;
    ctx.fillText(label, x + 11, y - 8);
  }

  /* ============================================================
     MODULE 5 — Autopilot AOCS execution sequence
     ============================================================ */
  var aocsRunning = false;
  var aocsTimer = null;

  function initAocs() {
    var run = $("#runAocs"), reset = $("#resetAocs");
    if (run) run.addEventListener("click", runAocs);
    if (reset) reset.addEventListener("click", resetAocs);
  }

  function resetAocs() {
    if (aocsTimer) { clearInterval(aocsTimer); aocsTimer = null; }
    aocsRunning = false;
    $$(".aocs-step").forEach(function (s) {
      s.classList.remove("active", "done");
      $(".st", s).textContent = "QUEUED";
    });
    var live = $("#aocsLive"); if (live) live.style.display = "none";
  }

  function runAocs() {
    if (aocsRunning) return;
    resetAocs();
    aocsRunning = true;
    var live = $("#aocsLive"); if (live) live.style.display = "inline-flex";
    var steps = $$(".aocs-step");
    var i = 0;
    function advance() {
      if (i > 0) {
        steps[i - 1].classList.remove("active");
        steps[i - 1].classList.add("done");
        $(".st", steps[i - 1]).textContent = "COMPLETE";
      }
      if (i >= steps.length) {
        aocsRunning = false;
        if (live) live.style.display = "none";
        if (window.SOSUI) SOSUI.toast("AOCS burn sequence complete · Doppler OD fix acquired", "success", 3000);
        return;
      }
      steps[i].classList.add("active");
      $(".st", steps[i]).textContent = "EXECUTING";
      i++;
    }
    advance();
    aocsTimer = setInterval(advance, 1400);
  }

  /* ============================================================
     MODULE 5 — Autopilot policy modal
     ============================================================ */
  function initPolicy() {
    // switches
    $$(".switch").forEach(function (sw) {
      function flip() {
        sw.classList.toggle("on");
        sw.setAttribute("aria-checked", sw.classList.contains("on") ? "true" : "false");
      }
      sw.addEventListener("click", flip);
      sw.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
    });

    var save = $("#savePolicy");
    if (save) save.addEventListener("click", function () {
      var pc = parseFloat($("#cfgPc").value);
      var miss = parseFloat($("#cfgMiss").value);
      var horizon = parseFloat($("#cfgHorizon").value);
      var fuel = parseFloat($("#cfgFuel").value);
      setText("polPc", fmtPc(pc));
      setText("polMiss", miss + " km");
      setText("polHorizon", "TCA − " + Math.round(horizon) + " min");
      setText("polFuel", fuel.toFixed(1) + " kg");
      setClass("polPc", "v", pc >= 1e-4 ? "warn" : "");
      if (window.SOSUI) SOSUI.toast("Autopilot policy updated & signed", "success");
    });

    var arm = $("#armAutopilot");
    if (arm) arm.addEventListener("click", function () {
      var b = $("#autopilotBadge");
      var armed = b && b.textContent.trim() === "ARMED";
      if (armed) {
        b.textContent = "DISARMED";
        b.className = "badge badge-neutral";
        arm.textContent = "Arm Autopilot";
        if (window.SOSUI) SOSUI.toast("Autopilot disarmed — manual override", "warn");
      } else {
        b.textContent = "ARMED";
        b.className = "badge badge-nominal";
        arm.textContent = "Disarm Autopilot";
        if (window.SOSUI) SOSUI.toast("Autopilot armed — closed-loop ready", "success");
      }
    });
  }

  /* ============================================================
     MODULE 6 — CDM export (client-side CCSDS 508.0-B-1)
     ============================================================ */
  function initCdmExport() {
    $$("#cdmExportModal .fmt-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fmt = btn.dataset.fmt;
        var data = buildCdm(fmt);
        var blob = new Blob([data], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "CDM_2024-0526-0417." + fmt;
        a.click();
        URL.revokeObjectURL(url);
        if (window.SOSUI) SOSUI.toast("CCSDS CDM exported (." + fmt + ")", "success");
      });
    });
  }

  function buildCdm(fmt) {
    var c = CONJUNCTIONS[0];
    var now = new Date().toISOString();
    if (fmt === "json") {
      return JSON.stringify({
        HEADER: { CCSDS_CDM_VERS: "1.0", ORIGIN: "SOS-SafeOrbitForSattelites", CREATION_DATE: now },
        RELATIVE_METADATA: { TCA: "2024-05-26T04:32:18Z", MISS_DISTANCE: c.miss + " m", RELATIVE_SPEED: (c.relV * 1000) + " m/s" },
        OBJECT1: { OBJECT: c.primary, OBJECT_TYPE: "PAYLOAD", OPERATOR: "SOS", OSCULATING_EPOCH: now, NORAD_CAT_ID: c.noradP },
        OBJECT2: { OBJECT: c.secondary, OBJECT_TYPE: "FRAGMENT", OPERATOR: "UNKNOWN", OSCULATING_EPOCH: now, NORAD_CAT_ID: c.noradS },
        RISK_ASSESSMENT: { PC: c.pc, PARENT_ID: c.cdm }
      }, null, 2);
    }
    if (fmt === "xml") {
      return '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<cdm xmlns="https://public.ccsds.org/ns/cdm">\n' +
        '  <header>\n    <creationDate>' + now + '</creationDate>\n    <origin>SOS-SafeOrbitForSattelites</origin>\n  </header>\n' +
        '  <relativeMetadata><tca>2024-05-26T04:32:18Z</tca><missDistance units="m">' + c.miss + '</missDistance><relativeSpeed units="m/s">' + (c.relV * 1000) + '</relativeSpeed></relativeMetadata>\n' +
        '  <object1><name>' + c.primary + '</name><type>PAYLOAD</type><noradCatId>' + c.noradP + '</noradCatId></object1>\n' +
        '  <object2><name>' + c.secondary + '</name><type>FRAGMENT</type><noradCatId>' + c.noradS + '</noradCatId></object2>\n' +
        '  <riskAssessment><pc>' + c.pc + '</pc><parentId>' + c.cdm + '</parentId></riskAssessment>\n' +
        '</cdm>\n';
    }
    // KVN (key-value notation)
    return "CCSDS_CDM_VERS = 1.0\n" +
      "ORIGIN = SOS-SafeOrbitForSattelites\n" +
      "CREATION_DATE = " + now + "\n" +
      "TCA = 2024-05-26T04:32:18Z\n" +
      "MISS_DISTANCE = " + c.miss + " [m]\n" +
      "RELATIVE_SPEED = " + (c.relV * 1000) + " [m/s]\n" +
      "OBJECT1 = " + c.primary + "\n" +
      "OBJECT1_TYPE = PAYLOAD\n" +
      "OBJECT1_NORAD_CAT_ID = " + c.noradP + "\n" +
      "OBJECT2 = " + c.secondary + "\n" +
      "OBJECT2_TYPE = FRAGMENT\n" +
      "OBJECT2_NORAD_CAT_ID = " + c.noradS + "\n" +
      "PC = " + c.pc + "\n" +
      "PARENT_ID = " + c.cdm + "\n";
  }

  /* ============================================================
     MODULE 6 — Space weather live jitter
     ============================================================ */
  function initWeather() {
    var f107 = 145, kp = 6, drag = 38;
    setInterval(function () {
      f107 += (Math.random() - 0.5) * 2; f107 = clamp(f107, 100, 200);
      kp = clamp(kp + Math.round((Math.random() - 0.5) * 1), 2, 8);
      drag = clamp(drag + Math.round((Math.random() - 0.5) * 6), 15, 55);
      setText("wxF107", Math.round(f107));
      setText("wxKp", kp);
      setText("wxDrag", (drag >= 0 ? "+" : "") + Math.round(drag) + "%");
      tierF107(f107); tierKp(kp); tierDrag(drag);
    }, 4000);
  }
  function tierF107(v) {
    var el = $("#wxF107Tier"), p = $("#wxPulse");
    if (v >= 180) { el.textContent = "STORMY"; el.className = "wx-sub wx-tier-storm"; if (p) p.className = "wx-pulse storm"; }
    else if (v >= 130) { el.textContent = "ELEVATED"; el.className = "wx-sub wx-tier-elev"; if (p) p.className = "wx-pulse"; }
    else { el.textContent = "LOW"; el.className = "wx-sub wx-tier-low"; if (p) p.className = "wx-pulse low"; }
  }
  function tierKp(v) {
    var el = $("#wxKpTier");
    var g = ["QUIET", "QUIET", "G1 MINOR", "G2 MODERATE", "G3 STRONG", "G4 SEVERE", "G5 EXTREME"];
    el.textContent = g[Math.min(v, 9)] || "G5 EXTREME";
    el.className = "wx-sub " + (v >= 5 ? "wx-tier-storm" : v >= 3 ? "wx-tier-elev" : "wx-tier-low");
  }
  function tierDrag(v) {
    var el = $("#wxDragTier");
    el.textContent = v >= 40 ? "DRAG SURGE" : v >= 25 ? "ELEVATED DRAG" : "NOMINAL";
    el.className = "wx-sub " + (v >= 40 ? "wx-tier-storm" : v >= 25 ? "wx-tier-elev" : "wx-tier-low");
  }

  /* ============================================================
     helpers
     ============================================================ */
  function fmtPc(v) { return window.SOS && SOS.fmtPc ? SOS.fmtPc(v) : v.toExponential(1); }
  function fmtMiss(m) { return m < 1000 ? m + " m" : (m / 1000).toFixed(2) + " km"; }
  function fmtM(m) { return m >= 1000 ? (m / 1000).toFixed(2) + " km" : Math.round(m) + " m"; }
  function fmtDm(kg) { return kg < 1 ? (kg * 1000).toFixed(1) + " g" : kg.toFixed(3) + " kg"; }
  function pcColor(pc) { return pc >= 1e-4 ? "var(--crimson)" : pc >= 1e-5 ? "var(--warn)" : "var(--emerald)"; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function setClass(id, base, cls) { var el = document.getElementById(id); if (el) el.className = base + (cls ? " " + cls : ""); }

  /* ============================================================
     boot
     ============================================================ */
  onReady(function () {
    if (booted) return; booted = true;
    renderQueue();
    renderFleet();
    initSolvers();
    initBPlane();
    initAocs();
    initPolicy();
    initCdmExport();
    initWeather();
    wireModals();
    setInterval(tickCountdowns, 1000);
    // fonts/layout may settle after DOMContentLoaded — redraw the B-plane once more
    window.addEventListener("load", function () { resizeBPlane(); });
    setTimeout(resizeBPlane, 250);
    if (window.SOSUI) SOSUI.toast("SSA Tactical Console online · 6 modules nominal", "success", 2600);
  });
})();
