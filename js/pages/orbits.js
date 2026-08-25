/* SOS · SafeOrbitForSattelites — orbital registry page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (window.SOS) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var allSatellites = [];

    function classifyOrbit(altKm) {
      if (altKm < 2000) return "LEO";
      if (altKm < 35786) return "MEO";
      if (altKm >= 35786 && altKm <= 36000) return "GEO";
      return "HEO";
    }

    /* ---- Load satellites ---- */
    S.api("/satellites?page=1&limit=100").then(function (data) {
      if (!data || !Array.isArray(data.items)) return;
      allSatellites = data.items;
      setText("orbitCount", data.items.length + " satellites");
      renderTable(allSatellites);
    }).catch(function () {});

    function renderTable(sats) {
      var tbody = document.getElementById("orbitTableBody");
      if (!tbody) return;
      tbody.innerHTML = sats.map(function (sat) {
        var e = sat.elements;
        var regime = sat.orbitClass ? sat.orbitClass.split("\u00B7")[0].trim() : classifyOrbit(e.altitudeKm);
        return '<tr>' +
          '<td class="sat-link" onclick="location.href=\'satellite.html?id=' + encodeURIComponent(sat.id) + '\'">' + sat.id + '</td>' +
          '<td class="mono">' + sat.noradId + '</td>' +
          '<td class="mono">' + e.altitudeKm + '</td>' +
          '<td class="mono">' + e.inclinationDeg + '\u00B0</td>' +
          '<td class="mono">' + e.raanDeg + '\u00B0</td>' +
          '<td class="mono">' + e.eccentricity + '</td>' +
          '<td class="mono">' + e.periodMin + '</td>' +
          '<td class="mono">' + e.argPerigeeDeg + '\u00B0</td>' +
          '<td><span class="badge badge-info">' + regime + '</span></td>' +
          '</tr>';
      }).join("");
    }

    /* ---- Filter chips ---- */
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var filter = btn.getAttribute("data-filter");
        if (filter === "all") {
          renderTable(allSatellites);
        } else {
          renderTable(allSatellites.filter(function (sat) {
            var regime = sat.orbitClass ? sat.orbitClass.split("\u00B7")[0].trim() : classifyOrbit(sat.elements.altitudeKm);
            return regime === filter;
          }));
        }
      });
    });

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  });
})();
