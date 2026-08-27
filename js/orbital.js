/* SOS · SafeOrbitForSattelites — canvas / WebGL orbital visualizations
 *
 * OrbitalViewer: 3D Earth globe + full-constellation Keplerian orbital tracks.
 * Realistic scale: 1 km → 0.001 units, Earth radius ≈ 6.378 units.
 * Color hierarchy: selected (cyan glow) · fleet (translucent) · debris (dashed
 * crimson) · post-maneuver (dashed emerald). Period-based true-anomaly motion
 * (T = 2π√(a³/μ)), billboarded labels, GPU disposal, camera damping + focus pivot.
 */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const EARTH_TEXTURE_URL = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg";
  const THREE_CDN_NOTE = "Three.js not loaded — falling back to flat canvas view";

  // Astrodynamics + scale constants
  const EARTH_R_KM = 6378.0;          // mean Earth radius (km)
  const KM_TO_UNITS = 0.001;          // 1 km → 0.001 Three.js units → Earth radius ≈ 6.378 units
  const MU_KM = 398600.4418;         // Earth gravitational parameter (km³/s²)
  const EARTH_R_U = EARTH_R_KM * KM_TO_UNITS;   // 6.378 units
  const BASE_TIME_ACCEL = 100;        // sim-seconds per real-second at 1× (LEO orbit ≈ 57 s real)

  const DEG = Math.PI / 180;
  const d2r = (d) => d * DEG;

  /* ---------- Keplerian → ECI Cartesian (km, Z = polar axis) ---------- */
  // Returns [X, Y, Z] in ECI km given (a, e, i, Ω, ω, ν) all in radians.
  function keplerToECI(a_km, e, inc, raan, omega, nu) {
    const r = (a_km * (1 - e * e)) / (1 + e * Math.cos(nu));   // orbital radius (km)
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);
    // R_z(ω) in the orbital plane
    const x1 = xOrb * Math.cos(omega) - yOrb * Math.sin(omega);
    const y1 = xOrb * Math.sin(omega) + yOrb * Math.cos(omega);
    // R_x(i): (x1, y1·cos i, y1·sin i)
    const y2 = y1 * Math.cos(inc);
    const z2 = y1 * Math.sin(inc);
    // R_z(Ω)
    const X = x1 * Math.cos(raan) - y2 * Math.sin(raan);
    const Y = x1 * Math.sin(raan) + y2 * Math.cos(raan);
    const Z = z2;
    return [X, Y, Z];
  }

  // Solve Kepler's equation M = E − e·sinE (Newton-Raphson) → true anomaly ν.
  function meanToTrue(M, e) {
    let E = M;
    for (let k = 0; k < 8; k++) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      E -= f / fp;
    }
    return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  }

  // ECI (km, Z polar) → Three.js world (Y up, right-handed). 1 km = KM_TO_UNITS.
  function eciToThree(X, Y, Z) {
    return new THREE.Vector3(X * KM_TO_UNITS, Z * KM_TO_UNITS, -Y * KM_TO_UNITS);
  }

  function periodFromA(a_km) {
    return TAU * Math.sqrt(Math.pow(a_km, 3) / MU_KM); // seconds
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(rect.width * dpr, 10);
    canvas.height = Math.max(rect.height * dpr, 10);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function stars(ctx, w, h, n) {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h;
      const a = 0.15 + rnd() * 0.55, r = rnd() < 0.92 ? 0.6 : 1.2;
      ctx.fillStyle = `rgba(200,225,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // Default constellation for the dashboard (real Keplerian elements).
  const DEFAULT_SATELLITES = [
    { name: "EOS-04", norad: 51656, selected: true, color: "#06b6d4",
      kepler: { a_km: EARTH_R_KM + 529, e: 0.00019, i_deg: 97.5, raanDeg: 305.2, argPerigeeDeg: 178.4, periodMin: 95.2, meanAnomaly0Deg: 120 } },
    { name: "Cartosat-3", norad: 44804, color: "#60A5FA",
      kepler: { a_km: EARTH_R_KM + 508, e: 0.00013, i_deg: 97.4, raanDeg: 132.4, argPerigeeDeg: 45.3, periodMin: 94.8, meanAnomaly0Deg: 200 } },
    { name: "EOS-06", norad: 54361, color: "#22D3EE",
      kepler: { a_km: EARTH_R_KM + 743, e: 0.00020, i_deg: 98.4, raanDeg: 245.8, argPerigeeDeg: 112.5, periodMin: 99.3, meanAnomaly0Deg: 45 } },
    { name: "OBJ-8821", norad: 8821, kind: "debris", danger: true, color: "#ef4444",
      kepler: { a_km: EARTH_R_KM + 448, e: 0.00214, i_deg: 97.4, raanDeg: 131.9, argPerigeeDeg: 105.6, periodMin: 92.58, meanAnomaly0Deg: 118 } },
    { name: "OBJ-3421", norad: 3421, kind: "debris", color: "#f59e0b",
      kepler: { a_km: EARTH_R_KM + 515, e: 0.00312, i_deg: 97.5, raanDeg: 208.7, argPerigeeDeg: 61.3, periodMin: 94.69, meanAnomaly0Deg: 195 } },
    { name: "OBJ-1123", norad: 1123, kind: "debris", color: "#94A3B8",
      kepler: { a_km: EARTH_R_KM + 618, e: 0.00188, i_deg: 86.2, raanDeg: 90.2, argPerigeeDeg: 14.9, periodMin: 96.95, meanAnomaly0Deg: 40 } },
    { name: "EOS-04 (post-burn)", norad: 51656, kind: "post-maneuver", color: "#10b981",
      kepler: { a_km: EARTH_R_KM + 529.62, e: 0.00019, i_deg: 97.5, raanDeg: 305.2, argPerigeeDeg: 178.4, periodMin: 95.21, meanAnomaly0Deg: 124 } },
  ];

  /* ---------- Full orbital viewer ---------- */

  class OrbitalViewer {
    constructor(canvas, opts) {
      opts = opts || {};
      this.canvas = canvas;
      this.zoom = 1;
      this._zoomTarget = 1;
      this.playing = true;
      this.t = 0;
      this.simTimeSec = 0;
      this.simSpeed = 1;            // HUD multiplier: 1×, 10×, 60×, 300×
      this.speedMult = 1;           // legacy 2× button multiplier (actions.js)
      this.lastFrame = null;
      this.layers = { satellites: true, debris: true, orbits: true, labels: true, graticule: true, postManeuver: true };
      this.satellites = (opts.satellites || DEFAULT_SATELLITES).map((s) => this._normalizeSat(s));
      this.showConjunction = opts.showConjunction !== false;
      this.cameraDist = opts.cameraDist || 18;
      this._regimeFilter = null;
      this._focusName = null;
      this._camFollow = false;
      // camera spherical targets (damped)
      this.yaw = 0.6; this._yawTarget = 0.6;
      this.pitch = 0.45; this._pitchTarget = 0.45;
      this._camTarget = new THREE.Vector3(0, 0, 0);
      this.useThree = typeof THREE !== "undefined" && !!canvas.getContext("webgl");
      this.liveMode = false;           // SGP4 live-tracking mode (from SOSTracking)
      this._liveGroups = null;        // per-satellite Three.js groups in live mode
      this._liveOrbitEpochs = {};      // cached orbit-trail epoch per noradId
      if (this.useThree) this.initThree();
      else console.warn(THREE_CDN_NOTE);
      this.bindControls();
      requestAnimationFrame((n) => this.loop(n));
      window.addEventListener("resize", () => this.resize());
    }

    /* ===== Three.js scene ===== */

    initThree() {
      const canvas = this.canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      if (THREE.sRGBEncoding !== undefined) this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);

      /* lights */
      this.scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
      const sun = new THREE.DirectionalLight(0xffffff, 1.3);
      sun.position.set(-5, 2, 3);
      this.scene.add(sun);

      /* starfield */
      const starCount = 1600;
      const pos = new Float32Array(starCount * 3);
      let sd = 13;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < starCount; i++) {
        const r = 200 + rnd() * 600;             // far, in world units (Earth=6.378)
        const th = rnd() * TAU, ph = Math.acos(rnd() * 2 - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 1.4, transparent: true, opacity: 0.85 })));

      /* Earth (realistic radius 6.378 units) */
      this.globeGroup = new THREE.Group();
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const dayTex = loader.load(EARTH_TEXTURE_URL, undefined, undefined, () => {
        this.earth.material.map = null;
        this.earth.material.color.set(0x14304a);
        this.earth.material.needsUpdate = true;
      });
      if (THREE.sRGBEncoding !== undefined) dayTex.encoding = THREE.sRGBEncoding;
      this.earth = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_R_U, 64, 48),
        new THREE.MeshPhongMaterial({ map: dayTex, specular: new THREE.Color(0x223344), shininess: 12 })
      );
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_R_U * 1.045, 64, 48),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      this.globeGroup.add(this.earth);
      this.globeGroup.add(atmo);
      this.scene.add(this.globeGroup);

      /* equatorial graticule */
      this._buildGraticule();

      /* orbit rings + satellites */
      this._satGroups = [];
      this._buildSatellites();

      /* conjunction marker (follows the selected/first satellite) */
      if (this.showConjunction) {
        this.conjCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        this.conjRing = new THREE.Mesh(
          new THREE.RingGeometry(0.35, 0.42, 48),
          new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, side: THREE.DoubleSide, depthWrite: false })
        );
        const conjLabel = this.makeLabel(["TCA 04:32:18"], "#FCA5A5");
        conjLabel.scale.set(1.4, 0.35, 1);
        this.conjLabel = conjLabel;
        this.scene.add(this.conjCore);
        this.scene.add(this.conjRing);
        this.scene.add(conjLabel);
      }

      this.bindCameraControls();
      this.resize();
    }

    _buildGraticule() {
      const grp = new THREE.Group();
      const r = EARTH_R_U * 1.002;
      const mat = new THREE.LineBasicMaterial({ color: 0x4f7ca8, transparent: true, opacity: 0.22 });
      // parallels (latitude)
      for (let lat = -75; lat <= 75; lat += 15) {
        const ph = d2r(90 - lat);
        const rr = r * Math.sin(ph);
        const y = r * Math.cos(ph);
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * TAU;
          pts.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
        }
        grp.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat));
      }
      // meridians (longitude)
      for (let lon = 0; lon < 360; lon += 15) {
        const th = d2r(lon);
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const ph = (i / 64) * Math.PI;
          const rr = r * Math.sin(ph);
          pts.push(new THREE.Vector3(Math.cos(th) * rr, r * Math.cos(ph), Math.sin(th) * rr));
        }
        grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      }
      this.graticule = grp;
      this.globeGroup.add(grp);
    }

    /* Normalize any satellite spec (legacy rx/tilt or new kepler) into a unified
       internal record with Kepler elements + 2D-fallback fields. */
    _normalizeSat(s) {
      const sat = Object.assign({}, s);
      if (sat.kepler) {
        const k = sat.kepler;
        sat.a_km = k.a_km;
        sat.e = k.e || 0;
        sat.i_rad = d2r(k.i_deg || 0);
        sat.raan_rad = d2r(k.raanDeg || 0);
        sat.omega_rad = d2r(k.argPerigeeDeg || 0);
        sat.M0 = d2r(k.meanAnomaly0Deg || 0);
        sat.periodSec = (k.periodMin || periodFromA(sat.a_km) / 60) * 60;
      } else {
        // legacy simplified spec → derive pseudo-Kepler
        const A = sat.A != null ? sat.A : (sat.rx || 0.4) * 2.05;   // Earth radii (compressed)
        sat.a_km = Math.max(EARTH_R_KM + 250, A * EARTH_R_KM);
        sat.e = 0;
        sat.i_rad = sat.tilt || 0;
        sat.raan_rad = sat.raan || 0;
        sat.omega_rad = 0;
        sat.M0 = sat.phase || 0;
        sat.periodSec = periodFromA(sat.a_km);
      }
      sat.kind = sat.kind || (sat.debris || sat.danger ? "debris" : "satellite");
      if (sat.danger) sat.kind = "debris";
      if (sat.postManeuver) sat.kind = "post-maneuver";
      sat.color = sat.color || (sat.kind === "debris" ? "#ef4444" : "#06b6d4");
      // 2D-fallback compressed geometry
      sat.A2d = 1 + Math.sqrt(Math.max(sat.a_km - EARTH_R_KM, 0) / EARTH_R_KM) * 0.9;
      sat.tilt = sat.i_rad;
      sat.raan = sat.raan_rad;
      sat.phase = sat.M0;
      sat.speed = 0.02 / Math.max(sat.periodSec / 60, 10);
      sat.altKm = Math.max(0, sat.a_km - EARTH_R_KM);
      return sat;
    }

    /* Build (or rebuild) satellite orbit rings + markers from this.satellites. */
    _buildSatellites() {
      if (!this.useThree) return;
      // dispose previous
      (this._satGroups || []).forEach((g) => this._disposeGroup(g));
      this._satGroups = [];

      this.satellites.forEach((sat) => {
        const ring = this._buildOrbitLine(sat);
        const marker = sat.kind === "satellite" ? this._makeSatelliteMesh(sat) : this._makeDebrisMesh(sat);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this._glowTexture(sat.color), transparent: true, opacity: 0,
          depthTest: false, blending: THREE.AdditiveBlending,
        }));
        halo.scale.set(1.2, 1.2, 1);

        const group = new THREE.Group();
        group.add(ring);
        group.add(marker);
        group.add(halo);
        const label = this.makeLabel(
          [sat.name, "NORAD " + sat.norad, Math.round(sat.altKm) + " km"],
          sat.kind === "debris" ? "#FCA5A5" : (sat.selected ? "#67E8F9" : "rgba(186,222,250,.95)")
        );
        if (sat.selected) label.scale.set(1.6, 0.66, 1); else label.scale.set(1.3, 0.54, 1);

        this.scene.add(group);
        this.scene.add(label);
        this._satGroups.push({ sat, group, marker, ring, label, halo });
      });
    }

    // 128-sample closed orbit path in ECI → Three.js world coordinates.
    _buildOrbitLine(sat) {
      const pts = [];
      const N = 128;
      for (let i = 0; i <= N; i++) {
        const nu = (i / N) * TAU;
        const eci = keplerToECI(sat.a_km, sat.e, sat.i_rad, sat.raan_rad, sat.omega_rad, nu);
        const p = eciToThree(eci[0], eci[1], eci[2]);
        // numerical safety guard against NaN buffer geometry
        if (Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)) pts.push(p);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.computeBoundingSphere();

      let line, mat;
      if (sat.kind === "debris") {
        mat = new THREE.LineDashedMaterial({ color: new THREE.Color(sat.color), dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.45 });
        line = new THREE.Line(geo, mat);          // open path (first==last point) for continuous dashes
        line.computeLineDistances();
      } else if (sat.kind === "post-maneuver") {
        mat = new THREE.LineDashedMaterial({ color: new THREE.Color(sat.color), dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.7 });
        line = new THREE.Line(geo, mat);
        line.computeLineDistances();
      } else if (sat.selected) {
        mat = new THREE.LineBasicMaterial({ color: new THREE.Color(sat.color), transparent: true, opacity: 0.85 });
        line = new THREE.LineLoop(geo, mat);
      } else {
        mat = new THREE.LineBasicMaterial({ color: new THREE.Color(sat.color), transparent: true, opacity: 0.42 });
        line = new THREE.LineLoop(geo, mat);
      }
      return line;
    }

    _makeSatelliteMesh(sat) {
      const grp = new THREE.Group();
      const col = new THREE.Color(sat.color);
      const bodyMat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: sat.selected ? 0.7 : 0.35, shininess: 60 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), bodyMat);
      grp.add(body);
      const panelMat = new THREE.MeshPhongMaterial({ color: 0x0a2540, emissive: col, emissiveIntensity: 0.18, transparent: true, opacity: 0.9 });
      const lp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.12), panelMat); lp.position.x = -0.26; grp.add(lp);
      const rp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.12), panelMat); rp.position.x = 0.26; grp.add(rp);
      grp.scale.setScalar(sat.selected ? 1.0 : 0.7);
      grp.userData.disposable = [bodyMat, body.geometry, panelMat, lp.geometry, rp.geometry];
      return grp;
    }

    _makeDebrisMesh(sat) {
      const grp = new THREE.Group();
      const col = new THREE.Color(sat.color);
      const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(sat.danger ? 0.1 : 0.07, 0), mat);
      grp.add(mesh);
      grp.userData.disposable = [mat, mesh.geometry];
      return grp;
    }

    _disposeGroup(g) {
      this.scene.remove(g.group);
      this.scene.remove(g.label);
      const disp = (g.ring && g.ring.geometry) || null;
      if (g.ring) { if (g.ring.geometry) g.ring.geometry.dispose(); if (g.ring.material) g.ring.material.dispose(); }
      // marker children
      g.marker.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      if (g.halo) { if (g.halo.material.map) g.halo.material.map.dispose(); g.halo.material.dispose(); }
      if (g.label) { if (g.label.material.map) g.label.material.map.dispose(); g.label.material.dispose(); }
      // suppress unused-var warning for disp
      void disp;
    }

    _glowTexture(color) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, color);
      grd.addColorStop(0.4, color);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      return tex;
    }

    /* Replace the satellite set and rebuild orbits (used by Orbital Registry). */
    setSatellites(list) {
      this.satellites = (list || []).map((s) => this._normalizeSat(s));
      if (this.useThree) this._buildSatellites();
    }
    setRegimeFilter(regime) { this._regimeFilter = regime || null; }
    setLayer(key, on) { if (this.layers) this.layers[key] = on !== false; }
    setSpeed(v) { this.simSpeed = v; }
    focusSatellite(name, follow) {
      this._focusName = name || null;
      if (follow) this._camFollow = !!name;
      else if (!name) this._camFollow = false;
    }

    /* Smooth camera pivot to the selected satellite (HUD 🎯 button). */
    focusSelected() {
      const sel = this.satellites.find((s) => s.selected) || this.satellites.find((s) => s.kind === "satellite");
      if (sel) {
        this._focusName = sel.name;
        this._camFollow = true;
        this._zoomTarget = 1.6;
      }
    }

    makeLabel(lines, color) {
      const arr = Array.isArray(lines) ? lines : [lines];
      const c = document.createElement("canvas");
      c.width = 320; c.height = 32 + arr.length * 26;
      const g = c.getContext("2d");
      g.textBaseline = "middle";
      arr.forEach((ln, i) => {
        g.font = i === 0 ? "700 26px 'JetBrains Mono', Consolas, monospace" : "500 18px 'JetBrains Mono', Consolas, monospace";
        g.fillStyle = i === 0 ? color : "rgba(148,163,184,.85)";
        g.fillText(ln, 6, 22 + i * 26);
      });
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      spr.scale.set(1.3, (32 + arr.length * 26) / 320 * 1.3, 1);
      return spr;
    }

    bindCameraControls() {
      const cv = this.canvas;
      let dragging = false, lx = 0, ly = 0;
      cv.style.cursor = "grab";
      cv.addEventListener("pointerdown", (e) => {
        dragging = true; lx = e.clientX; ly = e.clientY;
        cv.style.cursor = "grabbing"; cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        this._yawTarget -= (e.clientX - lx) * 0.005;
        this._pitchTarget = Math.max(-1.35, Math.min(1.35, this._pitchTarget + (e.clientY - ly) * 0.005));
        lx = e.clientX; ly = e.clientY;
      });
      const endDrag = () => { dragging = false; cv.style.cursor = "grab"; };
      cv.addEventListener("pointerup", endDrag);
      cv.addEventListener("pointercancel", endDrag);
      cv.addEventListener("wheel", (e) => {
        e.preventDefault();
        this._zoomTarget = Math.max(0.2, Math.min(12, this._zoomTarget * Math.exp(-e.deltaY * 0.001)));
      }, { passive: false });
    }

    resize() {
      if (this.useThree) {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(rect.width, rect.height, false);
      } else {
        const s = setupCanvas(this.canvas);
        this.ctx = s.ctx; this.w = s.w; this.h = s.h;
      }
    }

    bindControls() {
      const zoomIn = document.querySelector("[data-zoom='in']");
      const zoomOut = document.querySelector("[data-zoom='out']");
      const reset = document.querySelector("[data-cam='reset']");
      const play = document.getElementById("playBtn");
      // Wider zoom range so the operator can zoom from a wide GEO view all the
      // way down to individual LEO satellites near Earth's surface.
      const zoomMax = 12;
      const zoomMin = 0.2;
      if (zoomIn) zoomIn.addEventListener("click", () => (this._zoomTarget = Math.min(this._zoomTarget * 1.2, zoomMax)));
      if (zoomOut) zoomOut.addEventListener("click", () => (this._zoomTarget = Math.max(this._zoomTarget / 1.2, zoomMin)));
      if (reset) reset.addEventListener("click", () => {
        this._zoomTarget = 1; this._yawTarget = 0.6; this._pitchTarget = 0.45; this._camFollow = false;
      });
      if (play) play.addEventListener("click", () => {
        this.playing = !this.playing;
        play.innerHTML = this.playing
          ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        play.setAttribute("aria-label", this.playing ? "Pause simulation" : "Play simulation");
      });
    }

    /* ===== LIVE SGP4 TRACKING MODE =====
     * When enabled, the viewer pulls satellite positions from SOSTracking
     * (propagated via satellite.js) instead of using the internal Kepler
     * simulation.  Orbit trails are generated from SOSTracking.generateTrajectory.
     * The existing render3d() runs each frame; this layer updates marker
     * positions + trail geometry from the live data state. */

    enableLiveTracking(tracking) {
      this.tracking = tracking || window.SOSTracking;
      if (!this.tracking || !this.useThree) return;
      this.liveMode = true;
      // Stop the internal Kepler sim from advancing time in live mode.
      this.simSpeed = 0;
      this._buildLiveSatellites();
      // Rebuild when the fleet data changes (new TLEs loaded).
      this.tracking.on("status", () => this._buildLiveSatellites());
      // Rebuild orbit trails once positions are first computed (the initial
      // _buildLiveSatellites may run before propagateAll populates sat.state).
      this._liveOrbitsBuilt = false;
      this.tracking.on("position", () => {
        if (!this._liveOrbitsBuilt && this._liveGroups && this._liveGroups.length) {
          const hasState = this._liveGroups.some((g) => g.sat.state);
          if (hasState) {
            this._liveOrbitsBuilt = true;
            this._autoFitCamera();
            this._rebuildLiveOrbits();
          }
        }
      });
      // Listen for selection changes to highlight + focus.
      this.tracking.on("select", (noradId) => {
        this._liveFocus = noradId;
        this._camFollow = !!noradId;
        this._buildLiveSatellites(); // refresh highlight colors
      });
      // Listen for time-control changes to rebuild orbit trails.
      this.tracking.on("time", () => this._rebuildLiveOrbits());
    }

    _buildLiveSatellites() {
      if (!this.tracking) return;
      const sats = this.tracking.getSatellites().filter((s) => s.ok);
      // dispose previous live groups
      if (this._liveGroups) this._liveGroups.forEach((g) => this._disposeGroup(g));
      this._liveGroups = [];
      // also clear the legacy satellite groups so they don't overlap
      (this._satGroups || []).forEach((g) => { g.group.visible = false; g.label.visible = false; });

      sats.forEach((sat) => {
        try {
          const selected = this.tracking.getSelected() && this.tracking.getSelected().noradId === sat.noradId;
          const color = this._liveColor(sat, selected);
          const ring = this._buildLiveOrbitLine(sat, selected, color);
          const marker = this._makeSatelliteMesh({ color: color, selected: selected });
          const halo = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._glowTexture(color), transparent: true, opacity: 0,
            depthTest: false, blending: THREE.AdditiveBlending,
          }));
          halo.scale.set(1.2, 1.2, 1);
          const group = new THREE.Group();
          group.add(ring);
          group.add(marker);
          group.add(halo);
          const label = this.makeLabel(
            [sat.name, "NORAD " + sat.noradId, sat.category],
            selected ? "#67E8F9" : "rgba(186,222,250,.9)"
          );
          label.scale.set(selected ? 1.5 : 1.1, selected ? 0.6 : 0.45, 1);
          this.scene.add(group);
          this.scene.add(label);
          this._liveGroups.push({ sat, group, marker, ring, label, halo, color, selected });
        } catch (e) {
          console.warn("[orbital] Failed to build live satellite " + sat.noradId, e);
        }
      });
      this._liveOrbitsBuilt = false;
    }

    /* Auto-fit the camera distance to encompass all live satellites, including
       GEO satellites at ~42,164 km (~42 units) which would be off-screen at the
       default cameraDist of 18. */
    _autoFitCamera() {
      if (!this._liveGroups || !this._liveGroups.length) return;
      let maxR = 0;
      this._liveGroups.forEach((g) => {
        if (g.sat.state && g.sat.state.position) {
          const r = Math.hypot(g.sat.state.position[0], g.sat.state.position[1], g.sat.state.position[2]) * KM_TO_UNITS;
          if (Number.isFinite(r) && r > maxR) maxR = r;
        }
      });
      if (maxR > 0) {
        this.cameraDist = Math.max(16, maxR * 2.6);
      }
    }

    _liveColor(sat, selected) {
      if (selected) return "#22D3EE";        // selected: bright cyan
      if (/GEO|GSO/i.test(sat.category)) return "#60A5FA";  // GEO: blue
      return "#38BDF8";                       // normal: sky/cyan
    }

    _buildLiveOrbitLine(sat, selected, color) {
      const traj = this.tracking.generateTrajectory(sat.noradId, 180, 240);
      const pts = [];
      (traj.points || []).forEach((p) => {
        const v = eciToThree(p.position[0], p.position[1], p.position[2]);
        if (Number.isFinite(v.x)) pts.push(v);
      });
      if (pts.length < 2) {
        // fallback empty line
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0 }));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.computeBoundingSphere();
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: selected ? 0.85 : 0.35,
      });
      return new THREE.LineLoop(geo, mat);
    }

    _rebuildLiveOrbits() {
      if (!this._liveGroups) return;
      this._liveGroups.forEach((g) => {
        if (!g.sat.ok) return;
        const oldRing = g.ring;
        const newRing = this._buildLiveOrbitLine(g.sat, g.selected, g.color);
        g.group.remove(oldRing);
        if (oldRing.geometry) oldRing.geometry.dispose();
        if (oldRing.material) oldRing.material.dispose();
        g.group.add(newRing);
        g.ring = newRing;
        g.ring.visible = this.layers.orbits !== false;
      });
    }

    _updateLivePositions() {
      if (!this._liveGroups || !this._liveGroups.length) return;
      const v = new THREE.Vector3();
      const showLabels = this.layers.labels !== false;
      const pulse = (Math.sin(this.t / 300) + 1) / 2;
      let focusPos = null;
      this._liveGroups.forEach((g) => {
        const sat = g.sat;
        const visible = this.layers.satellites !== false;
        g.group.visible = visible;
        if (!visible) { g.label.visible = false; return; }
        g.ring.visible = this.layers.orbits !== false;
        const state = sat.state;
        if (state && state.position) {
          const pos = eciToThree(state.position[0], state.position[1], state.position[2]);
          if (Number.isFinite(pos.x)) g.marker.position.copy(pos);
        }
        g.marker.getWorldPosition(v);
        g.label.visible = showLabels;
        g.label.position.copy(v);
        g.label.position.y += 0.22;
        g.halo.position.copy(g.marker.position);
        const focused = this._liveFocus && (sat.noradId === this._liveFocus);
        if (g.halo) {
          g.halo.material.opacity = focused ? 0.55 + pulse * 0.35 : (g.selected ? 0.25 + pulse * 0.15 : 0);
          g.halo.scale.setScalar(focused ? 1.6 + pulse * 0.4 : (g.selected ? 1.2 : 1.0));
        }
        g.marker.scale.setScalar(focused ? 1.4 : (g.selected ? 1.0 : 0.7));
        if (focused) focusPos = v.clone();
      });
      return focusPos;
    }

    loop(now) {
      if (!this.w && !this.useThree) this.resize();
      const n = now || performance.now();
      if (this.lastFrame === null) this.lastFrame = n;
      const dt = Math.min(n - this.lastFrame, 100);
      this.lastFrame = n;
      if (this.playing) {
        this.simTimeSec += (dt / 1000) * this.simSpeed * this.speedMult * BASE_TIME_ACCEL;
        this.t += dt * this.speedMult;
      }
      // In live mode, keep the internal clock ticking for label animations.
      if (this.liveMode) this.t += dt * (this.playing ? 1 : 0);
      try {
        if (this.useThree) this.render3d(dt);
        else this.draw();
      } catch (e) {
        if (!this._renderErr) { this._renderErr = true; console.error("OrbitalViewer render error:", e); }
      }
      requestAnimationFrame((nn) => this.loop(nn));
    }

    render3d(dt) {
      const v = new THREE.Vector3();
      // gentle Earth rotation
      this.globeGroup.rotation.y += dt * 0.00004;

      if (this.graticule) this.graticule.visible = this.layers.graticule !== false;
      const showLabels = this.layers.labels !== false;
      const pulse = (Math.sin(this.t / 300) + 1) / 2;

      let focusPos = null;

      // ---- LIVE SGP4 TRACKING MODE ----
      // When enabled, update live satellite markers from SOSTracking data and
      // skip the legacy Kepler propagation loop below.
      if (this.liveMode && this._liveGroups && this._liveGroups.length) {
        focusPos = this._updateLivePositions();
        // hide legacy conjunction marker in live mode (no conjunction data yet)
        if (this.conjCore) this.conjCore.visible = false;
        if (this.conjRing) this.conjRing.visible = false;
        if (this.conjLabel) this.conjLabel.visible = false;
        // camera follow
        this.yaw += (this._yawTarget - this.yaw) * 0.08;
        this.pitch += (this._pitchTarget - this.pitch) * 0.08;
        this.zoom += (this._zoomTarget - this.zoom) * 0.08;
        const tgt = (this._camFollow && focusPos) ? focusPos : new THREE.Vector3(0, 0, 0);
        this._camTarget.lerp(tgt, 0.05);
        // Dynamic zoom clamp: upper bound scales with cameraDist so GEO
        // satellites (cameraDist ~110) remain reachable.  Lower bound lets
        // the operator zoom into LEO satellites near Earth's surface.
        const distMax = Math.max(50, this.cameraDist * 1.6);
        const distMin = 8;
        const dist = Math.max(distMin, Math.min(distMax, this.cameraDist / this.zoom));
        this.camera.position.set(
          this._camTarget.x + dist * Math.cos(this.pitch) * Math.sin(this.yaw),
          this._camTarget.y + dist * Math.sin(this.pitch),
          this._camTarget.z + dist * Math.cos(this.pitch) * Math.cos(this.yaw)
        );
        this.camera.lookAt(this._camTarget);

        // Scale labels relative to camera distance so they stay readable at
        // any zoom level (close-up or far-out GEO view).
        const camDist = this.camera.position.distanceTo(this._camTarget);
        const labelScale = Math.max(0.6, camDist / 30);
        (this._liveGroups || []).forEach((g) => {
          if (g.label && g.label.visible) {
            const base = g.selected ? 1.5 : 1.1;
            g.label.scale.set(base * labelScale, (base * 0.42) * labelScale, 1);
          }
          // Scale markers proportionally so they're visible at wide zoom.
          if (g.marker) {
            const focused = this._liveFocus && (g.sat.noradId === this._liveFocus);
            const baseScale = focused ? 1.4 : (g.selected ? 1.0 : 0.7);
            g.marker.scale.setScalar(baseScale * Math.max(1, labelScale * 0.5));
          }
        });

        this.renderer.render(this.scene, this.camera);
        return;
      }

      (this._satGroups || []).forEach((g) => {
        const sat = g.sat;
        const layerOn =
          sat.kind === "debris" ? this.layers.debris !== false :
          sat.kind === "post-maneuver" ? this.layers.postManeuver !== false :
          this.layers.satellites !== false;
        const regimeOk = !this._regimeFilter || sat.regime === this._regimeFilter;
        const visible = layerOn && regimeOk;
        g.group.visible = visible;
        if (!visible) { g.label.visible = false; return; }
        // ring visibility tied to the orbits layer
        g.ring.visible = this.layers.orbits !== false;

        // period-based true anomaly advance
        const n = TAU / sat.periodSec;                      // mean motion (rad/s)
        const M = sat.M0 + n * this.simTimeSec;
        const nu = meanToTrue(M, sat.e);
        const eci = keplerToECI(sat.a_km, sat.e, sat.i_rad, sat.raan_rad, sat.omega_rad, nu);
        const pos = eciToThree(eci[0], eci[1], eci[2]);
        if (Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z)) {
          g.marker.position.copy(pos);
        }
        g.marker.getWorldPosition(v);
        g.label.visible = showLabels;
        g.label.position.copy(v);
        g.label.position.y += 0.22;
        g.halo.position.copy(g.marker.position);

        const focused = this._focusName && (sat.name === this._focusName);
        if (g.halo) {
          g.halo.material.opacity = focused ? 0.55 + pulse * 0.35 : (sat.selected ? 0.25 + pulse * 0.15 : 0);
          g.halo.scale.setScalar(focused ? 1.6 + pulse * 0.4 : (sat.selected ? 1.2 : 1.0));
        }
        g.marker.scale.setScalar(focused ? 1.4 : (sat.selected ? 1.0 : 0.7));
        if (focused) focusPos = v.clone();
      });

      /* conjunction marker follows the selected/first satellite */
      if (this.showConjunction && this.conjCore && this._satGroups) {
        const lead = this._satGroups.find((g) => g.sat.selected) || this._satGroups[0];
        if (lead) {
          lead.marker.getWorldPosition(v);
          this.conjCore.position.copy(v);
          this.conjRing.position.copy(v);
          this.conjRing.lookAt(this.camera.position);
          this.conjRing.scale.setScalar(0.8 + pulse * 0.9);
          this.conjRing.material.opacity = 0.85 - pulse * 0.55;
          this.conjLabel.position.copy(v);
          this.conjLabel.position.y -= 0.35;
        }
      }

      /* camera damping (dampingFactor ≈ 0.05 → lerp ~0.08/frame) */
      this.yaw += (this._yawTarget - this.yaw) * 0.08;
      this.pitch += (this._pitchTarget - this.pitch) * 0.08;
      this.zoom += (this._zoomTarget - this.zoom) * 0.08;

      // look-at target follows focused satellite or origin
      const tgt = (this._camFollow && focusPos) ? focusPos : new THREE.Vector3(0, 0, 0);
      this._camTarget.lerp(tgt, 0.05);

      const dist = Math.max(7.5, Math.min(50, this.cameraDist / this.zoom));
      this.camera.position.set(
        this._camTarget.x + dist * Math.cos(this.pitch) * Math.sin(this.yaw),
        this._camTarget.y + dist * Math.sin(this.pitch),
        this._camTarget.z + dist * Math.cos(this.pitch) * Math.cos(this.yaw)
      );
      this.camera.lookAt(this._camTarget);

      this.renderer.render(this.scene, this.camera);
    }

    /* ===== 2D fallback (flat canvas view) ===== */

    pos(sat, cx, cy, R) {
      const a = sat.phase + this.t * sat.speed;
      const rad = R * (sat.A2d != null ? sat.A2d : (sat.rx || 0.4) * 2.05);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      return {
        x: cx + x * Math.cos(sat.tilt) - y * Math.sin(sat.tilt),
        y: cy + x * Math.sin(sat.tilt) + y * Math.cos(sat.tilt) * 0.62,
      };
    }

    draw() {
      const { ctx, w, h } = this;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      stars(ctx, w, h, Math.floor((w * h) / 5200));

      const cx = w / 2, cy = h / 2 + 14;
      const R = (Math.min(w, h) * 0.26) * this.zoom;

      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#14304A"); g.addColorStop(0.55, "#0C2036"); g.addColorStop(1, "#050E19");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,.28)"; ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(56,189,248,.5)"; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;

      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      ctx.strokeStyle = "rgba(120,170,220,.13)"; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const ry = (R * 2 * i) / 6 - R;
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * Math.sqrt(Math.max(1 - (ry / R) ** 2, 0.02)), Math.abs(ry) * 0.35 + 0.01, 0, 0, TAU);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const rx = R * Math.cos((i * Math.PI) / 8);
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(rx), R, 0, 0, TAU); ctx.stroke();
      }
      ctx.restore();

      if (this.showConjunction && this.satellites[0]) {
        const conj = this.pos(this.satellites[0], cx, cy, R);
        ctx.save(); ctx.globalAlpha = 0.85;
        const cg = ctx.createRadialGradient(conj.x, conj.y, 2, conj.x, conj.y, 64 * this.zoom);
        cg.addColorStop(0, "rgba(239,68,68,.30)"); cg.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(conj.x, conj.y, 64 * this.zoom, 0, TAU); ctx.fill();
        ctx.restore();
        this._conj2d = conj;
      }

      this.satellites.forEach((sat) => {
        const isDebris = sat.kind === "debris";
        if (isDebris && this.layers && this.layers.debris === false) return;
        if (!isDebris && this.layers && this.layers.satellites === false) return;
        if (sat.kind === "post-maneuver" && this.layers && this.layers.postManeuver === false) return;
        if (this._regimeFilter && sat.regime !== this._regimeFilter) return;
        const showOrbit = !this.layers || this.layers.orbits !== false;
        const col = sat.color;
        const focused = this._focusName && sat.name === this._focusName;
        ctx.save();
        ctx.strokeStyle = col; ctx.globalAlpha = sat.selected ? 0.85 : focused ? 0.8 : (isDebris ? 0.45 : 0.35);
        ctx.lineWidth = sat.selected || focused ? 1.6 : 1;
        if (isDebris || sat.kind === "post-maneuver") ctx.setLineDash([7, 5]);
        if (showOrbit) this.drawOrbitPath(sat, cx, cy, R);
        ctx.restore();

        const pnt = this.pos(sat, cx, cy, R);
        ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = sat.selected || focused ? 14 : 8;
        ctx.beginPath(); ctx.arc(pnt.x, pnt.y, sat.selected || focused ? 5 : 3.6, 0, TAU); ctx.fill();
        ctx.restore();
        if (this.layers.labels !== false) {
          ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
          ctx.fillStyle = isDebris ? "#FCA5A5" : (sat.selected ? "#67E8F9" : "rgba(186,222,250,.9)");
          ctx.fillText(sat.name, pnt.x + 9, pnt.y - 7);
        }
      });

      if (this._conj2d) {
        const conj = this._conj2d;
        const pulse = (Math.sin(this.t / 320) + 1) / 2;
        ctx.save();
        ctx.strokeStyle = `rgba(239,68,68,${0.85 - pulse * 0.6})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(conj.x, conj.y, 8 + pulse * 20, 0, TAU); ctx.stroke();
        ctx.fillStyle = "#EF4444"; ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(conj.x, conj.y, 4.5, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.font = "700 10px 'JetBrains Mono', Consolas, monospace"; ctx.fillStyle = "#FCA5A5";
        ctx.fillText("TCA 04:32:18", conj.x + 10, conj.y + 16);
      }
    }

    pointAt(sat, angle, cx, cy, R) {
      const rad = R * (sat.A2d != null ? sat.A2d : (sat.rx || 0.4) * 2.05);
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;
      return {
        x: cx + x * Math.cos(sat.tilt) - y * Math.sin(sat.tilt),
        y: cy + x * Math.sin(sat.tilt) + y * Math.cos(sat.tilt) * 0.62,
      };
    }

    drawOrbitPath(sat, cx, cy, R) {
      this.ctx.beginPath();
      for (let a = 0; a <= TAU + 0.03; a += 0.04) {
        const q = this.pointAt(sat, a, cx, cy, R);
        if (a === 0) this.ctx.moveTo(q.x, q.y);
        else this.ctx.lineTo(q.x, q.y);
      }
      this.ctx.stroke();
    }
  }

  /* ============================================================
     OrbitalHUD — floating dark-glassmorphism control panel.
     ============================================================ */
  class OrbitalHUD {
    constructor(viewer, container) {
      this.viewer = viewer;
      this.container = container || viewer.canvas.parentElement;
      this.el = document.createElement("div");
      this.el.className = "orbital-hud";
      this.el.setAttribute("role", "group");
      this.el.setAttribute("aria-label", "Orbital viewer controls");
      this.el.innerHTML =
        '<div class="oh-title">ORBITAL HUD</div>' +
        '<button class="oh-btn on" data-layer="orbits" aria-pressed="true">🛰 All Satellite Orbits</button>' +
        '<button class="oh-btn on" data-layer="debris" aria-pressed="true">💥 Debris Clouds</button>' +
        '<button class="oh-btn on" data-layer="postManeuver" aria-pressed="true">↗ Post-Burn Orbit</button>' +
        '<button class="oh-btn on" data-layer="graticule" aria-pressed="true">⭕ Equatorial Graticule</button>' +
        '<button class="oh-btn on" data-layer="labels" aria-pressed="true">🏷 Labels</button>' +
        '<button class="oh-btn oh-focus" data-action="focus">🎯 Focus Selected</button>' +
        '<div class="oh-speed">' +
          '<div class="oh-speed-label">⏱ Simulation Speed</div>' +
          '<div class="oh-speed-row" role="group" aria-label="Simulation speed">' +
            '<button class="oh-sp on" data-speed="1">1×</button>' +
            '<button class="oh-sp" data-speed="10">10×</button>' +
            '<button class="oh-sp" data-speed="60">60×</button>' +
            '<button class="oh-sp" data-speed="300">300×</button>' +
          '</div>' +
        '</div>';
      this.container.appendChild(this.el);
      this._wire();
    }

    _wire() {
      const v = this.viewer;
      this.el.querySelectorAll(".oh-btn[data-layer]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const on = !btn.classList.contains("on");
          btn.classList.toggle("on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          v.setLayer(btn.dataset.layer, on);
        });
      });
      const focusBtn = this.el.querySelector(".oh-focus");
      if (focusBtn) focusBtn.addEventListener("click", () => {
        v.focusSelected();
        focusBtn.classList.add("on");
        setTimeout(() => focusBtn.classList.remove("on"), 1200);
      });
      const spBtns = this.el.querySelectorAll(".oh-sp");
      spBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          spBtns.forEach((b) => b.classList.remove("on"));
          btn.classList.add("on");
          v.setSpeed(parseInt(btn.dataset.speed, 10));
        });
      });
    }
  }

  /* ---------- Plan comparison (maneuver planner) ---------- */

  function initPlanCompare(canvas) {
    if (!canvas) return null;
    let t = 0;
    const plans = [
      { name: "PLAN A", color: "#22C55E", grow: 1.16, dash: [] },
      { name: "PLAN B", color: "#F59E0B", grow: 1.10, dash: [6, 5] },
      { name: "PLAN C", color: "#A78BFA", grow: 1.24, dash: [2, 5] },
    ];
    function frame() {
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      stars(ctx, w, h, 110);
      t += 0.002;

      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.17;

      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#16324D");
      g.addColorStop(1, "#050E19");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,.3)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(148,163,184,.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 2.1, R * 1.25, -0.35, 0, TAU);
      ctx.stroke();

      ctx.save();
      ctx.translate(cx + R * 1.55 * Math.cos(-0.35), cy + R * 1.55 * Math.sin(-0.35));
      ctx.rotate(-0.35);
      ctx.fillStyle = "rgba(239,68,68,.12)";
      ctx.strokeStyle = "rgba(239,68,68,.5)";
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 54, 22, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      plans.forEach((pl, i) => {
        const rot = -0.35 + (i - 1) * 0.16;
        ctx.strokeStyle = pl.color;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(pl.dash);
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * 2.1 * pl.grow, R * 1.25 * pl.grow, rot, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);

        const a = t * (1.4 - i * 0.2) + i * 2.2;
        const px = cx + Math.cos(a) * R * 2.1 * pl.grow * Math.cos(rot) - Math.sin(a) * R * 1.25 * pl.grow * Math.sin(rot);
        const py = cy + Math.cos(a) * R * 2.1 * pl.grow * Math.sin(rot) + Math.sin(a) * R * 1.25 * pl.grow * Math.cos(rot);
        ctx.globalAlpha = 1;
        ctx.fillStyle = pl.color;
        ctx.shadowColor = pl.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 3.4, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = "700 9.5px 'JetBrains Mono', monospace";
        ctx.fillText(pl.name, px + 8, py - 6);
      });

      ctx.font = "600 10px 'JetBrains Mono', monospace";
      let lx = 14, ly = 20;
      [["#94A3B8", "CURRENT ORBIT"], ["#22C55E", "PLAN A"], ["#F59E0B", "PLAN B"], ["#A78BFA", "PLAN C"], ["#EF4444", "CONJUNCTION CORRIDOR"]].forEach(
        ([c, label]) => {
          ctx.fillStyle = c;
          ctx.fillRect(lx, ly - 7, 10, 4);
          ctx.fillStyle = "rgba(148,163,184,.95)";
          ctx.fillText(label, lx + 16, ly - 3);
          ly += 17;
        }
      );

      requestAnimationFrame(frame);
    }
    frame();
    return {};
  }

  /* ---------- Bootstrapping ---------- */

  window.SOSOrbitalViewer = OrbitalViewer;
  window.SOSOrbitalHUD = OrbitalHUD;

  document.addEventListener("DOMContentLoaded", () => {
    const orb = document.getElementById("orbitalCanvas");
    if (orb) {
      const viewer = new OrbitalViewer(orb);
      window.sosOrbitalViewer = viewer;
      // attach the floating HUD to the dashboard orbital viewer
      const wrap = orb.closest(".orbital-viewer");
      if (wrap) window.sosOrbitalHUD = new OrbitalHUD(viewer, wrap);
      // Notify page scripts that the viewer is ready.  shell.js dispatches
      // `shellready` synchronously during its own DOMContentLoaded handler
      // (which fires before this one), so listeners that need the viewer
      // must wait for this event instead.
      document.dispatchEvent(new CustomEvent("viewerready", { detail: viewer }));
    }
    initPlanCompare(document.getElementById("planCanvas"));
  });
})();
