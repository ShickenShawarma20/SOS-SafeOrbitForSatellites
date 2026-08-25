/* SOS · SafeOrbitForSattelites — ground stations page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (window.SOS) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var allStations = [];

    /* Lat/Lon to SVG x,y (Mercator-ish) */
    function latLonToXY(lat, lon) {
      var x = ((lon + 180) / 360) * 720;
      var y = ((90 - lat) / 180) * 360;
      return { x: x, y: y };
    }

    /* ---- Load network status ---- */
    S.api("/network/status").then(function (data) {
      setText("gsOnline", data.stationsOnline);
      setText("gsOffline", data.stationsOffline);
      setText("gsCoverage", data.coveragePct + "%");
      setText("gsLatency", data.latencySec + " s");
    }).catch(function () {});

    /* ---- Load ground stations ---- */
    S.api("/groundstations").then(function (stations) {
      if (!Array.isArray(stations)) return;
      allStations = stations;
      setText("gsTotal", stations.length);
      setText("gsCount", stations.length + " stations");

      renderMarkers(stations);
      renderTable(stations);
    }).catch(function () {});

    function renderMarkers(stations) {
      var markers = document.getElementById("gsMarkers");
      if (!markers) return;
      markers.innerHTML = stations.map(function (s) {
        var pos = latLonToXY(s.lat, s.lon);
        var isOnline = s.status === "online";
        var glowId = isOnline ? "glow" : "glowRed";
        var fillColor = isOnline ? "#22C55E" : "#EF4444";
        var glowColor = isOnline ? "rgba(34,197,94,.6)" : "rgba(239,68,68,.5)";
        return '<g transform="translate(' + pos.x + ',' + pos.y + ')" class="station-marker" data-id="' + s.id + '" data-name="' + s.name + '" data-lat="' + s.lat + '" data-lon="' + s.lon + '" data-status="' + s.status + '">' +
          '<circle r="14" fill="url(#' + glowId + ')" opacity="0.6"/>' +
          '<circle r="3.5" fill="' + fillColor + '" stroke="' + fillColor + '" stroke-width="1" opacity="0.9"/>' +
          '<text x="0" y="-9" text-anchor="middle" fill="rgba(200,225,250,.85)" font-family="JetBrains Mono, monospace" font-size="8" font-weight="600">' + s.name + '</text>' +
          '</g>';
      }).join("");
    }

    function renderTable(stations) {
      var tbody = document.getElementById("gsTableBody");
      if (!tbody) return;
      tbody.innerHTML = stations.map(function (s) {
        var isOnline = s.status === "online";
        return '<tr data-status="' + s.status + '">' +
          '<td><span class="status-dot ' + (isOnline ? "on" : "off") + '"></span>' + s.name + '</td>' +
          '<td style="font-family:var(--mono);">' + s.lat.toFixed(1) + '\u00B0</td>' +
          '<td style="font-family:var(--mono);">' + s.lon.toFixed(1) + '\u00B0</td>' +
          '<td><span class="badge badge-' + (isOnline ? "nominal" : "crit") + '">' + s.status.toUpperCase() + '</span></td>' +
          '</tr>';
      }).join("");
    }

    /* ---- Filter chips ---- */
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var filter = btn.getAttribute("data-filter");
        var filtered = filter === "all" ? allStations : allStations.filter(function (s) { return s.status === filter; });
        renderTable(filtered);
        /* Show/hide markers */
        var markers = document.querySelectorAll(".station-marker");
        markers.forEach(function (m) {
          if (filter === "all") { m.style.display = ""; return; }
          m.style.display = m.getAttribute("data-status") === filter ? "" : "none";
        });
      });
    });

    /* ---- WebSocket: live station status ---- */
    S.ws.on("network.status", function (data) {
      if (data && data.stationsOnline != null) setText("gsOnline", data.stationsOnline);
      if (data && data.stationsOffline != null) setText("gsOffline", data.stationsOffline);
      if (data && data.coveragePct != null) setText("gsCoverage", data.coveragePct + "%");
    });

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  });
})();
