/* SOS · SafeOrbitForSattelites — Collision Avoidance Demo
 *
 * A scripted cinematic that plays a full collision-avoidance scenario on the
 * home-page 3D globe: DETECTION → THREAT → PLAN → BURN → CLEAR.  It drives the
 * existing OrbitalViewer (camera, speed, layers, focus) and overlays a
 * narration + telemetry panel so a hackathon audience can follow the action.
 *
 * The demo swaps in a visually-exaggerated 3-body constellation (satellite,
 * debris, post-burn satellite on a clearly separated orbit) for storytelling,
 * then restores the original fleet when finished.
 */
(function () {
  "use strict";

  var EARTH_R_KM = 6378.0;

  /* Visually-exaggerated demo constellation. The post-burn orbit is lifted
     ~120 km so the diverted (green) ring reads clearly against the original
     (cyan) ring during the demo. Real 0.42 m/s burns shift altitude by < 1 km;
     this exaggeration is purely for visualization. */
  var DEMO_SATS = [
    { name: "SAT-51656", norad: 51656, selected: true, color: "#06b6d4",
      kepler: { a_km: EARTH_R_KM + 529, e: 0.00019, i_deg: 97.5, raanDeg: 305.2, argPerigeeDeg: 178.4, periodMin: 95.2, meanAnomaly0Deg: 120 } },
    { name: "OBJ-8821", norad: 8821, kind: "debris", danger: true, color: "#ef4444",
      kepler: { a_km: EARTH_R_KM + 505, e: 0.00214, i_deg: 97.4, raanDeg: 131.9, argPerigeeDeg: 105.6, periodMin: 92.58, meanAnomaly0Deg: 118 } },
    { name: "SAT-51656 (post-burn)", norad: 51656, kind: "post-maneuver", color: "#10b981",
      kepler: { a_km: EARTH_R_KM + 649, e: 0.00019, i_deg: 97.5, raanDeg: 305.2, argPerigeeDeg: 178.4, periodMin: 96.4, meanAnomaly0Deg: 132 } }
  ];

  /* Phase script. Each phase: duration (s), phase key, narration, and an
     enter(viewer) hook for camera/speed/layer changes. */
  var PHASES = [
    {
      key: "DETECT", dur: 4.5, label: "DETECTION",
      narration: "Conjunction detected. Satellite SAT-51656 on a close-approach course with catalogued debris OBJ-8821.",
      enter: function (v) {
        v.setSpeed(30);
        v._zoomTarget = 2.6;
        v.focusSatellite("SAT-51656", true);
        setText("demoStatus", "MONITORING");
        setText("demoDv", "—");
        setText("demoMiss", "742 m");
        setText("demoPc", "2.8 × 10⁻⁴");
      }
    },
    {
      key: "THREAT", dur: 5.0, label: "THREAT ASSESSMENT",
      narration: "AI Flight Director assessing risk. Probability of collision 2.8×10⁻⁴ exceeds the safe threshold. Time to closest approach is critical.",
      enter: function (v) {
        v.setSpeed(15);
        v._zoomTarget = 3.0;
      }
    },
    {
      key: "PLAN", dur: 5.0, label: "MANEUVER PLANNING",
      narration: "Computing optimal avoidance burn. Recommended plan: 0.42 m/s prograde ΔV. Predicted new miss distance 2.45 km — risk reduced 92.1%.",
      enter: function (v) {
        v.setSpeed(20);
        v._zoomTarget = 2.2;
        highlightPostBurnOrbit(v, true);
        setText("demoDv", "0.42 m/s prograde");
        setText("demoStatus", "PLAN READY");
      }
    },
    {
      key: "BURN", dur: 3.5, label: "BURN EXECUTION",
      narration: "Executing collision-avoidance maneuver. Thrusters firing… satellite transferring to the diverted orbit.",
      enter: function (v) {
        v.setSpeed(60);
        triggerBurnFlash(v);
        hideConjunction(v);
        v.focusSatellite("SAT-51656 (post-burn)", true);
        v._zoomTarget = 2.0;
        setText("demoStatus", "BURNING");
        setText("demoCountdown", "TCA");
      }
    },
    {
      key: "CLEAR", dur: 5.5, label: "COLLISION AVOIDED",
      narration: "Maneuver complete. SAT-51656 now on a safe diverted orbit. New miss distance 2.45 km. Collision avoided.",
      enter: function (v) {
        v.setSpeed(80);
        v._zoomTarget = 1.3;
        highlightPostBurnOrbit(v, true);
        spawnSuccessRing(v);
        setText("demoMiss", "2.45 km");
        setText("demoPc", "2.3 × 10⁻⁷");
        setText("demoStatus", "AVOIDED ✓");
        setText("demoCountdown", "T+00:08");
      }
    }
  ];

  /* ---------------- state ---------------- */
  var viewer = null;
  var hasThree = false;
  var running = false;
  var timers = [];
  var savedState = null;
  var effects = [];      // {obj, update(dt, t), done}
  var rafId = null;
  var phaseStart = 0;
  var demoStart = 0;
  var overlay, panel, phaseEl, narrEl, progEl, countdownEl;

  /* ---------------- bootstrap ---------------- */
  function init() {
    viewer = window.sosOrbitalViewer;
    if (viewer) mountUI();
    else document.addEventListener("viewerready", function (e) { viewer = e.detail; mountUI(); }, { once: true });
  }

  function mountUI() {
    if (!viewer) return;
    var wrap = document.querySelector(".orbital-viewer");
    if (!wrap || wrap.dataset.demoMounted) return;
    wrap.dataset.demoMounted = "1";
    hasThree = !!viewer.useThree && typeof THREE !== "undefined";

    /* Launch button */
    var btn = document.createElement("button");
    btn.className = "demo-launch-btn";
    btn.type = "button";
    btn.id = "demoLaunchBtn";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">' +
      '<path d="M12 2 2.5 20h19L12 2z"/><path d="M12 9.5v4.5M12 17.2v.3" stroke-linecap="round"/></svg>' +
      " COLLISION-AVOIDANCE DEMO";
    btn.addEventListener("click", launch);
    wrap.appendChild(btn);

    /* Overlay panel */
    overlay = document.createElement("div");
    overlay.className = "demo-overlay";
    overlay.id = "demoOverlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="demo-panel">' +
        '<div class="demo-header">' +
          '<span class="demo-phase-badge" id="demoPhase">DETECT</span>' +
          '<span class="demo-title">Collision Avoidance Simulation</span>' +
          '<button class="demo-close" id="demoCloseBtn" aria-label="Close demo">✕</button>' +
        '</div>' +
        '<div class="demo-narration" id="demoNarration"></div>' +
        '<div class="demo-telemetry">' +
          row("Satellite", "SAT-51656") +
          row("Debris Object", "OBJ-8821") +
          row("TCA Countdown", "T-00:30", "demoCountdown") +
          row("Collision Prob.", "2.8 × 10⁻⁴", "demoPc") +
          row("Miss Distance", "742 m", "demoMiss") +
          row("ΔV Maneuver", "—", "demoDv") +
          row("Status", "STANDBY", "demoStatus") +
        '</div>' +
        '<div class="demo-progress"><div class="demo-progress-fill" id="demoProgressFill"></div></div>' +
        '<div class="demo-actions">' +
          '<button class="btn btn-sm" id="demoReplayBtn">Replay</button>' +
          '<span class="demo-hint">Live on 3D globe →</span>' +
        '</div>' +
      '</div>' +
      '<div class="demo-flash" id="demoFlash"></div>';
    wrap.appendChild(overlay);

    phaseEl = overlay.querySelector("#demoPhase");
    narrEl = overlay.querySelector("#demoNarration");
    progEl = overlay.querySelector("#demoProgressFill");
    countdownEl = overlay.querySelector("#demoCountdown");

    overlay.querySelector("#demoCloseBtn").addEventListener("click", closeDemo);
    overlay.querySelector("#demoReplayBtn").addEventListener("click", function () { closeDemo(); setTimeout(launch, 120); });
  }

  function row(label, value, id) {
    var idAttr = id ? ' id="' + id + '"' : "";
    return '<div class="demo-tl-row"><span class="k">' + label + '</span><span class="v"' + idAttr + '>' + value + '</span></div>';
  }

  /* ---------------- run the demo ---------------- */
  function launch() {
    if (running || !viewer) return;
    running = true;
    if (overlay) overlay.hidden = false;
    var launchBtn = document.getElementById("demoLaunchBtn");
    if (launchBtn) launchBtn.style.display = "none";

    saveState(viewer);
    viewer.playing = true;

    /* Swap in the exaggerated demo constellation (one-time rebuild). */
    viewer.setSatellites(DEMO_SATS);
    viewer.layers.postManeuver = true;
    viewer.layers.debris = true;
    viewer.layers.orbits = true;

    effects = [];
    if (hasThree) addThreatLine(viewer);

    demoStart = performance.now();
    runPhase(0);
    startEffectLoop();
  }

  function runPhase(i) {
    if (i >= PHASES.length) { finishDemo(); return; }
    var p = PHASES[i];
    phaseStart = performance.now();
    if (phaseEl) {
      phaseEl.textContent = p.label;
      phaseEl.className = "demo-phase-badge phase-" + p.key.toLowerCase();
    }
    if (narrEl) narrEl.textContent = p.narration;
    try { p.enter(viewer); } catch (e) { console.warn("[demo] phase enter error", e); }

    var t = setTimeout(function () { runPhase(i + 1); }, p.dur * 1000);
    timers.push(t);
  }

  function finishDemo() {
    if (countdownEl) countdownEl.textContent = "AVOIDED";
    var t = setTimeout(closeDemo, 2500);
    timers.push(t);
  }

  function closeDemo() {
    if (!running) return;
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    clearEffects();
    restoreState(viewer);

    if (overlay) overlay.hidden = true;
    var launchBtn = document.getElementById("demoLaunchBtn");
    if (launchBtn) launchBtn.style.display = "";
  }

  /* ---------------- viewer state save/restore ---------------- */
  function saveState(v) {
    savedState = {
      sats: v.satellites.slice(),
      focus: v._focusName,
      follow: v._camFollow,
      zoom: v._zoomTarget,
      yaw: v._yawTarget,
      pitch: v._pitchTarget,
      simSpeed: v.simSpeed,
      speedMult: v.speedMult,
      playing: v.playing,
      layers: Object.assign({}, v.layers),
      conjCoreVis: v.conjCore ? v.conjCore.visible : true,
      conjRingVis: v.conjRing ? v.conjRing.visible : true,
      conjLabelVis: v.conjLabel ? v.conjLabel.visible : true
    };
  }

  function restoreState(v) {
    if (!savedState) { v.setSatellites(DEMO_SATS); return; }
    v.setSatellites(savedState.sats);
    v._focusName = savedState.focus;
    v._camFollow = savedState.follow;
    v._zoomTarget = savedState.zoom;
    v._yawTarget = savedState.yaw;
    v._pitchTarget = savedState.pitch;
    v.simSpeed = savedState.simSpeed;
    v.speedMult = savedState.speedMult;
    v.playing = savedState.playing;
    if (savedState.layers) Object.assign(v.layers, savedState.layers);
    if (v.conjCore) v.conjCore.visible = savedState.conjCoreVis;
    if (v.conjRing) v.conjRing.visible = savedState.conjRingVis;
    if (v.conjLabel) v.conjLabel.visible = savedState.conjLabelVis;
    savedState = null;
  }

  /* ---------------- per-frame effect loop ---------------- */
  function startEffectLoop() {
    var last = performance.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(now - last, 64);
      last = now;
      updateProgress(now);
      updateCountdown(now);
      effects = effects.filter(function (e) {
        var alive = e.update(dt, now);
        if (!alive && e.obj) { removeObj(e.obj); e.obj = null; }
        return alive;
      });
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  function updateProgress(now) {
    if (!progEl) return;
    var total = PHASES.reduce(function (s, p) { return s + p.dur; }, 0);
    var elapsed = (now - demoStart) / 1000;
    progEl.style.width = Math.min(100, (elapsed / total) * 100) + "%";
  }

  function updateCountdown(now) {
    if (!countdownEl) return;
    var elapsed = (now - demoStart) / 1000;
    var detectEnd = PHASES[0].dur + PHASES[1].dur + PHASES[2].dur; // end of PLAN
    if (elapsed >= detectEnd) return; // BURN/CLEAR set it explicitly
    var remaining = Math.max(0, 30 - (elapsed / detectEnd) * 30);
    var mm = Math.floor(remaining / 60);
    var ss = Math.floor(remaining % 60);
    countdownEl.textContent = "T-" + pad(mm) + ":" + pad(ss);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  /* ---------------- Three.js effects ---------------- */

  function satPos(v, name) {
    if (!v._satGroups) return null;
    var g = v._satGroups.find(function (x) { return x.sat.name === name; });
    if (!g) return null;
    var p = new THREE.Vector3();
    g.marker.getWorldPosition(p);
    return p;
  }

  /* Red pulsing threat line between satellite and debris. */
  function addThreatLine(v) {
    if (!hasThree) return;
    var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    var mat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9, linewidth: 2 });
    var line = new THREE.Line(geo, mat);
    v.scene.add(line);
    var born = performance.now();
    effects.push({
      obj: line,
      update: function (dt, now) {
        if (now - born > (PHASES[2].dur + PHASES[0].dur + PHASES[1].dur) * 1000) {
          mat.opacity = Math.max(0, mat.opacity - dt / 400);
          if (mat.opacity <= 0) return false;
        }
        var a = satPos(v, "SAT-51656"), b = satPos(v, "OBJ-8821");
        if (a && b) {
          var arr = geo.attributes.position.array;
          arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
          arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
          geo.attributes.position.needsUpdate = true;
        }
        var pulse = (Math.sin(now / 180) + 1) / 2;
        mat.opacity = Math.min(mat.opacity, 0.55 + pulse * 0.4);
        return true;
      }
    });
  }

  /* Expanding burn flash at the satellite location + screen flash. */
  function triggerBurnFlash(v) {
    var pos = satPos(v, "SAT-51656");
    if (hasThree && pos) {
      var geo = new THREE.SphereGeometry(0.12, 24, 18);
      var mat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      var flash = new THREE.Mesh(geo, mat);
      flash.position.copy(pos);
      v.scene.add(flash);
      var born = performance.now();
      effects.push({
        obj: flash,
        update: function (dt, now) {
          var age = (now - born) / 1000;
          var s = 1 + age * 7;
          flash.scale.setScalar(s);
          mat.opacity = Math.max(0, 0.95 - age / 1.1);
          return mat.opacity > 0;
        }
      });
      /* thrust trail sprite */
      var trailMat = new THREE.SpriteMaterial({ map: glowTexture("#fbbf24"), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      var trail = new THREE.Sprite(trailMat);
      trail.position.copy(pos);
      trail.scale.setScalar(0.6);
      v.scene.add(trail);
      var t0 = performance.now();
      effects.push({
        obj: trail,
        update: function (dt, now) {
          var age = (now - t0) / 1000;
          trail.scale.setScalar(0.6 + age * 3);
          trailMat.opacity = Math.max(0, 0.9 - age / 0.9);
          return trailMat.opacity > 0;
        }
      });
    }
    screenFlash();
  }

  /* Green success ring on the post-burn satellite. */
  function spawnSuccessRing(v) {
    if (!hasThree) return;
    var geo = new THREE.RingGeometry(0.28, 0.34, 48);
    var mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    var ring = new THREE.Mesh(geo, mat);
    v.scene.add(ring);
    var born = performance.now();
    effects.push({
      obj: ring,
      update: function (dt, now) {
        var age = (now - born) / 1000;
        var pos = satPos(v, "SAT-51656 (post-burn)");
        if (pos) ring.position.copy(pos);
        if (v.camera) ring.lookAt(v.camera.position);
        var pulse = (Math.sin(now / 220) + 1) / 2;
        ring.scale.setScalar(0.8 + age * 0.6 + pulse * 0.25);
        mat.opacity = Math.min(0.9, age * 2.5) * (0.5 + pulse * 0.5);
        return age < 6;
      }
    });
  }

  function highlightPostBurnOrbit(v, on) {
    if (!v._satGroups) return;
    v._satGroups.forEach(function (g) {
      if (g.sat.kind === "post-maneuver" && g.ring && g.ring.material) {
        g.ring.material.opacity = on ? 0.95 : 0.7;
      }
    });
  }

  function hideConjunction(v) {
    if (v.conjCore) v.conjCore.visible = false;
    if (v.conjRing) v.conjRing.visible = false;
    if (v.conjLabel) v.conjLabel.visible = false;
  }

  function screenFlash() {
    var flash = document.getElementById("demoFlash");
    if (!flash) return;
    flash.classList.remove("firing");
    void flash.offsetWidth; /* reflow to restart animation */
    flash.classList.add("firing");
  }

  function removeObj(obj) {
    if (!obj || !viewer || !viewer.scene) return;
    viewer.scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) { if (obj.material.map) obj.material.map.dispose(); obj.material.dispose(); }
  }

  function clearEffects() {
    effects.forEach(function (e) { if (e.obj) removeObj(e.obj); });
    effects = [];
  }

  function glowTexture(color) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, color);
    grd.addColorStop(0.3, color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  /* ---------------- go ---------------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
