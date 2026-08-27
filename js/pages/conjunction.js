/* SOS · SafeOrbitForSattelites — conjunction detail page loader */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.querySelector(".main-col")) fn();
    else document.addEventListener("shellready", fn);
  }

  onReady(function () {
    var S = window.SOS;
    var id = S.param("id") || "CD-2024-0526-0417";

    /* ---- Conjunction Record ---- */
    S.api("/conjunctions/" + encodeURIComponent(id)).then(function (c) {
      if (!c) return;

      /* Header */
      document.title = c.satelliteId + " \u2194 " + c.objectId + " \u00B7 SOS SafeOrbitForSattelites";
      var crumb = document.querySelector(".crumb");
      if (crumb) crumb.textContent = "Conjunctions / " + c.id;

      var h1 = document.querySelector(".page-head h1");
      if (h1) {
        h1.innerHTML = c.satelliteId + ' <span style="color:var(--crit);">\u2194</span> ' + c.objectId +
          ' <span class="badge badge-crit">' + c.severity.toUpperCase() + " RISK</span>";
      }

      var sub = document.querySelector(".page-head .card-sub");
      if (sub) sub.textContent = "TCA: " + S.fmtTime(c.tca) + " \u00B7 " + c.tca;

      /* Watchlist button */
      var watchBtn = document.querySelector(".page-head-actions .btn:first-child");
      if (watchBtn) {
        watchBtn.textContent = c.watchlisted ? "Remove from Watchlist" : "+ Add to Watchlist";
        watchBtn.onclick = function () {
          S.api("/conjunctions/" + encodeURIComponent(c.id) + "/watchlist", { method: "POST" }).then(function (updated) {
            watchBtn.textContent = updated.watchlisted ? "Remove from Watchlist" : "+ Add to Watchlist";
          });
        };
      }

      var maneuverLink = document.querySelector(".page-head-actions .btn-primary");
      if (maneuverLink) maneuverLink.href = "maneuvers.html?conjunctionId=" + encodeURIComponent(c.id);

      /* Risk Metrics */
      var tiles = document.querySelectorAll(".detail-grid .info-tile");
      if (tiles[0]) tiles[0].querySelector(".v").textContent = S.fmtPc(c.probabilityOfCollision);
      if (tiles[1]) tiles[1].querySelector(".v").textContent = S.fmtDist(c.missDistanceMeters);
      if (tiles[2]) tiles[2].querySelector(".v").textContent = c.relativeVelocityKms + " km/s";
      if (tiles[3]) tiles[3].querySelector(".v").textContent = c.relativeSpeedKmh.toLocaleString() + " km/h";
      if (tiles[4]) tiles[4].querySelector(".v").textContent = c.combinedUncertaintyKm + " km";
      if (tiles[5]) tiles[5].querySelector(".v").textContent = c.screeningVolumeKm.join(" \u00D7 ") + " km";

      /* Assessment */
      var assessment = document.querySelector(".detail-grid + div");
      if (assessment && c.assessment) {
        assessment.innerHTML = "<b>Assessment:</b> " + c.assessment + ' <a href="maneuvers.html?conjunctionId=' + encodeURIComponent(c.id) + '">Review candidate plans \u2192</a>';
      }

      /* Tab badge */
      var histBadge = document.querySelector(".tab:nth-child(3) .cnt");
      if (histBadge) histBadge.textContent = "?"; // will be updated by CDMs
    }).catch(function () {});

    /* ---- Orbital Information ---- */
    S.api("/conjunctions/" + encodeURIComponent(id) + "/objects").then(function (data) {
      if (!data) return;

      if (data.satellite) {
        var e = data.satellite.orbitalElements;
        var satBlock = document.querySelector(".orbit-block:first-child");
        if (satBlock) {
          satBlock.querySelector("h4").textContent = data.satellite.id;
          var stats = satBlock.querySelectorAll(".fuel-stat");
          if (stats[0]) stats[0].querySelector("b").textContent = e.altitudeKm + " km";
          if (stats[1]) stats[1].querySelector("b").textContent = e.inclinationDeg + "\u00B0";
          if (stats[2]) stats[2].querySelector("b").textContent = e.periodMin + " min";
          if (stats[3]) stats[3].querySelector("b").textContent = e.eccentricity;
        }
      }

      if (data.object) {
        var e2 = data.object.orbitalElements;
        var objBlock = document.querySelector(".orbit-block:last-child");
        if (objBlock) {
          objBlock.querySelector("h4").textContent = data.object.id;
          var stats2 = objBlock.querySelectorAll(".fuel-stat");
          if (stats2[0]) stats2[0].querySelector("b").textContent = e2.altitudeKm + " km";
          if (stats2[1]) stats2[1].querySelector("b").textContent = e2.inclinationDeg + "\u00B0";
          if (stats2[2]) stats2[2].querySelector("b").textContent = e2.periodMin + " min";
        }
      }
    }).catch(function () {});

    /* ---- Event History ---- */
    S.api("/conjunctions/" + encodeURIComponent(id) + "/history").then(function (history) {
      if (!Array.isArray(history)) return;
      var feed = document.querySelector(".two-col .feed");
      if (!feed) return;
      feed.innerHTML = history.map(function (h) {
        var sev = "sev-blue";
        if (h.action === "cdm_update") sev = "sev-yellow";
        if (h.severity === "critical") sev = "sev-red";
        return '<div class="feed-item"><span class="sev-dot ' + sev + '"></span>' +
          '<div><div class="feed-text">' + (h.description || h.action) + '</div>' +
          '<div class="feed-time">' + (h.timestamp ? new Date(h.timestamp).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) + " UTC" : "") + '</div></div></div>';
      }).join("");
    }).catch(function () {});

    /* ---- CDM Records (Probability Evolution) ---- */
    S.api("/conjunctions/" + encodeURIComponent(id) + "/cdms").then(function (cdms) {
      if (!Array.isArray(cdms)) return;

      var histBadge = document.querySelector(".tab:nth-child(3) .cnt");
      if (histBadge) histBadge.textContent = cdms.length;

      var tbody = document.querySelector(".two-col:last-child .cx-table tbody");
      if (!tbody) return;
      tbody.innerHTML = cdms.map(function (cdm, i) {
        var trend = "";
        if (i > 0) {
          var prev = cdms[i - 1].probabilityOfCollision || 0;
          var curr = cdm.probabilityOfCollision || 0;
          if (prev > 0) {
            var pctChange = ((curr - prev) / prev * 100).toFixed(0);
            if (curr > prev) {
              trend = '<td style="color:var(--crit);">\u25B2 ' + pctChange + '%</td>';
            } else {
              trend = '<td style="color:var(--nominal);">\u25BC ' + Math.abs(pctChange) + '%</td>';
            }
          } else {
            trend = '<td style="color:var(--text-mid);">\u2014</td>';
          }
        } else {
          trend = '<td style="color:var(--text-mid);">\u2014</td>';
        }

        return '<tr><td>' + (cdm.id || "CDM-" + String(cdms.length - i).padStart(2, "0")) + '</td>' +
          '<td>' + S.fmtDateShort(cdm.epoch || cdm.timestamp) + ' ' + S.fmtTime(cdm.epoch || cdm.timestamp).replace(/:\d{2}$/, "") + '</td>' +
          '<td>' + S.fmtDist(cdm.missDistanceMeters) + '</td>' +
          '<td><span class="pc-pill ' + S.pcClass(cdm.probabilityOfCollision) + '">' + cdm.probabilityOfCollision.toExponential(1) + '</span></td>' +
          trend + '</tr>';
      }).reverse().join("");
    }).catch(function () {});
  });
})();
