/* SOS · SafeOrbitForSattelites — canvas orbital visualizations */
(function () {
  "use strict";

  const TAU = Math.PI * 2;

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

  /* ---------- Full orbital viewer (dashboard / planner) ---------- */

  class OrbitalViewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.zoom = 1;
      this.playing = true;
      this.t = 0;
      this.speedMult = 1;
      this.layers = { satellites: true, debris: true, orbits: true };
      this.satellites = [
        { name: "SAT-042", color: "#38BDF8", rx: 0.46, tilt: -0.42, speed: 0.00021, phase: 2.05 },
        { name: "SAT-078", color: "#60A5FA", rx: 0.40, tilt: 0.5, speed: 0.00026, phase: 4.3 },
        { name: "SAT-021", color: "#22D3EE", rx: 0.34, tilt: -0.95, speed: 0.00032, phase: 0.8 },
        { name: "OBJ-8821", color: "#F97316", rx: 0.465, tilt: -0.44, speed: 0.000205, phase: 2.05, danger: true },
        { name: "OBJ-3421", color: "#FBBF24", rx: 0.52, tilt: 0.18, speed: 0.00018, phase: 3.4, debris: true },
        { name: "OBJ-1123", color: "#94A3B8", rx: 0.30, tilt: 1.1, speed: 0.00037, phase: 5.6, debris: true },
      ];
      this.bindControls();
      requestAnimationFrame(() => this.loop());
      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      const s = setupCanvas(this.canvas);
      this.ctx = s.ctx;
      this.w = s.w;
      this.h = s.h;
    }

    bindControls() {
      const zoomIn = document.querySelector("[data-zoom='in']");
      const zoomOut = document.querySelector("[data-zoom='out']");
      const reset = document.querySelector("[data-cam='reset']");
      const play = document.getElementById("playBtn");
      if (zoomIn) zoomIn.addEventListener("click", () => (this.zoom = Math.min(this.zoom * 1.18, 2.4)));
      if (zoomOut) zoomOut.addEventListener("click", () => (this.zoom = Math.max(this.zoom / 1.18, 0.65)));
      if (reset) reset.addEventListener("click", () => { this.zoom = 1; });
      if (play)
        play.addEventListener("click", () => {
          this.playing = !this.playing;
          play.innerHTML = this.playing
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          play.setAttribute("aria-label", this.playing ? "Pause simulation" : "Play simulation");
        });
    }

    pos(sat, cx, cy, R) {
      const a = sat.phase + this.t * sat.speed * 1000;
      const x = Math.cos(a) * R * sat.rx * 2.05;
      const y = Math.sin(a) * R * sat.rx * 2.05;
      return {
        x: cx + x * Math.cos(sat.tilt) - y * Math.sin(sat.tilt),
        y: cy + x * Math.sin(sat.tilt) + y * Math.cos(sat.tilt) * 0.62,
      };
    }

    loop() {
      if (!this.w) this.resize();
      if (this.playing) this.t += 16 * this.speedMult;
      this.draw();
      requestAnimationFrame(() => this.loop());
    }

    draw() {
      const { ctx, w, h } = this;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      stars(ctx, w, h, Math.floor((w * h) / 5200));

      const cx = w / 2, cy = h / 2 + 14;
      const R = (Math.min(w, h) * 0.26) * this.zoom;

      /* Earth */
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#14304A");
      g.addColorStop(0.55, "#0C2036");
      g.addColorStop(1, "#050E19");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      /* atmosphere rim */
      ctx.strokeStyle = "rgba(56,189,248,.28)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(56,189,248,.5)";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* graticule */
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
      /* city lights */
      let sd = 31;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < 70; i++) {
        const ang = rnd() * TAU, rad = Math.sqrt(rnd()) * R * 0.96;
        const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.9;
        ctx.fillStyle = `rgba(255,196,110,${0.12 + rnd() * 0.3})`;
        ctx.fillRect(x, y, 1.3, 1.3);
      }
      ctx.restore();

      /* conjunction corridor */
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

      /* orbit lines + satellites */
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

        const pnt = this.pointAt(sat, (this.t * sat.speed * 1000) % TAU, cx, cy, R);

        /* satellite marker */
        ctx.save();
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = sat.danger ? 14 : 8;
        ctx.beginPath();
        ctx.arc(pnt.x, pnt.y, sat.danger ? 5 : 3.6, 0, TAU);
        ctx.fill();
        ctx.restore();

        /* label */
        ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
        ctx.fillStyle = sat.danger ? "#FDA46A" : "rgba(186,222,250,.9)";
        ctx.fillText(sat.name, pnt.x + 9, pnt.y - 7);
      });

      /* pulsing conjunction marker */
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
  }

  /* ---------- Close-approach geometry (conjunction detail) ---------- */

  function initApproach(canvas) {
    if (!canvas) return null;
    let t = 0;
    function frame() {
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      stars(ctx, w, h, 130);
      t += 0.004;

      const cx = w / 2, cy = h / 2;

      /* uncertainty regions */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.5);
      ctx.fillStyle = "rgba(56,189,248,.09)";
      ctx.strokeStyle = "rgba(56,189,248,.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(-90, 40, 150, 52, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.rotate(1.0);
      ctx.translate(80, -30);
      ctx.fillStyle = "rgba(239,68,68,.09)";
      ctx.strokeStyle = "rgba(239,68,68,.5)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 140, 46, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /* trajectories */
      const drawTraj = (color, dash, phase) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(w * 0.06 + phase * 40, h * 0.86);
        ctx.quadraticCurveTo(cx, cy + 60, w * 0.94 - phase * 40, h * 0.14);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawTraj("#38BDF8", [], 0);
      drawTraj("#EF4444", [8, 6], 1);

      /* moving objects toward TCA */
      const prog = (Math.sin(t) + 1) / 2;
      const lerp = (a, b, k) => a + (b - a) * k;
      const p1 = { x: lerp(w * 0.06, w * 0.94, prog), y: lerp(h * 0.86, h * 0.14, prog) + Math.sin(prog * Math.PI) * 60 };
      const p2 = { x: lerp(w * 0.98, w * 0.08, prog) - 40, y: lerp(h * 0.82, h * 0.18, prog) + Math.sin(prog * Math.PI) * -50 };

      [[p1, "#38BDF8", "SAT-042"], [p2, "#EF4444", "OBJ-8821"]].forEach(([p, c, label]) => {
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = c;
        ctx.fillText(label, p.x + 10, p.y - 8);
      });

      /* TCA point */
      const pulse = (Math.sin(t * 6) + 1) / 2;
      ctx.strokeStyle = `rgba(239,68,68,${0.9 - pulse * 0.65})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + pulse * 22, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#EF4444";
      ctx.shadowColor = "#EF4444";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#FCA5A5";
      ctx.fillText("TCA POINT", cx + 14, cy + 18);
      ctx.fillStyle = "rgba(148,163,184,.9)";
      ctx.fillText("miss distance 742 m", cx + 14, cy + 33);

      requestAnimationFrame(frame);
    }
    frame();
    return {};
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

      /* earth */
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

      /* current orbit + conjunction corridor */
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

      /* candidate plan orbits */
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

      /* legend */
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
    initApproach(document.getElementById("approachCanvas"));
    initPlanCompare(document.getElementById("planCanvas"));
  });
})();
