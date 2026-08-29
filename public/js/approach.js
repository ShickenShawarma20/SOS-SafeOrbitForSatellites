/* SOS · SafeOrbitForSattelites — close-approach visualization
 *
 * Data-driven encounter-plane renderer.  Fetches the real propagated geometry
 * for ANY conjunction from /api/v1/conjunctions/:id/geometry (3D two-body
 * propagation from each object's catalogued orbital elements), then renders:
 *
 *   1. Encounter Corridor  — animated, adaptively-zoomed side view of the
 *      secondary approaching and passing the primary at the B-plane miss
 *      distance (linear short-encounter model, the CDM standard).
 *   2. B-Plane target plot — the miss plane (ξ, ζ) with 1σ/2σ/3σ covariance
 *      ellipses and the hard-body-radius keep-out circle; shows the Pc
 *      geometry (ellipse ⊗ keep-out = collision risk) at a glance.
 *   3. Orbit Context      — top-down projection of both real orbit rings with
 *      the encounter region marked, so the encounter is understood in the
 *      context of the two actual orbits.
 *
 * Miss distance, relative velocity, covariance and Pc are computed from the
 * fetched conjunction geometry (not mocked) and shown live in the HUD.  Falls
 * back to the legacy reference scenario if the API is unreachable.
 */
