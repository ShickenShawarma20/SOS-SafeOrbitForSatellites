/* SOS · SafeOrbitForSattelites — canvas / WebGL orbital visualizations */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const EARTH_TEXTURE_URL = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg";
  const THREE_CDN_NOTE = "Three.js not loaded — falling back to flat canvas view";

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

  /* ---------- Full orbital viewer (dashboard) ---------- */

  class OrbitalViewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.zoom = 1;
      this.playing = true;
      this.t = 0;
      this.lastFrame = null;
      this.speedMult = 1;
      this.layers = { satellites: true, debris: true, orbits: true };
      this.satellites = [
        { name: "EOS-04", color: "#38BDF8", rx: 0.46, tilt: -0.42, speed: 0.00021, phase: 2.05 },
        { name: "Cartosat-3", color: "#60A5FA", rx: 0.40, tilt: 0.5, speed: 0.00026, phase: 4.3 },
        { name: "EOS-06", color: "#22D3EE", rx: 0.34, tilt: -0.95, speed: 0.00032, phase: 0.8 },
        { name: "OBJ-8821", color: "#F97316", rx: 0.465, tilt: -0.44, speed: 0.000205, phase: 2.05, danger: true },
        { name: "OBJ-3421", color: "#FBBF24", rx: 0.52, tilt: 0.18, speed: 0.00018, phase: 3.4, debris: true },
        { name: "OBJ-1123", color: "#94A3B8", rx: 0.30, tilt: 1.1, speed: 0.00037, phase: 5.6, debris: true },
      ];
      this.useThree = typeof THREE !== "undefined" && !!canvas.getContext("webgl");
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
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
      this.yaw = 0.6;
      this.pitch = 0.32;

      /* lights */
      this.scene.add(new THREE.AmbientLight(0x8899bb, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.25);
      sun.position.set(-5, 2, 3);
      this.scene.add(sun);

      /* starfield */
      const starCount = 1400;
      const pos = new Float32Array(starCount * 3);
      let sd = 13;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < starCount; i++) {
        const r = 40 + rnd() * 60;
        const th = rnd() * TAU, ph = Math.acos(rnd() * 2 - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.scene.add(
        new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 0.12, transparent: true, opacity: 0.85 }))
      );

      /* Earth */
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
        new THREE.SphereGeometry(1, 64, 48),
        new THREE.MeshPhongMaterial({ map: dayTex, specular: new THREE.Color(0x223344), shininess: 12 })
      );
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.045, 64, 48),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      this.globeGroup.add(this.earth);
      this.globeGroup.add(atmo);
      this.scene.add(this.globeGroup);

      /* orbit rings + satellites */
      this.satellites.forEach((sat) => {
        const A = sat.rx * 2.05;
        let hash = 0;
        for (let i = 0; i < sat.name.length; i++) hash = (hash * 31 + sat.name.charCodeAt(i)) % 628;
        sat.raan = (hash / 100);

        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * TAU;
          pts.push(new THREE.Vector3(Math.cos(a) * A, 0, Math.sin(a) * A));
        }
        const ring = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: new THREE.Color(sat.color),
            transparent: true,
            opacity: sat.danger ? 0.75 : 0.35,
          })
        );
        const group = new THREE.Group();
        group.add(ring);
        group.quaternion.setFromEuler(new THREE.Euler(sat.tilt, sat.raan, 0, "YXZ"));

        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(sat.danger ? 0.03 : 0.022, 16, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(sat.color) })
        );
        group.add(marker);

        sat._A = A;
        sat._group = group;
        sat._marker = marker;
        sat._label = this.makeLabel(sat.name, sat.danger ? "#FDA46A" : "rgba(186,222,250,.95)");
        this.scene.add(group);
        this.scene.add(sat._label);
      });

      /* conjunction marker (follows SAT-51656) */
      this.conjCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      this.conjRing = new THREE.Mesh(
        new THREE.RingGeometry(0.07, 0.085, 48),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      );
      const conjLabel = this.makeLabel("TCA 04:32:18", "#FCA5A5");
      conjLabel.scale.set(0.55, 0.14, 1);
      this.conjLabel = conjLabel;
      this.scene.add(this.conjCore);
      this.scene.add(this.conjRing);
      this.scene.add(conjLabel);

      this.bindCameraControls();
      this.resize();
    }

    makeLabel(text, color) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const g = c.getContext("2d");
      g.font = "600 28px 'JetBrains Mono', Consolas, monospace";
      g.fillStyle = color;
      g.textBaseline = "middle";
      g.fillText(text, 4, 34);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      spr.scale.set(0.42, 0.105, 1);
      return spr;
    }

    bindCameraControls() {
      const cv = this.canvas;
      let dragging = false, lx = 0, ly = 0;
      cv.style.cursor = "grab";
      cv.addEventListener("pointerdown", (e) => {
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
        cv.style.cursor = "grabbing";
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        this.yaw -= (e.clientX - lx) * 0.005;
        this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + (e.clientY - ly) * 0.005));
        lx = e.clientX;
        ly = e.clientY;
      });
      const endDrag = () => {
        dragging = false;
        cv.style.cursor = "grab";
      };
      cv.addEventListener("pointerup", endDrag);
      cv.addEventListener("pointercancel", endDrag);
      cv.addEventListener("wheel", (e) => {
        e.preventDefault();
        this.zoom = Math.max(0.65, Math.min(2.4, this.zoom * Math.exp(-e.deltaY * 0.001)));
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
        this.ctx = s.ctx;
        this.w = s.w;
        this.h = s.h;
      }
    }

    bindControls() {
      const zoomIn = document.querySelector("[data-zoom='in']");
      const zoomOut = document.querySelector("[data-zoom='out']");
      const reset = document.querySelector("[data-cam='reset']");
      const play = document.getElementById("playBtn");
      if (zoomIn) zoomIn.addEventListener("click", () => (this.zoom = Math.min(this.zoom * 1.18, 2.4)));
      if (zoomOut) zoomOut.addEventListener("click", () => (this.zoom = Math.max(this.zoom / 1.18, 0.65)));
      if (reset)
        reset.addEventListener("click", () => {
          this.zoom = 1;
          if (this.useThree) {
            this.yaw = 0.6;
            this.pitch = 0.32;
          }
        });
      if (play)
        play.addEventListener("click", () => {
          this.playing = !this.playing;
          play.innerHTML = this.playing
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          play.setAttribute("aria-label", this.playing ? "Pause simulation" : "Play simulation");
        });
    }

    loop(now) {
      if (!this.w && !this.useThree) this.resize();
      if (this.lastFrame === null) this.lastFrame = now || performance.now();
      const dt = Math.min((now || performance.now()) - this.lastFrame, 100);
      this.lastFrame = now || performance.now();
      if (this.playing) this.t += dt * this.speedMult;
      if (this.useThree) this.render3d(dt);
      else this.draw();
      requestAnimationFrame((n) => this.loop(n));
    }

    render3d(dt) {
      const v = new THREE.Vector3();

      this.globeGroup.rotation.y += dt * 0.00004;

      this.satellites.forEach((sat) => {
        const isDebris = sat.debris || sat.danger;
        sat._group.visible = isDebris ? this.layers.debris !== false : this.layers.satellites !== false;
        sat._group.children.forEach((ch) => {
          if (ch.isLine) ch.visible = this.layers.orbits !== false;
        });
        const a = sat.phase + this.t * sat.speed;
        sat._marker.position.set(Math.cos(a) * sat._A, 0, Math.sin(a) * sat._A);
        sat._marker.getWorldPosition(v);
        sat._label.position.copy(v);
        sat._label.position.y += 0.09;
      });

      /* conjunction follows SAT-51656 */
      const conj = this.satellites[0];
      conj._marker.getWorldPosition(v);
      this.conjCore.position.copy(v);
      this.conjRing.position.copy(v);
      this.conjRing.lookAt(this.camera.position);
      const pulse = (Math.sin(this.t / 300) + 1) / 2;
      this.conjRing.scale.setScalar(0.8 + pulse * 0.9);
      this.conjRing.material.opacity = 0.85 - pulse * 0.55;
      this.conjLabel.position.copy(v);
      this.conjLabel.position.y -= 0.11;

      /* camera */
      const dist = 4.6 / this.zoom;
      this.camera.position.set(
        dist * Math.cos(this.pitch) * Math.sin(this.yaw),
        dist * Math.sin(this.pitch),
        dist * Math.cos(this.pitch) * Math.cos(this.yaw)
      );
      this.camera.lookAt(0, 0, 0);

      this.renderer.render(this.scene, this.camera);
    }

    /* ===== 2D fallback (original flat view) ===== */

    pos(sat, cx, cy, R) {
      const a = sat.phase + this.t * sat.speed;
      const x = Math.cos(a) * R * sat.rx * 2.05;
      const y = Math.sin(a) * R * sat.rx * 2.05;
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
      g.addColorStop(0, "#14304A");
      g.addColorStop(0.55, "#0C2036");
      g.addColorStop(1, "#050E19");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = "rgba(56,189,248,.28)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(56,189,248,.5)";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.clip();
      ctx.strokeStyle = "rgba(120,170,220,.13)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const ry = (R * 2 * i) / 6 - R;
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * Math.sqrt(Math.max(1 - (ry / R) ** 2, 0.02)), Math.abs(ry) * 0.35 + 0.01, 0, 0, TAU);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const rx = R * Math.cos((i * Math.PI) / 8);
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(rx), R, 0, 0, TAU);
        ctx.stroke();
      }
      let sd = 31;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < 70; i++) {
        const ang = rnd() * TAU, rad = Math.sqrt(rnd()) * R * 0.96;
        const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.9;
        ctx.fillStyle = `rgba(255,196,110,${0.12 + rnd() * 0.3})`;
        ctx.fillRect(x, y, 1.3, 1.3);
      }
      ctx.restore();

      const conj = this.pos(this.satellites[0], cx, cy, R);
      ctx.save();
      ctx.globalAlpha = 0.85;
      const cg = ctx.createRadialGradient(conj.x, conj.y, 2, conj.x, conj.y, 64 * this.zoom);
      cg.addColorStop(0, "rgba(239,68,68,.30)");
      cg.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(conj.x, conj.y, 64 * this.zoom, 0, TAU);
      ctx.fill();
      ctx.restore();

      this.satellites.forEach((sat) => {
        const isDebris = sat.debris || sat.danger;
        if (isDebris && this.layers && this.layers.debris === false) return;
        if (!isDebris && this.layers && this.layers.satellites === false) return;
        const showOrbit = !this.layers || this.layers.orbits !== false;
        const col = sat.color;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = sat.danger ? 0.75 : 0.3;
        ctx.lineWidth = sat.danger ? 1.6 : 1;
        if (sat.danger) ctx.setLineDash([7, 5]);
        if (showOrbit) this.drawOrbitPath(sat, cx, cy, R);
        ctx.restore();

        const pnt = this.pos(sat, cx, cy, R);

        ctx.save();
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = sat.danger ? 14 : 8;
        ctx.beginPath();
        ctx.arc(pnt.x, pnt.y, sat.danger ? 5 : 3.6, 0, TAU);
        ctx.fill();
        ctx.restore();

        ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
        ctx.fillStyle = sat.danger ? "#FDA46A" : "rgba(186,222,250,.9)";
        ctx.fillText(sat.name, pnt.x + 9, pnt.y - 7);
      });

      const pulse = (Math.sin(this.t / 320) + 1) / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(239,68,68,${0.85 - pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(conj.x, conj.y, 8 + pulse * 20, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#EF4444";
      ctx.shadowColor = "#EF4444";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(conj.x, conj.y, 4.5, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.font = "700 10px 'JetBrains Mono', Consolas, monospace";
      ctx.fillStyle = "#FCA5A5";
      ctx.fillText("TCA 04:32:18", conj.x + 10, conj.y + 16);
    }

    pointAt(sat, angle, cx, cy, R) {
      const x = Math.cos(angle) * R * sat.rx * 2.05;
      const y = Math.sin(angle) * R * sat.rx * 2.05;
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

  document.addEventListener("DOMContentLoaded", () => {
    const orb = document.getElementById("orbitalCanvas");
    if (orb) window.sosOrbitalViewer = new OrbitalViewer(orb);
    initPlanCompare(document.getElementById("planCanvas"));
  });
})();
