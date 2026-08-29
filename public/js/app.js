/* SOS · SafeOrbitForSattelites — shared shell & UI behaviors */
(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* UTC clock */
  function tickClock() {
    const now = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const t = $("#utcTime");
    const d = $("#utcDate");
    if (t) t.textContent = `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} UTC`;
    if (d) {
      d.textContent = now.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
      });
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* Sidebar (mobile) */
  function wireSidebar() {
    const menuBtn = $("#menuBtn");
    if (!menuBtn) return;
    menuBtn.addEventListener("click", () => $(".sidebar").classList.toggle("open"));
    document.addEventListener("click", (e) => {
      const sb = $(".sidebar");
      if (sb && sb.classList.contains("open") && !sb.contains(e.target) && !menuBtn.contains(e.target)) {
        sb.classList.remove("open");
      }
    });
  }

  /* Donut chart renderer: segments = [{v, color, label}] */
  window.renderDonut = function (svgId, segments, size = 126, stroke = 12) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const r = (size - stroke) / 2;
    const c = size / 2;
    const total = segments.reduce((a, s) => a + s.v, 0);
    let offset = 0;
    svg.innerHTML = `<circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(148,163,184,.12)" stroke-width="${stroke}"></circle>` +
      segments
        .map((s) => {
          const frac = s.v / total;
          const len = frac * 2 * Math.PI * r;
          const gap = 2 * Math.PI * r - len;
          const dashoffset = -offset;
          offset += len;
          return `<circle cx="${c}" cy="${c}" r="${r}" stroke="${s.color}" stroke-dasharray="${Math.max(len - 3, 0)} ${gap + 3}" stroke-dashoffset="${dashoffset}"><title>${s.label}: ${s.v}</title></circle>`;
        })
        .join("");
  };

  /* Fuel gauge */
  window.renderFuelGauge = function (svgId, pct, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const size = 128, stroke = 11;
    const r = (size - stroke) / 2, c = size / 2;
    const circ = 2 * Math.PI * r;
    const col = color || "var(--nominal)";
    svg.innerHTML =
      `<circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(148,163,184,.14)" stroke-width="${stroke}"></circle>` +
      `<circle cx="${c}" cy="${c}" r="${r}" stroke="${col}" stroke-width="${stroke}" stroke-dasharray="${(pct / 100) * circ} ${circ}">` +
      `<title>Fuel remaining ${pct}%</title></circle>`;
  };

  /* Layer chips (non-viewer filter chips only; viewer chips handled by actions.js) */
  function wireChips() {
    $$(".chip:not(.layer-chips .chip)").forEach((chip) =>
      chip.addEventListener("click", () => chip.classList.toggle("on"))
    );
  }

  /* Tabs */
  function wireTabs() {
    $$(".tabs").forEach((tabs) => {
      $$(".tab", tabs).forEach((tab) =>
        tab.addEventListener("click", () => {
          $$(".tab", tabs).forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          document.dispatchEvent(new CustomEvent("tabchange", { detail: tab }));
        })
      );
    });
  }

  /* Modals */
  function wireModals() {
    $$("[data-modal-open]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const m = $("#" + btn.getAttribute("data-modal-open"));
        if (m) m.classList.add("open");
      })
    );
    $$("[data-modal-close]").forEach((btn) =>
      btn.addEventListener("click", () => btn.closest(".modal-backdrop").classList.remove("open"))
    );
    $$(".modal-backdrop").forEach((bd) =>
      bd.addEventListener("click", (e) => { if (e.target === bd) bd.classList.remove("open"); })
    );
  }

  /* Plan card selection */
  function wirePlanCards() {
    $$(".plan-card").forEach((card) => {
      card.addEventListener("click", () => {
        $$(".plan-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        $$(".plan-card .sel-check").forEach((b) => b.remove());
        const badge = card.querySelector(".plan-head");
        if (badge) {
          const tag = document.createElement("span");
          tag.className = "sel-check";
          tag.textContent = "SELECTED";
          badge.appendChild(tag);
        }
        document.dispatchEvent(new CustomEvent("planselect", { detail: card.dataset.plan }));
      });
    });
  }

  /* Global search removed */

  /* Ctrl+K shortcut removed (search bar removed) */

  /* Escape closes modals (global) */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
  });

  /* ---- Boot: wait for shellready (shell reinjects DOM on DOMContentLoaded) ---- */
  function boot() {
    wireSidebar();
    wireChips();
    wireTabs();
    wireModals();
    wirePlanCards();
  }

  if (document.querySelector(".main-col")) boot();
  else document.addEventListener("shellready", boot);
})();