(function () {
  "use strict";

  const S = window.SOSSim;
  const SOS = window.SOS;
  const $id = (i) => document.getElementById(i);

  /* ---------- Legacy fallback scenario (SAT-51656 ↔ OBJ-8821) ---------- */
  function legacyScenario() {
    const CFG = {
      altAKm: 529, altBKm: 449.258, retrogradeB: true, hbrKm: 0.06,
      cov: { sx: 1.05, sy: 0.74 }, tMin: 60, tMax: 2700,
    };
    const nA = Math.sqrt(S.MU / Math.pow(S.RE + CFG.altAKm, 3));
    const nB = Math.sqrt(S.MU / Math.pow(S.RE + CFG.altBKm, 3));
    CFG.phaseA = 0;
    CFG.phaseB = (nA + nB) * 1200;
    const R = S.analyze(CFG);
    const T0 = R.tcaSec - 120, T1 = R.tcaSec + 30;
    const samples = [];
    let sa = R.epochStates.A, sb = R.epochStates.B;
    let cur = S.propagate(sa, T0, 1), curB = S.propagate(sb, T0, 1);
    for (let t = T0; t <= T1; t += 1) {
      samples.push({
        t, alongKm: curB.x - cur.x, xiKm: 0, zetaKm: curB.y - cur.y,
        rangeKm: Math.hypot(curB.x - cur.x, curB.y - cur.y),
      });
      cur = S.rk4(cur, 1); curB = S.rk4(curB, 1);
    }
    return {
      tca: "2024-05-26T04:32:18Z", tcaSec: R.tcaSec, windowSec: 150,
      missKm: R.missKm, missMeters: R.missKm * 1000,
      relSpeedKms: R.relSpeedKms, relSpeedKmh: R.relSpeedKms * 3600,
      bPlane: { xiKm: 0, zetaKm: -R.missKm }, cov: R.cov, hbrKm: CFG.hbrKm,
      pc: R.pc, uncertaintyKm: R.uncertaintyKm, samples,
      primaryId: "SAT-51656", secondaryId: "OBJ-8821",
      primaryRing: null, secondaryRing: null, severity: "critical",
    };
  }

  /* ---------- Build scenario from fetched geometry ---------- */
  function fromGeometry(g) {
    const relV = g.relativeVelocityKms;
    const xi = g.bPlane ? g.bPlane.xiKm : 0;
    const zeta = g.bPlane ? g.bPlane.zetaKm : -g.missDistanceMeters / 1000;
    const missKm = Math.hypot(xi, zeta);
    const hbrKm = (g.hardBodyRadiusM || 10) / 1000;
    const cov = g.covariance
      ? { sx: g.covariance.sigma1, sy: g.covariance.sigma2, orient: g.covariance.orientationDeg || 0 }
      : { sx: 1.05, sy: 0.74, orient: 0 };
    // Compute Pc locally (2D Gaussian over B-plane × hard-body disc).
    const pc = S.collisionProbability({ mx: xi, my: zeta }, cov, hbrKm);
    const samples = (g.encounter && g.encounter.relativeTrajectory) || [];
    return {
      tca: g.tca, tcaSec: 0, windowSec: (g.encounter && g.encounter.windowSec) || 150,
      missKm, missMeters: g.missDistanceMeters,
      relSpeedKms: relV, relSpeedKmh: g.relativeSpeedKmh || relV * 3600,
      bPlane: { xiKm: xi, zetaKm: zeta }, cov, hbrKm, pc,
      uncertaintyKm: g.combinedUncertaintyKm || Math.hypot(cov.sx, cov.sy),
      samples,
      primaryId: (g.primary && g.primary.id) || "PRIMARY",
      secondaryId: (g.secondary && g.secondary.id) || "OBJECT",
      primaryRing: (g.primary && g.primary.orbitRing) || null,
      secondaryRing: (g.secondary && g.secondary.orbitRing) || null,
      primaryElements: g.primary && g.primary.orbitalElements,
      secondaryElements: g.secondary && g.secondary.orbitalElements,
      severity: g.severity || "critical",
    };
  }

  /* ---------- Formatting ---------- */
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
  function fmtCountdown(t, tca) {
    const d = t - tca;
    const sign = d < 0 ? "−" : "+";
    const a = Math.abs(d);
    const mm = String(Math.floor(a / 60)).padStart(2, "0");
    const ss = String(Math.floor(a % 60)).padStart(2, "0");
    return "T" + sign + mm + ":" + ss;
  }
  function fmtClock(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) +
      " · " + d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) + " UTC";
  }
  function fmtDist(m) {
    if (m == null) return "—";
    return m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(2) + " km";
  }

  /* ---------- Write page stats (computed from geometry) ---------- */
  function writeStats(scn) {
    const setText = (id, v) => { const el = $id(id); if (el) el.textContent = v; };
    setText("statMiss", fmtDist(scn.missMeters));
    setText("statPc", fmtSci(scn.pc));
    setText("statRelV", scn.relSpeedKms.toFixed(2) + " km/s");
    setText("statRelSpeed", Math.round(scn.relSpeedKmh).toLocaleString("en-US") + " km/h");
    setText("statUnc", scn.uncertaintyKm.toFixed(2) + " km");
    setText("statTcaClock", fmtClock(scn.tca));
    const head = $id("statPcHead");
    if (head) head.textContent = fmtSci(scn.pc);
  }

  /* ---------- Rendering ---------- */
  function init(canvas, scn) {
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

    // Playback state — t is seconds offset from TCA (0).
    const win = scn.windowSec;
    let playing = true;
    let t = -win;
    let scale = 0.05;
    let lastTs = null, holdUntil = 0;
    const trail = [];

    const btn = $id("approachPlayBtn");
    if (btn) btn.addEventListener("click", () => {
      playing = !playing;
      btn.textContent = playing ? "❚❚" : "▶";
      btn.setAttribute("aria-label", playing ? "Pause simulation" : "Play simulation");
    });

    // Starfield (static seed)
    const starSeed = [];
    { let sd = 13;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < 90; i++) starSeed.push({ x: rnd(), y: rnd(), r: rnd() < 0.92 ? 0.6 : 1.1, a: 0.1 + rnd() * 0.5 });
    }

    // Encounter-plane samples (along = relV·t, cross = B-plane miss).
    const samples = scn.samples;
    if (!samples.length) { // synthesise from linear model if backend gave none
      for (let tt = -win; tt <= win; tt += 1) samples.push({ tOffsetSec: tt, alongKm: scn.relSpeedKms * tt, xiKm: scn.bPlane.xiKm, zetaKm: scn.bPlane.zetaKm, rangeKm: Math.hypot(scn.relSpeedKms * tt, scn.bPlane.xiKm, scn.bPlane.zetaKm) });
    }
    const sampleAt = (tt) => {
      const i = Math.max(0, Math.min(samples.length - 1, Math.round((tt + win))));
      return samples[i];
    };
    const miss = scn.missKm;
    const crossSign = scn.bPlane.zetaKm < 0 ? -1 : 1;
    const crossKm = miss * crossSign; // displayed perpendicular miss (signed)

    // Orbit-context: closest point between the two real orbit rings.
    let ctxApproach = null;
    if (scn.primaryRing && scn.secondaryRing) {
      let bd = Infinity, bi = 0, bj = 0;
      const A = scn.primaryRing, B = scn.secondaryRing;
      const stepA = Math.max(1, Math.floor(A.length / 60));
      const stepB = Math.max(1, Math.floor(B.length / 60));
      for (let i = 0; i < A.length; i += stepA) for (let j = 0; j < B.length; j += stepB) {
        const d = Math.hypot(A[i][0] - B[j][0], A[i][1] - B[j][1], (A[i][2] || 0) - (B[j][2] || 0));
        if (d < bd) { bd = d; bi = i; bj = j; }
      }
      ctxApproach = { pA: A[bi], pB: B[bj], dist: bd };
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
        if (t >= win) { t = -win; trail.length = 0; }
        t += dtReal * Math.max(8, scn.relSpeedKms * 1.2);
        if (t >= win) holdUntil = ts + 2000;
      }
      const tt = Math.max(-win, Math.min(win, t));
      const st = sampleAt(tt);
      const along = st.alongKm;
      const range = st.rangeKm;

      // adaptive scale: keep secondary near ~32% of half-height, but never
      // zoom out beyond the corridor and never in beyond the HBR.
      const target = Math.min(220, Math.max(scn.hbrKm * 4, (H * 0.32) / Math.max(range, miss, scn.hbrKm * 2)));
      scale += (target - scale) * Math.min(1, dtReal * 3);

      ctx.clearRect(0, 0, W, H);
      for (const s of starSeed) { ctx.fillStyle = "rgba(200,225,255," + s.a + ")"; ctx.fillRect(s.x * W, s.y * H, s.r, s.r); }

      /* ===== Main: Encounter Corridor ===== */
      const padR = Math.min(150, W * 0.26); // reserve right strip for B-plane inset
      const padB = Math.min(120, H * 0.30); // reserve bottom strip for orbit context
      const mainW = W - padR, mainH = H - padB;
      const cx = mainW / 2, cy = mainH / 2;
      const X = (wx) => cx + wx * scale;
      const Y = (wy) => cy - wy * scale;

      // grid
      const step = niceStep(scale);
      ctx.strokeStyle = "rgba(148,163,184,.09)"; ctx.lineWidth = 1;
      ctx.font = "9px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(148,163,184,.45)";
      const nx = Math.ceil((-cx) / scale / step) * step;
      for (let gx = nx; gx * scale < mainW / 2; gx += step) {
        ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), mainH); ctx.stroke();
        if (gx !== 0) ctx.fillText(gx + " km", X(gx) + 3, mainH - 6);
      }
      const ny = Math.ceil((-cy) / scale / step) * step;
      for (let gy = ny; gy * scale < mainH / 2; gy += step) {
        ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(mainW, Y(gy)); ctx.stroke();
        if (gy !== 0) ctx.fillText(gy + " km", 6, Y(gy) - 3);
      }
      // axes emphasis
      ctx.strokeStyle = "rgba(148,163,184,.22)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(mainW, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, mainH); ctx.stroke();
      ctx.fillStyle = "rgba(148,163,184,.6)"; ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText("ALONG-TRACK (km) →", mainW - 116, cy - 6);
      ctx.save(); ctx.translate(cx + 6, 12); ctx.rotate(0); ctx.fillText("↑ CROSS-TRACK (km)", 0, 0); ctx.restore();

      // trail (relative position history)
      if (playing) trail.push({ x: along, y: crossKm });
      if (trail.length > 600) trail.shift();
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(239,68,68,.4)"; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let ft = tt; ft <= Math.min(win, tt + Math.max(20, win * 0.15)); ft += 1) {
        const f = sampleAt(ft); const fx = X(f.alongKm), fy = Y(crossKm);
        if (ft === tt) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
      }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = "#F97316"; ctx.lineWidth = 1.8;
      ctx.shadowColor = "rgba(249,115,22,.5)"; ctx.shadowBlur = 6;
      ctx.beginPath();
      trail.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
      ctx.stroke(); ctx.shadowBlur = 0;

      // TCA marker (closest-approach point on the corridor)
      const tcaPX = X(0), tcaPY = Y(crossKm);
      const pulse = (Math.sin(ts / 260) + 1) / 2;
      ctx.strokeStyle = "rgba(239,68,68," + (0.85 - pulse * 0.6) + ")"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(tcaPX, tcaPY, 5 + pulse * 10, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#FCA5A5";
      ctx.fillText("TCA · miss " + fmtDist(scn.missMeters), tcaPX + 12, tcaPY + 14);

      // covariance ellipse at TCA (projected 1σ/3σ onto corridor axes)
      drawEllipse(tcaPX, tcaPY, scn.cov.sx * scale, scn.cov.sy * scale, 0, "rgba(239,68,68,.06)", "rgba(239,68,68,.5)", true);

      // primary at origin with HBR keep-out circle
      ctx.fillStyle = "rgba(56,189,248,.9)";
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(3.5, scn.hbrKm * scale), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,.7)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(7, scn.hbrKm * 3 * scale), 0, Math.PI * 2); ctx.stroke();

      // secondary at current along/cross
      const secPX = X(along), secPY = Y(crossKm);
      ctx.fillStyle = "rgba(239,68,68,.9)";
      ctx.beginPath(); ctx.arc(secPX, secPY, Math.max(3.5, scn.hbrKm * scale), 0, Math.PI * 2); ctx.fill();

      // labels
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#7DD3FC"; ctx.fillText(scn.primaryId, cx + 10, cy - 8);
      ctx.fillStyle = "#FDBA74"; ctx.fillText(scn.secondaryId, secPX + 10, secPY - 8);

      // velocity arrow on secondary (along-track direction)
      arrow(secPX, secPY, scn.relSpeedKms * (along < 0 ? 1 : 1), 0, "#EF4444");

      // live range line
      ctx.strokeStyle = "rgba(226,232,240,.35)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(secPX, secPY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#E2E8F0";
      ctx.fillText("RANGE " + range.toFixed(3) + " km", (cx + secPX) / 2 + 8, (cy + secPY) / 2 - 6);

      /* ===== Inset 1: B-plane target plot (top-right) ===== */
      drawBPlane(W - padR + 8, 8, padR - 16, Math.min(padR - 16, H * 0.42));

      /* ===== Inset 2: Orbit context (bottom strip) ===== */
      if (ctxApproach) drawOrbitContext(8, H - padB + 8, W - 16, padB - 16);

      /* ===== HUD ===== */
      const cd = $id("simCountdown"), rg = $id("simRange"), pb = $id("approachProgress");
      if (cd) { cd.textContent = fmtCountdown(tt, 0); cd.style.color = Math.abs(tt) < 5 ? "#EF4444" : "#F4F7FB"; }
      if (rg) rg.textContent = range.toFixed(3) + " km";
      if (pb) { const frac = Math.max(0, Math.min(1, (tt + win) / (2 * win))); pb.style.width = (frac * 100).toFixed(1) + "%"; }

      requestAnimationFrame(draw);
    }

    /* B-plane target plot: ξ (horizontal) vs ζ (vertical), km. */
    function drawBPlane(ox, oy, ow, oh) {
      ctx.save();
      ctx.translate(ox, oy);
      // panel
      ctx.fillStyle = "rgba(6,13,24,.7)"; ctx.strokeStyle = "rgba(148,163,184,.25)";
      ctx.lineWidth = 1;
      roundRect(0, 0, ow, oh, 8); ctx.fill(); ctx.stroke();
      const cxp = ow / 2, cyp = oh / 2;
      // scale: fit ±max(3σ, HBR×3, |bPlane|×1.4)
      const lim = Math.max(scn.hbrKm * 4, scn.cov.sx * 3.2, scn.cov.sy * 3.2, Math.hypot(scn.bPlane.xiKm, scn.bPlane.zetaKm) * 1.4, 0.5);
      const sc = (Math.min(ow, oh) * 0.42) / lim;
      const BX = (km) => cxp + km * sc;
      const BY = (km) => cyp - km * sc;
      // axes
      ctx.strokeStyle = "rgba(148,163,184,.18)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, cyp); ctx.lineTo(ow - 8, cyp); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cxp, 8); ctx.lineTo(cxp, oh - 8); ctx.stroke();
      // title
      ctx.font = "700 8.5px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(226,232,240,.7)";
      ctx.fillText("B-PLANE · MISS PLANE", 8, 13);
      ctx.font = "8px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(148,163,184,.55)";
      ctx.fillText("ξ (km)", ow - 30, cyp - 4);
      ctx.fillText("ζ (km)", cxp + 4, oh - 8);
      // covariance ellipses at the miss point (1σ/2σ/3σ)
      const mPX = BX(scn.bPlane.xiKm), mPY = BY(scn.bPlane.zetaKm);
      drawEllipse(mPX, mPY, scn.cov.sx * 3 * sc, scn.cov.sy * 3 * sc, 0, "rgba(239,68,68,.05)", "rgba(239,68,68,.22)", true);
      drawEllipse(mPX, mPY, scn.cov.sx * 2 * sc, scn.cov.sy * 2 * sc, 0, null, "rgba(239,68,68,.32)", false);
      drawEllipse(mPX, mPY, scn.cov.sx * sc, scn.cov.sy * sc, 0, "rgba(239,68,68,.12)", "rgba(239,68,68,.6)", false);
      // HBR keep-out circle at origin (primary)
      ctx.fillStyle = "rgba(56,189,248,.18)"; ctx.strokeStyle = "rgba(56,189,248,.8)"; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(cxp, cyp, Math.max(3, scn.hbrKm * sc), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = "7.5px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(125,211,252,.9)";
      ctx.fillText("HBR", cxp - 6, cyp + 2);
      // miss point
      ctx.fillStyle = "#FCA5A5";
      ctx.beginPath(); ctx.arc(mPX, mPY, 3, 0, Math.PI * 2); ctx.fill();
      // Pc readout
      ctx.font = "700 9px 'JetBrains Mono', monospace"; ctx.fillStyle = "#FCA5A5";
      ctx.fillText("Pc " + fmtSci(scn.pc), 8, oh - 8);
      ctx.restore();
    }

    /* Orbit context: top-down (ECI XY) projection of both real orbit rings. */
    function drawOrbitContext(ox, oy, ow, oh) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = "rgba(6,13,24,.7)"; ctx.strokeStyle = "rgba(148,163,184,.25)"; ctx.lineWidth = 1;
      roundRect(0, 0, ow, oh, 8); ctx.fill(); ctx.stroke();
      ctx.font = "700 8.5px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(226,232,240,.7)";
      ctx.fillText("ORBIT CONTEXT · TOP-DOWN (ECI)", 10, 14);
      // bounds from both rings
      const A = scn.primaryRing, B = scn.secondaryRing;
      let mx = 0, mn = 0;
      for (const r of A.concat(B)) for (const c of r) { mx = Math.max(mx, Math.abs(c)); }
      const cxp = ow / 2, cyp = oh / 2 + 6;
      const sc = (Math.min(ow, oh) * 0.42) / (mx * 1.05);
      const PX = (km) => cxp + km * sc;
      const PY = (km) => cyp - km * sc;
      // Earth
      ctx.fillStyle = "rgba(56,189,248,.12)"; ctx.strokeStyle = "rgba(56,189,248,.4)";
      ctx.beginPath(); ctx.arc(cxp, cyp, S.EARTH_R * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // orbit rings (project XY)
      drawRing(A, "#38BDF8", 1.4);
      drawRing(B, "#EF4444", 1.4);
      // encounter region marker
      if (ctxApproach) {
        ctx.fillStyle = "#FDE047"; ctx.strokeStyle = "rgba(253,224,71,.6)";
        ctx.beginPath(); ctx.arc(PX(ctxApproach.pA[0]), PY(ctxApproach.pA[1]), 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(PX(ctxApproach.pB[0]), PY(ctxApproach.pB[1]), 4, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PX(ctxApproach.pA[0]), PY(ctxApproach.pA[1])); ctx.lineTo(PX(ctxApproach.pB[0]), PY(ctxApproach.pB[1])); ctx.stroke(); ctx.setLineDash([]);
      }
      // legend
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#7DD3FC"; ctx.fillText(scn.primaryId, ow - 86, 14);
      ctx.fillStyle = "#FCA5A5"; ctx.fillText(scn.secondaryId, ow - 86, 26);
      ctx.restore();

      function drawRing(ring, color, lw) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ring.forEach((p, i) => { const x = PX(p[0]), y = PY(p[1]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    function arrow(x, y, vx, vy, color) {
      const L = 26;
      const vmag = Math.hypot(vx, vy) || 1;
      const ux = (vx / vmag) * L, uy = (-vy / vmag) * L;
      const x2 = x + ux, y2 = y + uy;
      ctx.strokeStyle = color; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - 6 * Math.cos(ang - 0.4), y2 - 6 * Math.sin(ang - 0.4));
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - 6 * Math.cos(ang + 0.4), y2 - 6 * Math.sin(ang + 0.4));
      ctx.stroke();
    }

    function drawEllipse(px, py, rx, ry, rot, fill, stroke, dashed) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rx, 2), Math.max(ry, 2), 0, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; if (dashed) ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    writeStats(scn);
    requestAnimationFrame(draw);
  }

  /* ---------- Boot: fetch geometry, fall back to legacy ---------- */
  function boot() {
    const canvas = document.getElementById("approachCanvas");
    if (!canvas || !window.SOSSim) return;
    const id = (SOS && SOS.param) ? (SOS.param("id") || "CD-2024-0526-0417") : "CD-2024-0526-0417";

    if (!SOS || !SOS.api) { init(canvas, legacyScenario()); return; }
    SOS.api("/conjunctions/" + encodeURIComponent(id) + "/geometry")
      .then(function (g) {
        if (!g || !g.bPlane) { init(canvas, legacyScenario()); return; }
        init(canvas, fromGeometry(g));
      })
      .catch(function () { init(canvas, legacyScenario()); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
