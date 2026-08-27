/* SOS — world land mass SVG path data (equirectangular projection).
 * Generated from Natural Earth 110m land GeoJSON (ne_110m_land.geojson).
 * Projection: x = (lon + 180) * (720/360), y = (90 - lat) * (360/180).
 * Fits a 720×360 viewBox matching the ground station coverage map.
 */
(function () {
  "use strict";
  // The path data is loaded from the accompanying .txt file at runtime to keep
  // this module small.  Cached after first fetch.
  let cached = null;
  let loading = null;

  window.SOSWorldMap = {
    get: function () {
      if (cached) return Promise.resolve(cached);
      if (loading) return loading;
      loading = fetch("js/data/world-land.svg.txt")
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (text) {
          cached = text;
          return text;
        })
        .catch(function (e) {
          console.warn("[world-map] Failed to load land data:", e.message);
          cached = ""; // empty = no land rendered
          return "";
        });
      return loading;
    },
  };
})();
