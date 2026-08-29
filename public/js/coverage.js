/* SOS · SafeOrbitForSattelites — realistic orbital coverage map
   Equirectangular world map with:
   - real Earth imagery
   - spherical coverage footprints per ground station (visibility cones)
   - drifting LEO ground tracks (nodal precession under Earth rotation)
   - live moving satellite coverage footprints  */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var DEG = Math.PI / 180;
  var W = 720, H = 360;            // equirectangular viewBox (2:1)
  var RE = 6371;                   // Earth radius, km

  /* Satellites drawn on the coverage map (real orbital elements) */
  var SATS = [
    { name: "EOS-06",    inc: 98.4, period: 99.3, raan: 245.8, alt: 743, color: "#38BDF8", phase: 0.20 },
    { name: "Cartosat-3", inc: 97.4, period: 94.8, raan: 132.4, alt: 508, color: "#60A5FA", phase: 1.70 },
    { name: "AstroSat",   inc: 6.0,  period: 97.3, raan: 88.9,  alt: 650, color: "#34D399", phase: 3.30 }
  ];
  var ORBITS = 14;                 // orbits shown per ground track (~one day)
  var PTS_PER_ORBIT = 36;
  var ORBIT_SECONDS = 16;          // real seconds per simulated orbit (animation pace)
  var GS_RADIUS = 20;              // ground-station visibility radius (deg @ ~600 km LEO)
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- geometry helpers ---------- */

  function wrapLon(l) { while (l > 180) l -= 360; while (l < -180) l += 360; return l; }

  function proj(lat, lon) { return { x: (wrapLon(lon) + 180) * (W / 360), y: (90 - lat) * (H / 180) }; }
  function projUnwrapped(lat, lon) { return { x: (lon + 180) * (W / 360), y: (90 - lat) * (H / 180) }; }

  function footprintRadius(h) { return Math.acos(RE / (RE + h)) / DEG; }

  /* Spherical small-circle (coverage cone) centered at (lat0, lon0), angular radius rho deg. */
  function smallCircle(lat0, lon0, rho, steps) {
    steps = steps || 48;
    var la = lat0 * DEG, r = rho * DEG;
    var sL = Math.sin(la), cL = Math.cos(la), sR = Math.sin(r), cR = Math.cos(r);
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var b = (i / steps) * TAU, cb = Math.cos(b), sb = Math.sin(b);
      var sinLat = sL * cR + cL * sR * cb;
      if (sinLat > 1) sinLat = 1; else if (sinLat < -1) sinLat = -1;
      var lat = Math.asin(sinLat) / DEG;
      var lon = lon0 + Math.atan2(sb * sR * cL, cR - sL * sinLat) / DEG;
      pts.push({ lat: lat, lon: lon });
    }
    return pts;
  }

  function polyPath(pts) {
    var d = "";
    for (var i = 0; i < pts.length; i++) {
      var p = projUnwrapped(pts[i].lat, pts[i].lon);
      d += (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1) + " ";
    }
    return d + "Z";
  }

  /* Sub-satellite point at argument of latitude u (rad) for a circular orbit. */
  function subSat(sat, u) {
    var i = sat.inc * DEG;
    var sinLat = Math.sin(i) * Math.sin(u);
    if (sinLat > 1) sinLat = 1; else if (sinLat < -1) sinLat = -1;
    var lat = Math.asin(sinLat) / DEG;
    var drift = (360 * (sat.period * 60) / 86164) * (u / TAU);  // westward nodal drift (deg)
    var lam = Math.atan2(Math.sin(u) * Math.cos(i), Math.cos(u)) / DEG;
    return { lat: lat, lon: sat.raan + lam - drift };
  }

  /* Ground-track segments between uStart..uEnd, split at the ±180° dateline. */
  function trackSegments(sat, uStart, uEnd) {
    var segs = [], cur = [], prevLon = null;
    var step = TAU / PTS_PER_ORBIT;
    for (var u = uStart; u <= uEnd + 1e-9; u += step) {
      var p = subSat(sat, u);
      var lon = wrapLon(p.lon);
      if (prevLon !== null && Math.abs(lon - prevLon) > 180) {
        if (cur.length > 1) segs.push(cur);
        cur = [];
      }
      cur.push({ lat: p.lat, lon: lon });
      prevLon = lon;
    }
    if (cur.length > 1) segs.push(cur);
    return segs;
  }

  function segPath(pts) {
    var d = "";
    for (var i = 0; i < pts.length; i++) {
      var p = proj(pts[i].lat, pts[i].lon);
      d += (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1) + " ";
    }
    return d;
  }

  /* ---------- DOM helpers ---------- */

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var svg, L, ready = false;
  var COPIES = [-W, 0, W];   // dateline-wrap triple copies
  var satEls = [];

  function init() {
    svg = document.getElementById("coverageSvg");
    if (!svg || ready) return;
    ready = true;
    L = {
      grat: svg.querySelector(".cov-grat"),
      tracks: svg.querySelector(".cov-tracks"),
      stations: svg.querySelector(".cov-stations"),
      sat: svg.querySelector(".cov-sat")
    };
    drawGraticule();
    buildSatellites();
    requestAnimationFrame(loop);
  }

  function drawGraticule() {
    var g = L.grat;
    g.innerHTML = "";
    var lat, lon, y, x;
    for (lat = -60; lat <= 60; lat += 30) {
      y = (90 - lat) * (H / 180);
      g.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y, class: lat === 0 ? "g-eq" : "g-par" }));
    }
    [23.5, -23.5].forEach(function (t) {
      y = (90 - t) * (H / 180);
      g.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y, class: "g-trop" }));
    });
    for (lon = -150; lon <= 180; lon += 30) {
      x = (lon + 180) * (W / 360);
      g.appendChild(el("line", { x1: x, y1: 0, x2: x, y2: H, class: "g-mer" }));
    }
  }

  function buildSatellites() {
    var g = L.sat;
    SATS.forEach(function (sat) {
      sat.rho = footprintRadius(sat.alt);
      sat.entry = { foot: [], mark: [], label: [] };
      COPIES.forEach(function (off) {
        var parent = el("g", { transform: "translate(" + off + ",0)" });
        var fp = el("path", {
          fill: sat.color, "fill-opacity": "0.12",
          stroke: sat.color, "stroke-opacity": "0.55", "stroke-width": "0.6",
          class: "satfoot"
        });
        parent.appendChild(fp);
        var m = el("g", { class: "satmark" });
        m.appendChild(el("circle", { r: "6", fill: "none", stroke: sat.color, "stroke-opacity": "0.5", "stroke-width": "0.7", class: "sat-ring" }));
        m.appendChild(el("circle", { r: "3", fill: sat.color, stroke: "#000000", "stroke-width": "0.8" }));
        parent.appendChild(m);
        var t = el("text", {
          "font-size": "12", "font-family": "JetBrains Mono, monospace",
          "font-weight": "600", fill: sat.color, "text-anchor": "middle", class: "satlabel"
        });
        t.textContent = sat.name;
        parent.appendChild(t);
        g.appendChild(parent);
        sat.entry.foot.push(fp);
        sat.entry.mark.push(m);
        sat.entry.label.push(t);
      });
    });
  }

  function drawStations(stations) {
    if (!ready) init();
    if (!L) return;
    var list = stations;
    if (!Array.isArray(list)) list = (list && list.items) || [];
    var g = L.stations;
    g.innerHTML = "";
    list.forEach(function (s) {
      if (s == null || s.lat == null || s.lon == null) return;
      var online = s.status !== "offline";
      var col = online ? "#38BDF8" : "#64748B";
      COPIES.forEach(function (off) {
        var p = proj(s.lat, s.lon);
        var parent = el("g", { transform: "translate(" + off + ",0)" });
        var grp = el("g", { transform: "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")" });
        if (online) {
          grp.appendChild(el("path", {
            d: polyPath(smallCircle(s.lat, s.lon, GS_RADIUS)),
            fill: "url(#gsGrad)", stroke: "rgba(56,189,248,0.45)", "stroke-width": "0.5",
            class: "gsfoot"
          }));
          grp.appendChild(el("circle", { r: "5", fill: "none", stroke: col, "stroke-opacity": "0.6", "stroke-width": "0.8", class: "gs-ring" }));
        }
        grp.appendChild(el("circle", { r: "2.4", fill: col, stroke: "#000000", "stroke-width": "0.6", class: "gsdot" }));
        parent.appendChild(grp);
        g.appendChild(parent);
      });
    });
  }

  /* ---------- animation loop ---------- */

  var t0 = null, lastTrack = 0;

  function redrawTracks(thetaNow) {
    var parts = [];
    SATS.forEach(function (sat) {
      var uEnd = thetaNow + sat.phase;
      var segs = trackSegments(sat, uEnd - ORBITS * TAU, uEnd);
      segs.forEach(function (seg) {
        parts.push('<path class="track" d="' + segPath(seg) + '" stroke="' + sat.color + '" fill="none"/>');
      });
    });
    L.tracks.innerHTML = parts.join("");
  }

  function loop(now) {
    if (t0 === null) t0 = now;
    var elapsed = (now - t0) / 1000;
    var thetaNow = (elapsed / ORBIT_SECONDS) * TAU;

    if (now - lastTrack > 400) {
      lastTrack = now;
      redrawTracks(thetaNow);
    }

    SATS.forEach(function (sat) {
      var u = thetaNow + sat.phase;
      var pos = subSat(sat, u);
      var wlon = wrapLon(pos.lon);
      var fp = polyPath(smallCircle(pos.lat, wlon, sat.rho));
      var p = proj(pos.lat, wlon);
      for (var k = 0; k < 3; k++) {
        sat.entry.foot[k].setAttribute("d", fp);
        sat.entry.mark[k].setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")");
        sat.entry.label[k].setAttribute("x", p.x.toFixed(1));
        sat.entry.label[k].setAttribute("y", (p.y - 8).toFixed(1));
      }
    });
    requestAnimationFrame(loop);
  }

  /* ---------- expose & boot ---------- */

  window.SOSCoverage = { init: init, drawStations: drawStations };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
