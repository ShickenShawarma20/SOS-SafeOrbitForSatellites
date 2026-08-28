/* SOS · SafeOrbitForSattelites — analytics charts (canvas, dependency-free) */
(function () {
  "use strict";

  function setup(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }

  var GRID = "rgba(148,163,184,.12)";
  var LABEL = "rgba(148,163,184,.85)";
  var FONT = "10px 'JetBrains Mono', Consolas, monospace";

  function grid(ctx, w, h, pad, rows, max) {
    ctx.font = FONT;
    for (var i = 0; i <= rows; i++) {
      var y = pad.t + ((h - pad.t - pad.b) * i) / rows;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      var val = max - (max * i) / rows;
      ctx.fillStyle = LABEL;
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(val)), pad.l - 8, y + 3);
    }
  }

  /* Line / area chart — conjunctions over time */
  function lineChart(canvas) {
    if (!canvas) return;
    var data = [14, 11, 17, 13, 19, 15, 22, 18, 24, 20, 26, 23];
    var labels = ["A", "M", "J", "J", "A", "S", "O", "N", "D", "J", "F", "M"];
    var max = Math.ceil(Math.max.apply(null, data) * 1.25);

    function draw() {
      var s = setup(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      var pad = { l: 34, r: 12, t: 14, b: 24 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);

      var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      var px = function (i) { return pad.l + (iw * i) / (data.length - 1); };
      var py = function (v) { return pad.t + ih - (ih * v) / max; };

      /* area */
      var g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      g.addColorStop(0, "rgba(56,189,248,.28)");
      g.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      data.forEach(function (v, i) { i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v)); });
      ctx.lineTo(px(data.length - 1), h - pad.b);
      ctx.lineTo(px(0), h - pad.b);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();

      /* line */
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(56,189,248,.6)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      data.forEach(function (v, i) { i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v)); });
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* points */
      data.forEach(function (v, i) {
        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.arc(px(i), py(v), 3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = FONT;
      ctx.fillStyle = LABEL;
      ctx.textAlign = "center";
      labels.forEach(function (l, i) { ctx.fillText(l, px(i), h - 8); });
    }

    /* Check for API data */
    function tryLoad() {
      if (window.__chartTimeData && window.__chartTimeData.length) {
        data = window.__chartTimeData.map(function (d) { return d.value; });
        labels = window.__chartTimeData.map(function (d) { return d.label.charAt(0); });
        max = Math.ceil(Math.max.apply(null, data) * 1.25);
      }
      draw();
    }

    tryLoad();
    window.addEventListener("resize", draw);
  }

  /* Grouped bars — conjunctions by severity */
  function severityChart(canvas) {
    if (!canvas) return;
    var groups = [
      { label: "LEO", vals: [3, 9, 21] },
      { label: "MEO", vals: [1, 4, 7] },
      { label: "GEO", vals: [2, 5, 9] },
      { label: "HEO", vals: [0, 2, 4] },
    ];
    var colors = ["#EF4444", "#F97316", "#F59E0B"];
    var names = ["Critical", "High", "Medium"];
    var max = 35;

    function draw() {
      var s = setup(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      var pad = { l: 30, r: 12, t: 14, b: 40 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);
      var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      var gw = iw / groups.length;

      groups.forEach(function (grp, gi) {
        var bw = Math.min((gw - 18) / grp.vals.length, 16);
        grp.vals.forEach(function (v, vi) {
          var x = pad.l + gw * gi + 9 + vi * (bw + 4);
          var bh = (ih * v) / max;
          var y = pad.t + ih - bh;
          ctx.fillStyle = colors[vi];
          ctx.globalAlpha = 0.9;
          ctx.fillRect(x, y, bw, bh);
          ctx.globalAlpha = 1;
        });
        ctx.font = FONT;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "center";
        ctx.fillText(grp.label, pad.l + gw * gi + gw / 2, h - 24);
      });

      /* legend */
      var lx = pad.l;
      names.forEach(function (n, i) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(lx, h - 12, 10, 4);
        ctx.font = FONT;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "left";
        ctx.fillText(n, lx + 14, h - 8);
        lx += ctx.measureText(n).width + 34;
      });
    }

    function tryLoad() {
      if (window.__chartSeverityData) {
        var d = window.__chartSeverityData;
        var regimeOrder = ["LEO", "MEO", "GEO", "HEO"];
        groups = regimeOrder.filter(function (r) { return d[r]; }).map(function (r) {
          return { label: r, vals: [d[r].critical || 0, d[r].high || 0, d[r].medium || 0] };
        });
        max = 0;
        groups.forEach(function (g) { g.vals.forEach(function (v) { if (v > max) max = v; }); });
        max = Math.ceil(max * 1.25);
      }
      draw();
    }

    tryLoad();
    window.addEventListener("resize", draw);
  }

  /* Horizontal bars — top objects by conjunctions */
  function topObjectsChart(canvas) {
    if (!canvas) return;
    var items = [
      { label: "OBJ-8821", v: 14 },
      { label: "OBJ-3421", v: 11 },
      { label: "CZ-6 DEB", v: 9 },
      { label: "SL-16 R/B", v: 7 },
      { label: "OBJ-1123", v: 5 },
    ];
    var max = 16;

    function draw() {
      var s = setup(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      var rowH = h / items.length;
      items.forEach(function (it, i) {
        var y = rowH * i + rowH / 2;
        var bx = 92, bw = w - bx - 44;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "left";
        ctx.fillText(it.label, 8, y + 3);
        ctx.fillStyle = "rgba(148,163,184,.1)";
        ctx.fillRect(bx, y - 7, bw, 14);
        var g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        g.addColorStop(0, "#0369A1");
        g.addColorStop(1, "#38BDF8");
        ctx.fillStyle = g;
        ctx.fillRect(bx, y - 7, (bw * it.v) / max, 14);
        ctx.fillStyle = "#BAE6FD";
        ctx.textAlign = "right";
        ctx.fillText(String(it.v), w - 8, y + 3);
      });
    }

    function tryLoad() {
      if (window.__chartTopObjectsData) {
        items = window.__chartTopObjectsData.map(function (d) { return { label: d.id, v: d.count }; });
        max = Math.ceil(Math.max.apply(null, items.map(function (it) { return it.v; })) * 1.2);
      }
      draw();
    }

    tryLoad();
    window.addEventListener("resize", draw);
  }

  /* Bars by orbit altitude band */
  function altitudeChart(canvas) {
    if (!canvas) return;
    var bands = [
      { label: "<400", v: 18 },
      { label: "400\u2013550", v: 34 },
      { label: "550\u2013700", v: 27 },
      { label: "700\u20131000", v: 19 },
      { label: ">1000", v: 11 },
    ];
    var max = 38;

    function draw() {
      var s = setup(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      var pad = { l: 30, r: 10, t: 14, b: 24 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);
      var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      var bw = (iw / bands.length) * 0.55;

      bands.forEach(function (b, i) {
        var cxp = pad.l + (iw * (i + 0.5)) / bands.length;
        var bh = (ih * b.v) / max;
        var x = cxp - bw / 2;
        var y = pad.t + ih - bh;
        var hot = b.label === "400\u2013550";
        var g = ctx.createLinearGradient(0, y, 0, pad.t + ih);
        g.addColorStop(0, hot ? "#F97316" : "#38BDF8");
        g.addColorStop(1, hot ? "rgba(249,115,22,.25)" : "rgba(56,189,248,.25)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, bw, bh);
        ctx.font = FONT;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "center";
        ctx.fillText(b.label, cxp, h - 8);
      });
    }

    function tryLoad() {
      if (window.__chartAltitudeData) {
        bands = window.__chartAltitudeData.map(function (d) { return { label: d.band, v: d.count }; });
        max = Math.ceil(Math.max.apply(null, bands.map(function (b) { return b.v; })) * 1.2);
      }
      draw();
    }

    tryLoad();
    window.addEventListener("resize", draw);
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* Delay chart init so API data has time to arrive, then retry every
       500ms up to 4 times until the data is present. */
    var attempts = 0;
    function tryCharts() {
      lineChart(document.getElementById("chartTime"));
      severityChart(document.getElementById("chartSeverity"));
      topObjectsChart(document.getElementById("chartTopObjects"));
      altitudeChart(document.getElementById("chartAltitude"));
      attempts++;
      var hasData = window.__chartTimeData || window.__chartSeverityData || window.__chartTopObjectsData || window.__chartAltitudeData;
      if (!hasData && attempts < 5) setTimeout(tryCharts, 500);
    }
    setTimeout(tryCharts, 300);
  });
})();
