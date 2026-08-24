/* SOS · SafeOrbitForSattelites — analytics charts (canvas, dependency-free) */
(function () {
  "use strict";

  function setup(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  const GRID = "rgba(148,163,184,.12)";
  const LABEL = "rgba(148,163,184,.85)";
  const FONT = "10px 'JetBrains Mono', Consolas, monospace";

  function grid(ctx, w, h, pad, rows, max) {
    ctx.font = FONT;
    for (let i = 0; i <= rows; i++) {
      const y = pad.t + ((h - pad.t - pad.b) * i) / rows;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      const val = max - (max * i) / rows;
      ctx.fillStyle = LABEL;
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(val)), pad.l - 8, y + 3);
    }
  }

  /* Line / area chart — conjunctions over time */
  function lineChart(canvas) {
    if (!canvas) return;
    const data = [14, 11, 17, 13, 19, 15, 22, 18, 24, 20, 26, 23];
    const labels = ["A", "M", "J", "J", "A", "S", "O", "N", "D", "J", "F", "M"];
    const max = Math.ceil(Math.max(...data) * 1.25);

    function frame() {
      const { ctx, w, h } = setup(canvas);
      const pad = { l: 34, r: 12, t: 14, b: 24 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);

      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const px = (i) => pad.l + (iw * i) / (data.length - 1);
      const py = (v) => pad.t + ih - (ih * v) / max;

      /* area */
      const g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      g.addColorStop(0, "rgba(56,189,248,.28)");
      g.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      data.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
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
      data.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* points */
      data.forEach((v, i) => {
        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.arc(px(i), py(v), 3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = FONT;
      ctx.fillStyle = LABEL;
      ctx.textAlign = "center";
      labels.forEach((l, i) => ctx.fillText(l, px(i), h - 8));
    }
    frame();
    window.addEventListener("resize", frame);
  }

  /* Grouped bars — conjunctions by severity */
  function severityChart(canvas) {
    if (!canvas) return;
    const groups = [
      { label: "LEO", vals: [3, 9, 21] },
      { label: "MEO", vals: [1, 4, 7] },
      { label: "GEO", vals: [2, 5, 9] },
      { label: "HEO", vals: [0, 2, 4] },
    ];
    const colors = ["#EF4444", "#F97316", "#F59E0B"];
    const names = ["Critical", "High", "Medium"];
    const max = 35;

    function frame() {
      const { ctx, w, h } = setup(canvas);
      const pad = { l: 30, r: 12, t: 14, b: 40 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const gw = iw / groups.length;

      groups.forEach((grp, gi) => {
        const bw = Math.min((gw - 18) / grp.vals.length, 16);
        grp.vals.forEach((v, vi) => {
          const x = pad.l + gw * gi + 9 + vi * (bw + 4);
          const bh = (ih * v) / max;
          const y = pad.t + ih - bh;
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
      let lx = pad.l;
      names.forEach((n, i) => {
        ctx.fillStyle = colors[i];
        ctx.fillRect(lx, h - 12, 10, 4);
        ctx.font = FONT;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "left";
        ctx.fillText(n, lx + 14, h - 8);
        lx += ctx.measureText(n).width + 34;
      });
    }
    frame();
    window.addEventListener("resize", frame);
  }

  /* Horizontal bars — top objects by conjunctions */
  function topObjectsChart(canvas) {
    if (!canvas) return;
    const items = [
      { label: "OBJ-8821", v: 14 },
      { label: "OBJ-3421", v: 11 },
      { label: "CZ-6 DEB", v: 9 },
      { label: "SL-16 R/B", v: 7 },
      { label: "OBJ-1123", v: 5 },
    ];
    const max = 16;

    function frame() {
      const { ctx, w, h } = setup(canvas);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      const rowH = h / items.length;
      items.forEach((it, i) => {
        const y = rowH * i + rowH / 2;
        const bx = 92, bw = w - bx - 44;
        ctx.fillStyle = LABEL;
        ctx.textAlign = "left";
        ctx.fillText(it.label, 8, y + 3);
        ctx.fillStyle = "rgba(148,163,184,.1)";
        ctx.fillRect(bx, y - 7, bw, 14);
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        g.addColorStop(0, "#0369A1");
        g.addColorStop(1, "#38BDF8");
        ctx.fillStyle = g;
        ctx.fillRect(bx, y - 7, (bw * it.v) / max, 14);
        ctx.fillStyle = "#BAE6FD";
        ctx.textAlign = "right";
        ctx.fillText(String(it.v), w - 8, y + 3);
      });
    }
    frame();
    window.addEventListener("resize", frame);
  }

  /* Bars by orbit altitude band */
  function altitudeChart(canvas) {
    if (!canvas) return;
    const bands = [
      { label: "<400", v: 18 },
      { label: "400–550", v: 34 },
      { label: "550–700", v: 27 },
      { label: "700–1000", v: 19 },
      { label: ">1000", v: 11 },
    ];
    const max = 38;

    function frame() {
      const { ctx, w, h } = setup(canvas);
      const pad = { l: 30, r: 10, t: 14, b: 24 };
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, pad, 4, max);
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const bw = (iw / bands.length) * 0.55;

      bands.forEach((b, i) => {
        const cxp = pad.l + (iw * (i + 0.5)) / bands.length;
        const bh = (ih * b.v) / max;
        const x = cxp - bw / 2;
        const y = pad.t + ih - bh;
        const hot = b.label === "400–550";
        const g = ctx.createLinearGradient(0, y, 0, pad.t + ih);
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
    frame();
    window.addEventListener("resize", frame);
  }

  document.addEventListener("DOMContentLoaded", () => {
    lineChart(document.getElementById("chartTime"));
    severityChart(document.getElementById("chartSeverity"));
    topObjectsChart(document.getElementById("chartTopObjects"));
    altitudeChart(document.getElementById("chartAltitude"));
  });
})();
