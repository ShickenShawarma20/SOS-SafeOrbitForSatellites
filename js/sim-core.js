/* SOS · SafeOrbitForSattelites — conjunction physics core (pure functions)
   Two-body propagation (RK4), TCA search, conjunction-plane kinematics,
   and numerical collision-probability estimation. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.SOSSim = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MU = 398600.4418;   // km^3/s^2 (WGS-84)
  const RE = 6371.0;        // km, mean Earth radius

  /* ---------- Initial states ---------- */

  function circState(altKm, phaseRad, retrograde) {
    const a = RE + altKm;
    const v = Math.sqrt(MU / a);
    const dir = retrograde ? -1 : 1;
    return {
      x: a * Math.cos(phaseRad),
      y: a * Math.sin(phaseRad),
      vx: -v * Math.sin(phaseRad) * dir,
      vy: v * Math.cos(phaseRad) * dir
    };
  }

  /* ---------- Propagation ---------- */

  function deriv(s) {
    const r2 = s.x * s.x + s.y * s.y;
    const rn = Math.sqrt(r2);
    const f = -MU / (rn * r2);
    return { x: s.vx, y: s.vy, vx: f * s.x, vy: f * s.y };
  }

  function addScaled(s, d, h) {
    return {
      x: s.x + d.x * h,
      y: s.y + d.y * h,
      vx: s.vx + d.vx * h,
      vy: s.vy + d.vy * h
    };
  }

  function rk4(s, dt) {
    const k1 = deriv(s);
    const k2 = deriv(addScaled(s, k1, dt / 2));
    const k3 = deriv(addScaled(s, k2, dt / 2));
    const k4 = deriv(addScaled(s, k3, dt));
    return {
      x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
      vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
      vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy)
    };
  }

  function propagate(state, tSec, dtMax) {
    const dt = dtMax || 1;
    let s = { x: state.x, y: state.y, vx: state.vx, vy: state.vy };
    let remaining = tSec;
    const sign = remaining < 0 ? -1 : 1;
    remaining = Math.abs(remaining);
    while (remaining > 1e-9) {
      const h = Math.min(dt, remaining) * sign;
      s = rk4(s, h);
      remaining -= Math.min(dt, remaining);
    }
    return s;
  }

  function sampleStates(state, tStart, tEnd, stepSec) {
    const out = [];
    let s = { x: state.x, y: state.y, vx: state.vx, vy: state.vy };
    const n = Math.round((tEnd - tStart) / stepSec);
    for (let i = 0; i <= n; i++) {
      if (i === 0 && tStart !== 0) s = propagate(s, tStart, stepSec);
      else if (i > 0) s = rk4(s, stepSec);
      out.push({ t: tStart + i * stepSec, s });
    }
    return out;
  }

  /* ---------- Relative kinematics & TCA ---------- */

  function relative(sa, sb) {
    return {
      dx: sa.x - sb.x,
      dy: sa.y - sb.y,
      dvx: sa.vx - sb.vx,
      dvy: sa.vy - sb.vy
    };
  }

  function rangeOf(rel) {
    return Math.hypot(rel.dx, rel.dy);
  }

  function relSpeedOf(rel) {
    return Math.hypot(rel.dvx, rel.dvy);
  }

  function rangeAt(sa0, sb0, t) {
    return rangeOf(relative(propagate(sa0, t), propagate(sb0, t)));
  }

  function findTCA(sa0, sb0, tMin, tMax) {
    let bestT = tMin, bestR = Infinity;
    const coarse = Math.max((tMax - tMin) / 4000, 0.5);
    for (let t = tMin; t <= tMax; t += coarse) {
      const r = rangeAt(sa0, sb0, t);
      if (r < bestR) { bestR = r; bestT = t; }
    }
    let lo = bestT - coarse, hi = bestT + coarse;
    const phi = (Math.sqrt(5) - 1) / 2;
    let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo);
    let fc = rangeAt(sa0, sb0, c), fd = rangeAt(sa0, sb0, d);
    for (let i = 0; i < 60; i++) {
      if (fc < fd) { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = rangeAt(sa0, sb0, c); }
      else { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = rangeAt(sa0, sb0, d); }
    }
    const tca = (lo + hi) / 2;
    return { tca, missKm: rangeAt(sa0, sb0, tca) };
  }

  /* Conjunction-plane basis from relative velocity at TCA */
  function planeBasis(rel) {
    const vn = relSpeedOf(rel);
    const ex = { x: rel.dvx / vn, y: rel.dvy / vn };
    const ey = { x: -ex.y, y: ex.x };
    return { ex, ey, vn };
  }

  function projectToPlane(rel, basis) {
    return {
      mx: rel.dx * basis.ex.x + rel.dy * basis.ex.y,
      my: rel.dx * basis.ey.x + rel.dy * basis.ey.y
    };
  }

  /* Covariance is supplied directly in the conjunction (B-)plane:
     sx = 1σ along the relative-velocity axis (typically dominated by
     along-track ephemeris error), sy = 1σ perpendicular (radial/cross). */
  function collisionProbability(m, cov, hbrKm) {
    const N = 61;
    const ext = 4 * hbrKm;
    const cell = (2 * ext) / N;
    const det = cov.sx * cov.sx * cov.sy * cov.sy;
    if (det <= 0 || !isFinite(det)) return 0;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const px = -ext + (i + 0.5) * cell;
      for (let j = 0; j < N; j++) {
        const py = -ext + (j + 0.5) * cell;
        const wx = px - m.mx, wy = py - m.my;
        const e = (wx * wx) / (cov.sx * cov.sx) + (wy * wy) / (cov.sy * cov.sy);
        sum += Math.exp(-e / 2);
      }
    }
    const density = sum * cell * cell / (2 * Math.PI * Math.sqrt(det));
    return density * Math.PI * hbrKm * hbrKm;
  }

  /* ---------- Full scenario analysis ---------- */

  function analyze(cfg) {
    const A = circState(cfg.altAKm, cfg.phaseA, false);
    const B = circState(cfg.altBKm, cfg.phaseB, !!cfg.retrogradeB);
    const { tca, missKm } = findTCA(A, B, cfg.tMin, cfg.tMax);
    const ra = propagate(A, tca), rb = propagate(B, tca);
    const rel = relative(ra, rb);
    const basis = planeBasis(rel);
    const m = projectToPlane(rel, basis);
    const cov = cfg.cov;
    const pc = collisionProbability(m, cov, cfg.hbrKm);
    return {
      epochStates: { A, B },
      tcaSec: tca,
      missKm,
      relSpeedKms: basis.vn,
      mean: m,
      cov,
      pc,
      uncertaintyKm: Math.sqrt(cov.sx * cov.sx + cov.sy * cov.sy)
    };
  }

  return {
    MU, RE,
    circState, rk4, propagate, sampleStates,
    relative, rangeOf, relSpeedOf, rangeAt, findTCA,
    planeBasis, projectToPlane, collisionProbability, analyze
  };
});
