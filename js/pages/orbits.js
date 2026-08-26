/* SOS · SafeOrbitForSattelites — orbital registry page loader + 3D globe */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var EARTH_R = 6378; // km

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.from((el || document).querySelectorAll(s)); };

  // shell.js reassigns #shell.innerHTML on DOMContentLoaded (wiping the canvas
  // and any elements present at parse time). orbits.js loads AFTER shell.js, so
  // a DOMContentLoaded listener registered here runs on the freshly-reinjected,
  // correctly-laid-out DOM. All DOM wiring must happen inside onDomReady.
  function onDomReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function classifyOrbit(altKm) {
    if (altKm < 2000) return "LEO";
    if (altKm < 35786) return "MEO";
    if (altKm >= 35786 && altKm <= 36000) return "GEO";
    return "HEO";
  }
  function normalizeRegime(sat) {
    var alt = sat.elements.altitudeKm;
    var raw = sat.orbitClass ? sat.orbitClass.split("\u00B7")[0].trim() : classifyOrbit(alt);
    if (raw === "Halo Orbit" || alt > 200000) return "HEO";
    // SSO (Sun-Synchronous) is a LEO subset; GSO (Geosynchronous) is GEO-equivalent
    if (raw === "SSO") return "LEO";
    if (raw === "GSO") return "GEO";
    if (raw === "LEO" || raw === "MEO" || raw === "GEO" || raw === "HEO") return raw;
    return classifyOrbit(alt);
  }

  function regimeColor(regime, idHash) {
    var leoPal = ["#38BDF8", "#60A5FA", "#22D3EE", "#7DD3FC"];
    if (regime === "LEO") return leoPal[idHash % leoPal.length];
    if (regime === "MEO") return "#F59E0B";
    if (regime === "GEO") return "#10B981";
    return "#A78BFA"; // HEO
  }
  function hashId(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* Convert a satellite (API shape) into 3D viewer orbit parameters derived
     from its real Keplerian elements: altitude -> orbit radius, inclination ->
     plane tilt, RAAN -> plane rotation, period -> angular speed. */
  function satTo3D(sat) {
    var e = sat.elements;
    var alt = e.altitudeKm;
    var regime = normalizeRegime(sat);
    var A = 1.0 + Math.sqrt(Math.max(alt, 0) / EARTH_R) * 0.9; // sqrt-compressed Earth radii
    var h = hashId(sat.id || sat.name || "");
    return {
      name: sat.id,
      label: sat.id,
      color: regimeColor(regime, h),
      A: A,
      rx: A / 2.05,
      tilt: ((e.inclinationDeg || 0) * Math.PI) / 180,
      raan: ((e.raanDeg || 0) * Math.PI) / 180,
      speed: 0.02 / Math.max(e.periodMin || 95, 10),
      phase: (((e.raanDeg || 0) + (e.argPerigeeDeg || 0)) * Math.PI / 180 + h * 0.013) % TAU,
      regime: regime,
    };
  }

  // Representative fleet shown immediately (before/without the API). Mirrors the
  // server seed so the globe is never empty. Raw API-shape rows for the table.
  var DEFAULT_RAW = [
    { id: "SAT-58694", noradId: 58694, name: "XPoSat", orbitClass: "LEO \u00B7 Circular", elements: { altitudeKm: 350, inclinationDeg: 6.0, raanDeg: 210.4, periodMin: 91.5, argPerigeeDeg: 91.2, eccentricity: 0.000182 } },
    { id: "SAT-58990", noradId: 58990, name: "INSAT-3DS", orbitClass: "GEO \u00B7 Geostationary", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 78.2, periodMin: 1436, argPerigeeDeg: 30.0, eccentricity: 0.000214 } },
    { id: "SAT-40930", noradId: 40930, name: "AstroSat", orbitClass: "LEO \u00B7 Circular", elements: { altitudeKm: 650, inclinationDeg: 6.0, raanDeg: 88.9, periodMin: 97.3, argPerigeeDeg: 240.1, eccentricity: 0.000242 } },
    { id: "SAT-51656", noradId: 51656, name: "EOS-04", orbitClass: "LEO \u00B7 Sun-Sync", elements: { altitudeKm: 529, inclinationDeg: 97.5, raanDeg: 305.2, periodMin: 95.2, argPerigeeDeg: 178.4, eccentricity: 0.00019 } },
    { id: "SAT-44804", noradId: 44804, name: "Cartosat-3", orbitClass: "LEO \u00B7 Sun-Sync", elements: { altitudeKm: 508, inclinationDeg: 97.4, raanDeg: 132.4, periodMin: 94.8, argPerigeeDeg: 45.3, eccentricity: 0.000126 } },
    { id: "SAT-54361", noradId: 54361, name: "EOS-06", orbitClass: "LEO \u00B7 Sun-Sync", elements: { altitudeKm: 743, inclinationDeg: 98.4, raanDeg: 245.8, periodMin: 99.3, argPerigeeDeg: 112.5, eccentricity: 0.000198 } },
    { id: "SAT-57754", noradId: 57754, name: "Aditya-L1", orbitClass: "HEO \u00B7 Molniya", elements: { altitudeKm: 108600, inclinationDeg: 24.0, raanDeg: 145.0, periodMin: 17280, argPerigeeDeg: 280.0, eccentricity: 0.5354 } },
  ];

  function cameraDistFor(list) {
    var maxA = 1.4;
    list.forEach(function (s) { if (s.A > maxA) maxA = s.A; });
    return maxA * 1.55 + 2.2;
  }

  onDomReady(function () {
    var viewer = null;
    var allRaw = DEFAULT_RAW.slice();
    var currentFilter = null;

    /* ---- 3D globe viewer ---- */
    var canvas = document.getElementById("orbitCanvas");
    if (canvas && window.SOSOrbitalViewer) {
      var init3D = DEFAULT_RAW.map(satTo3D);
      viewer = new SOSOrbitalViewer(canvas, {
        satellites: init3D,
        showConjunction: false,
        cameraDist: cameraDistFor(init3D),
      });
      window.sosOrbitalViewer = viewer;
      setTimeout(function () { viewer.resize(); }, 250);
      window.addEventListener("load", function () { viewer.resize(); });
    }

    /* ---- Layer chips -> viewer layers ---- */
    $$(".orbit-canvas-wrap .layer-chips .chip").forEach(function (chip) {
      var key = chip.getAttribute("data-layer");
      if (!key) return;
      chip.addEventListener("click", function () {
        if (!viewer || !viewer.layers) return;
        viewer.layers[key] = chip.classList.contains("on");
      });
    });

    /* ---- Table render (synced with 3D globe hover) ---- */
    function renderTable(sats) {
      var tbody = document.getElementById("orbitTableBody");
      if (!tbody) return;
      tbody.innerHTML = sats.map(function (sat) {
        var e = sat.elements;
        var regime = normalizeRegime(sat);
        return '<tr data-sat="' + esc(sat.id) + '">' +
          '<td class="sat-link" onclick="location.href=\'satellite.html?id=' + encodeURIComponent(sat.id) + '\'">' + esc(sat.id) + '</td>' +
          '<td class="mono">' + esc(sat.noradId != null ? sat.noradId : "—") + '</td>' +
          '<td class="mono">' + (e.altitudeKm != null ? e.altitudeKm : "—") + '</td>' +
          '<td class="mono">' + (e.inclinationDeg != null ? e.inclinationDeg + "\u00B0" : "—") + '</td>' +
          '<td class="mono">' + (e.raanDeg != null ? e.raanDeg + "\u00B0" : "—") + '</td>' +
          '<td class="mono">' + (e.eccentricity != null ? e.eccentricity : "—") + '</td>' +
          '<td class="mono">' + (e.periodMin != null ? e.periodMin : "—") + '</td>' +
          '<td class="mono">' + (e.argPerigeeDeg != null ? e.argPerigeeDeg + "\u00B0" : "—") + '</td>' +
          '<td><span class="badge badge-info">' + esc(regime) + '</span></td>' +
          '</tr>';
      }).join("");
      $$("#orbitTableBody tr").forEach(function (row) {
        row.addEventListener("mouseenter", function () { if (viewer) viewer.focusSatellite(row.getAttribute("data-sat")); });
        row.addEventListener("mouseleave", function () { if (viewer) viewer.focusSatellite(null); });
      });
    }

    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    function applyFilter() {
      if (!currentFilter) renderTable(allRaw);
      else renderTable(allRaw.filter(function (sat) { return normalizeRegime(sat) === currentFilter; }));
      if (viewer) viewer.setRegimeFilter(currentFilter);
    }

    /* ---- Filter chips (table + 3D globe) ---- */
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var filter = btn.getAttribute("data-filter");
        currentFilter = filter === "all" ? null : filter;
        applyFilter();
      });
    });

    /* ---- Load real satellites from API ---- */
    renderTable(allRaw);
    if (window.SOS && SOS.api) {
      SOS.api("/satellites?page=1&limit=100").then(function (data) {
        if (!data || !Array.isArray(data.items) || !data.items.length) return;
        allRaw = data.items;
        setText("orbitCount", data.items.length + " satellites");
        if (viewer) {
          var list = data.items.map(satTo3D).filter(function (s) { return s.A < 18; });
          viewer.setSatellites(list);
          viewer.cameraDist = cameraDistFor(list);
          viewer.zoom = 1;
        }
        applyFilter();
      }).catch(function () {
        setText("orbitCount", DEFAULT_RAW.length + " satellites (offline)");
      });
    } else {
      setText("orbitCount", DEFAULT_RAW.length + " satellites (offline)");
    }
  });
})();
