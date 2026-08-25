/* SOS · SafeOrbitForSattelites — shared UI utilities: toasts, dropdowns, downloads */
(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ---------- Toast system ---------- */
  function ensureToastHost() {
    let host = document.getElementById("sosToasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "sosToasts";
      host.style.cssText =
        "position:fixed;bottom:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:340px;";
      document.body.appendChild(host);
    }
    return host;
  }

  const TOAST_COLORS = {
    success: "#22C55E",
    error: "#EF4444",
    info: "#38BDF8",
    warn: "#F59E0B",
  };

  function toast(message, type = "info", ms = 3200) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    const col = TOAST_COLORS[type] || TOAST_COLORS.info;
    el.style.cssText = [
      "background:#0C1727", `border:1px solid ${col}66`,
      "border-left:3px solid " + col, "color:#E6EEF7",
      "padding:10px 14px", "border-radius:10px",
      "font:500 12.5px Inter,system-ui,sans-serif",
      "box-shadow:0 10px 32px rgba(2,6,14,.55)",
      "opacity:0", "transform:translateY(8px)",
      "transition:all .22s ease",
    ].join(";");
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 250);
    }, ms);
  }

  /* ---------- File download helper ---------- */
  function download(url, fallbackName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fallbackName || "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function downloadFromApi(path, fallbackName) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const m = /filename="?([^";]+)"?/.exec(cd);
      const name = m ? m[1] : fallbackName || "download.txt";
      const url = URL.createObjectURL(blob);
      download(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (e) {
      toast("Download failed — backend unreachable.", "error");
      return false;
    }
  }

  /* ---------- Floating dropdown ---------- */
  function closeOpenDropdowns(except) {
    $$("[data-sos-dropdown]").forEach((d) => {
      if (d !== except) d.remove();
    });
  }

  function openDropdown(anchor, contentEl, width) {
    closeOpenDropdowns();
    const dd = document.createElement("div");
    dd.setAttribute("data-sos-dropdown", "");
    dd.style.cssText = [
      "position:absolute", "z-index:9000",
      `width:${width || 320}px`, "max-height:420px", "overflow:auto",
      "background:#0C1727", "border:1px solid rgba(148,163,184,.25)",
      "border-radius:12px", "box-shadow:0 16px 48px rgba(2,6,14,.65)",
      "padding:8px", "font:400 12.5px Inter,system-ui,sans-serif", "color:#CBD5E1",
    ].join(";");
    if (contentEl) dd.appendChild(contentEl);
    document.body.appendChild(dd);
    const r = anchor.getBoundingClientRect();
    const ddw = dd.offsetWidth;
    let left = Math.min(Math.max(r.left + window.scrollX, 8), window.scrollX + window.innerWidth - ddw - 8);
    dd.style.left = `${left}px`;
    dd.style.top = `${r.bottom + window.scrollY + 8}px`;
    return dd;
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-sos-dropdown]") && !e.target.closest("[data-sos-dropdown-anchor]")) {
      closeOpenDropdowns();
    }
  });

  window.SOSUI = { toast, download, downloadFromApi, openDropdown, closeOpenDropdowns };
})();
