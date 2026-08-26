/* SOS · SafeOrbitForSattelites — accurate close-approach visualization
   Two dummy satellites propagated with RK4 two-body dynamics (js/sim-core.js).
   SAT-042: circular, 450 km, prograde. OBJ-8821: circular, 449.258 km, retrograde.
   Rendered in SAT-042's relative-motion frame with adaptive zoom; TCA, miss
   distance, relative velocity, combined covariance and Pc are all computed,
   not mocked, and written back into the page metrics. */
(function () {
  "use strict";

  const S = window.SOSSim;
  const $id = (i) => document.getElementById(i);

  /* ---------- Scenario (tuned dummy constellation) ---------- */

  const CFG = {
    altAKm: 450,
    altBKm: 449.258,
    retrogradeB: true,
    hbrKm: 0.06,
    cov: { sx: 1.05, sy: 0.74 },
    tMin: 60,
    tMax: 2700
  };
  const nA = Math.sqrt(S.MU / Math.pow(S.RE + CFG.altAKm, 3));
  const nB = Math.sqrt(S.MU / Math.pow(S.RE + CFG.altBKm, 3));
  CFG.phaseA = 0;
  CFG.phaseB = (nA + nB) * 1200;

  const RESULT = S.analyze(CFG);
  const TCA = RESULT.tcaSec;

  /* Sample relative trajectory once (1 s steps) */
  const T0 = TCA - 120, T1 = TCA + 30;
  const samples = [];
  {
    let sa = RESULT.epochStates.A, sb = RESULT.epochStates.B;
    const step = 1;
    let cur = S.propagate(sa, T0, step);
    let curB = S.propagate(sb, T0, step);
    for (let t = T0; t <= T1; t += step) {
      samples.push({
        t,
        ax: cur.x, ay: cur.y,
        rx: curB.x - cur.x, ry: curB.y - cur.y,
        bvx: curB.vx, bvy: curB.vy,
        avx: cur.vx, avy: cur.vy
      });
      cur = S.rk4(cur, step);
      curB = S.rk4(curB, step);
    }
  }
  const stateAt = (t) => {
    const i = Math.max(0, Math.min(samples.length - 1, Math.round(t - T0)));
    return samples[i];
  };

  /* Plane basis (world axes) of the encounter */
  const tc = stateAt(TCA);
  const vn = Math.hypot(tc.bvx - tc.avx, tc.bvy - tc.avy);
  const EX = { x: (tc.bvx - tc.avx) / vn, y: (tc.bvy - tc.avy) / vn };
  const EY = { x: -EX.y, y: EX.x };

  /* ---------- Page readouts ---------- */

  function fmtSci(x) {
    if (x === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(x)));
    const m = x / Math.pow(10, e);
    return m.toFixed(1) + " × 10" + superScript(e);
  }
  function superScript(n) {
    const map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map((c) => map[c] || c).join("");
  }
  function fmtCountdown(t) {
    const d = t - TCA;
    const sign = d < 0 ? "−" : "+";
    const a = Math.abs(d);
    const mm = String(Math.floor(a / 60)).padStart(2, "0");
    const ss = String(Math.floor(a % 60)).padStart(2, "0");
    return "T" + sign + mm + ":" + ss;
  }

  function writeStats() {
    const setText = (id, v) => { const el = $id(id); if (el) el.textContent = v; };
    setText("statMiss", Math.round(RESULT.missKm * 1000) + " m");
    setText("statPc", fmtSci(RESULT.pc));
    setText("statRelV", RESULT.relSpeedKms.toFixed(2) + " km/s");
    setText("statRelSpeed", Math.round(RESULT.relSpeedKms * 3600).toLocaleString("en-US") + " km/h");
    setText("statUnc", RESULT.uncertaintyKm.toFixed(2) + " km");
    const epoch = new Date();
    epoch.setUTCHours(4, 12, 18, 0);
    const tcaDate = new Date(epoch.getTime() + TCA * 1000);
    const p = (n) => String(n).padStart(2, "0");
    setText("statTcaClock",
      p(tcaDate.getUTCHours()) + ":" + p(tcaDate.getUTCMinutes()) + ":" + p(tcaDate.getUTCSeconds()) +
      " · " + tcaDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) + " UTC");
  }

  /* ---------- Rendering ---------- */

  function init(canvas) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let playing = true;
    let t = T0;
    let scale = 0.12;
    let lastTs = null, holdUntil = 0;
    const trail = [];

    const btn = $id("approachPlayBtn");
    if (btn)
      btn.addEventListener("click", () => {
        playing = !playing;
        btn.textContent = playing ? "❚❚" : "▶";
        btn.setAttribute("aria-label", playing ? "Pause simulation" : "Play simulation");
      });

    /* stars background (static seed) */
    const starSeed = [];
    {
      let sd = 13;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < 110; i++)
        starSeed.push({ x: rnd(), y: rnd(), r: rnd() < 0.92 ? 0.6 : 1.1, a: 0.12 + rnd() * 0.5 });
    }

    function niceStep(pxPerKm) {
      const target = 70 / pxPerKm;
      const pow = Math.pow(10, Math.floor(Math.log10(target)));
      for (const m of [1, 2, 5, 10]) if (pow * m >= target) return pow * m;
      return pow * 10;
    }

    function draw(ts) {
      if (lastTs === null) lastTs = ts;
      const dtReal = Math.min((ts - lastTs) / 1000, 0.1);
      lastTs = ts;

      if (playing && ts > holdUntil) {
        if (t >= T1) { t = T0; trail.length = 0; }
        t += dtReal * 24;
        if (t >= T1) holdUntil = ts + 2400;
      }

      const st = stateAt(t);

      /* adaptive scale: keep OBJ marker at ~34% of half-height until close */
      const sep = Math.hypot(st.rx, st.ry);
      const target = Math.min(210, Math.max(0.11, (H * 0.33) / Math.max(sep, RESULT.missKm)));
      scale += (target - scale) * Math.min(1, dtReal * 3);

      ctx.clearRect(0, 0, W, H);
      for (const s of starSeed) {
        ctx.fillStyle = "rgba(200,225,255," + s.a + ")";
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
      }

      const cx = W / 2, cy = H / 2;
      const X = (wx) => cx + wx * scale;
      const Y = (wy) => cy - wy * scale;

      /* reference grid (1 nice-step) centered on SAT-042 */
      const step = niceStep(scale);
      ctx.strokeStyle = "rgba(148,163,184,.09)";
      ctx.lineWidth = 1;
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(148,163,184,.5)";
      const nx = Math.ceil((-cx) / scale / step) * step;
      for (let gx = nx; gx * scale < W / 2; gx += step) {
        ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), H); ctx.stroke();
        ctx.fillText(gx + " km", X(gx) + 3, H - 6);
      }
      const ny = Math.ceil((-cy) / scale / step) * step;
      for (let gy = ny; gy * scale < H / 2; gy += step) {
        ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(W, Y(gy)); ctx.stroke();
        ctx.fillText(gy + " km", 6, Y(gy) - 3);
      }

      /* trail history (relative frame) */
      if (playing) trail.push({ x: st.rx, y: st.ry });
      if (trail.length > 700) trail.shift();

      /* future relative path (dashed) */
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(239,68,68,.45)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let ft = t; ft <= Math.min(T1, t + 40); ft++) {
        const f = stateAt(ft);
        if (ft === t) ctx.moveTo(X(f.rx), Y(f.ry));
        else ctx.lineTo(X(f.rx), Y(f.ry));
      }
      ctx.stroke();
      ctx.restore();

      /* trail */
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "rgba(249,115,22,.5)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      trail.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* uncertainty ellipses at predicted TCA point */
      const tcaS = stateAt(TCA);
      const tcaPX = X(tcaS.rx), tcaPY = Y(tcaS.ry);
      drawEllipse(tcaPX, tcaPY, RESULT.cov.sx * 3, RESULT.cov.sy * 3, EX, EY, "rgba(239,68,68,.05)", "rgba(239,68,68,.22)", true);
      drawEllipse(tcaPX, tcaPY, RESULT.cov.sx, RESULT.cov.sy, EX, EY, null, "rgba(239,68,68,.55)", false);

      /* TCA marker */
      const pulse = (Math.sin(ts / 260) + 1) / 2;
      ctx.strokeStyle = "rgba(239,68,68," + (0.85 - pulse * 0.6) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(tcaPX, tcaPY, 5 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#FCA5A5";
      ctx.fillText("TCA · miss " + Math.round(RESULT.missKm * 1000) + " m", tcaPX + 12, tcaPY + 14);

      /* hard-body radius discs */
      ctx.fillStyle = "rgba(56,189,248,.85)";
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, CFG.hbrKm * scale), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(239,68,68,.85)";
      ctx.beginPath(); ctx.arc(X(st.rx), Y(st.ry), Math.max(3, CFG.hbrKm * scale), 0, Math.PI * 2); ctx.fill();

      /* labels + velocity vectors */
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#7DD3FC";
      ctx.fillText("SAT-042", cx + 10, cy - 8);
      ctx.fillStyle = "#FDBA74";
      ctx.fillText("OBJ-8821", X(st.rx) + 10, Y(st.ry) - 8);
      arrow(cx, cy, st.avx, st.avy, "#38BDF8");
      arrow(X(st.rx), Y(st.ry), st.bvx, st.bvy, "#EF4444");

      /* live range line */
      ctx.strokeStyle = "rgba(148,163,184,.4)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(st.rx), Y(st.ry)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "700 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText("RANGE " + sep.toFixed(3) + " km", (cx + X(st.rx)) / 2 + 8, (cy + Y(st.ry)) / 2 - 6);

      /* HUD */
      const cd = $id("simCountdown"), rg = $id("simRange"), pb = $id("approachProgress");
      if (cd) {
        cd.textContent = fmtCountdown(t);
        cd.style.color = Math.abs(t - TCA) < 5 ? "#EF4444" : "#F4F7FB";
      }
      if (rg) rg.textContent = sep.toFixed(3) + " km";
      if (pb) {
        const frac = Math.max(0, Math.min(1, (t - T0) / (T1 - T0)));
        pb.style.width = (frac * 100).toFixed(1) + "%";
      }

      requestAnimationFrame(draw);
    }

    function arrow(x, y, vx, vy, color) {
      const L = 26;
      const vmag = Math.hypot(vx, vy);
      if (!vmag) return;
      const ux = (vx / vmag) * L, uy = (-vy / vmag) * L;
      const x2 = x + ux, y2 = y + uy;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(ang - 0.4), y2 - 6 * Math.sin(ang - 0.4));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(ang + 0.4), y2 - 6 * Math.sin(ang + 0.4));
      ctx.stroke();
    }

    function drawEllipse(px, py, rxKm, ryKm, ex, ey, fill, stroke, filled) {
      ctx.save();
      ctx.translate(px, py);
      const rot = -Math.atan2(ex.y, ex.x);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rxKm * scale, 2), Math.max(ryKm * scale, 2), 0, 0, Math.PI * 2);
      if (fill && filled) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        if (filled) ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    writeStats();
    requestAnimationFrame(draw);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const c = document.getElementById("approachCanvas");
    if (c && window.SOSSim) init(c);
  });
})();
