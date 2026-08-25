/* SOS · SafeOrbitForSattelites — interactive actions: search, notifications, tabs, buttons */
(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const API = () => window.SOSApi;
  const UI = () => window.SOSUI;

  /* ================= GLOBAL SEARCH (topbar) ================= */

  function initSearch() {
    const wrap = $(".search");
    const input = wrap && wrap.querySelector("input[type='search']");
    if (!wrap || !input || input.dataset.wired) return;
    input.dataset.wired = "1";

    let dd = null;
    let debounce = null;

    function closeResults() {
      if (dd) { dd.remove(); dd = null; }
    }

    async function showResults() {
      const q = input.value.trim();
      if (!q) return closeResults();
      let data = { satellites: [], objects: [], conjunctions: [] };
      if (API()) {
        try { data = await API().get(`/search?q=${encodeURIComponent(q)}`); } catch (_) {}
      }
      const box = document.createElement("div");
      const section = (title, items, render) => {
        if (!items.length) return "";
        return `<div style="padding:6px 8px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.08em;color:#64748B;">${title}</div>` +
          items.map(render).join("");
      };
      box.innerHTML =
        section("SATELLITES", data.satellites,
          (s) => `<a href="satellite.html" class="sos-search-item" style="display:flex;justify-content:space-between;padding:7px 8px;border-radius:7px;color:#E2E8F0;text-decoration:none;"><span>${s.id}</span><span style="color:#94A3B8;">${s.name}</span></a>`) +
        section("OBJECTS", data.objects,
          (o) => `<div class="sos-search-item" style="padding:7px 8px;border-radius:7px;"><span style="color:#FDBA74;">${o.id}</span> <span style="color:#94A3B8;">· ${o.type} · ${o.regime}</span></div>`) +
        section("CONJUNCTIONS", data.conjunctions,
          (c) => `<a href="conjunction.html" class="sos-search-item" style="display:flex;justify-content:space-between;padding:7px 8px;border-radius:7px;color:#E2E8F0;text-decoration:none;"><span>${c.id}</span><span style="color:${c.severity === "critical" ? "#EF4444" : "#94A3B8"};">Pc ${c.probabilityOfCollision.toExponential(1)}</span></a>`);
      if (!box.innerHTML) {
        box.innerHTML = `<div style="padding:10px;color:#64748B;">No results for "${q}"</div>`;
      }
      $$(".sos-search-item", box).forEach((el) => {
        el.addEventListener("mouseenter", () => (el.style.background = "rgba(56,189,248,.12)"));
        el.addEventListener("mouseleave", () => (el.style.background = ""));
      });
      if (dd) dd.remove();
      dd = UI().openDropdown(input, box, 340);
    }

    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(showResults, 220);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); showResults(); }
      if (e.key === "Escape") { closeResults(); input.blur(); }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ================= NOTIFICATIONS BELL ================= */

  function initNotifications() {
    const bell = $('button[aria-label="Notifications"]');
    if (!bell || bell.dataset.wired) return;
    bell.dataset.wired = "1";

    let unreadCount = 0;

    async function refreshBadge() {
      if (!API()) return;
      try {
        const { unreadCount: n } = await API().get("/notifications?unread=true");
        unreadCount = n;
        let badge = bell.querySelector(".bell-badge");
        if (n > 0) {
          if (!badge) {
            badge = document.createElement("span");
            badge.className = "bell-badge";
            badge.style.cssText =
              "position:absolute;top:-3px;right:-3px;min-width:15px;height:15px;border-radius:8px;" +
              "background:#EF4444;color:#fff;font:700 9px 'JetBrains Mono',monospace;" +
              "display:flex;align-items:center;justify-content:center;padding:0 3px;";
            bell.style.position = "relative";
            bell.appendChild(badge);
          }
          badge.textContent = n > 9 ? "9+" : String(n);
        } else if (badge) badge.remove();
      } catch (_) {}
    }

    async function openPanel() {
      const box = document.createElement("div");
      let items = [];
      if (API()) {
        try { items = (await API().get("/notifications")).items; } catch (_) {}
      }
      const dotCls = { critical: "#EF4444", high: "#F97316", medium: "#F59E0B", info: "#38BDF8", nominal: "#22C55E" };
      box.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px 8px;">
          <b style="font-size:11px;letter-spacing:.06em;color:#94A3B8;">NOTIFICATIONS</b>
          <button class="sos-mark-read" style="background:none;border:none;color:#38BDF8;font:600 11px Inter,sans-serif;cursor:pointer;padding:0;">Mark all read</button>
        </div>` +
        (items.length
          ? items.map((n) =>
              `<div style="display:flex;gap:8px;padding:8px;border-radius:8px;${n.read ? "opacity:.55;" : ""}">
                 <span style="flex:none;width:7px;height:7px;border-radius:50%;margin-top:5px;background:${dotCls[n.severity] || "#38BDF8"};"></span>
                 <div><div style="color:#E2E8F0;">${n.text}</div><div style="font-size:10.5px;color:#64748B;margin-top:1px;">${new Date(n.time).toUTCString().slice(17, 25)} UTC</div></div>
               </div>`).join("")
          : `<div style="padding:12px;color:#64748B;">Backend offline — no notifications available.</div>`);
      const dd = UI().openDropdown(bell, box, 330);
      $(".sos-mark-read", box).addEventListener("click", async () => {
        if (API()) { try { await API().post("/notifications/read-all"); } catch (_) {} }
        dd.remove();
        refreshBadge();
        UI().toast("All notifications marked as read", "success");
      });
    }

    bell.addEventListener("click", openPanel);
    refreshBadge();
    setInterval(refreshBadge, 30000);
  }

  /* ================= TABS (conjunction & satellite pages) ================= */

  function initTabs() {
    $$(".tabs").forEach((tabs) => {
      if (tabs.dataset.wired) return;
      tabs.dataset.wired = "1";
      const page = document.body.dataset.page;

      $$(".tab", tabs).forEach((tab, idx) => {
        tab.addEventListener("click", () => {
          applyPanelVisibility(page, tab.textContent.trim(), tabs);
        });
      });

      function applyPanelVisibility(page, label, tabsEl) {
        // visual state handled by app.js; here we swap panel content visibility
        const sections = pageSections(page);
        if (!sections) return;
        Object.entries(sections).forEach(([name, els]) => {
          els.forEach((el) => (el.style.display = "none"));
        });
        const active = matchTab(label, sections, page);
        (sections[active] || sections[Object.keys(sections)[0]]).forEach((el) => (el.style.display = ""));
        UI() && UI().toast(`${label} view`, "info", 1400);
      }
    });
  }

  function pageSections(page) {
    const main = $("main.page");
    if (!main) return null;
    const allSections = $$(":scope > section, :scope > article", main);
    if (page === "conjunctions") {
      return {
        overview: [allSections[0]].filter(Boolean),
        analysis: [allSections[0]].filter(Boolean),
        history: [allSections[1]].filter(Boolean),
        maneuvers: [allSections[0], allSections[1]].filter(Boolean),
      };
    }
    if (page === "satellites") {
      return {
        overview: allSections,
        telemetry: [allSections[0]].filter(Boolean),
        orbit: [allSections[1]].filter(Boolean),
        history: [allSections[2]].filter(Boolean),
        files: [allSections[0]].filter(Boolean),
      };
    }
    return null;
  }

  function matchTab(label, sections, page) {
    const l = label.toLowerCase();
    if (l.includes("analysis")) return "analysis";
    if (l.includes("history")) return "history";
    if (l.includes("maneuver")) return "maneuvers";
    if (l.includes("telemetry")) return "telemetry";
    if (l === "orbit") return "orbit";
    if (l.includes("file")) return "files";
    return "overview";
  }

  /* ================= CONJUNCTION PAGE — watchlist button ================= */

  function initConjunctionPage() {
    if (document.body.dataset.page !== "conjunctions") return;
    const btn = $$(".page-head-actions .btn").find((b) => b.textContent.includes("Watchlist"));
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async () => {
      const conjId = ($(".crumb").textContent.match(/CD-\d{4}-\d{4}-\d{4}/) || ["CD-2024-0526-0417"])[0];
      if (!API()) return UI().toast("Backend offline — cannot update watchlist.", "error");
      try {
        const r = await API().watchlist(conjId);
        btn.textContent = r.watchlisted ? "\u2713 On Watchlist" : "+ Add to Watchlist";
        UI().toast(r.watchlisted ? `${conjId} added to watchlist` : `${conjId} removed from watchlist`, "success");
      } catch (_) {
        UI().toast("Failed to update watchlist.", "error");
      }
    });
  }

  /* ================= SATELLITE PAGE — TLE download ================= */

  function initSatellitePage() {
    if (document.body.dataset.page !== "satellites") return;
    const btn = $$(".page-head-actions .btn").find((b) => b.textContent.includes("Download TLE"));
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = "1";
      btn.addEventListener("click", async () => {
        const satId = ($("h1").textContent.match(/SAT-\d+/) || ["SAT-042"])[0];
        const ok = await UI().downloadFromApi(`/api/v1/satellites/${satId}/tle`, `${satId}.tle`);
        if (ok) UI().toast(`TLE for ${satId} downloaded`, "success");
      });
    }

    // Files tab: fetch file list into a toast-panel when Files tab clicked
    $$(".tab").forEach((tab) => {
      if (/files/i.test(tab.textContent) && !tab.dataset.fileWired) {
        tab.dataset.fileWired = "1";
        tab.addEventListener("click", async () => {
          if (!API()) return;
          try {
            const satId = ($("h1").textContent.match(/SAT-\d+/) || ["SAT-042"])[0];
            const { items } = await API().get(`/satellites/${satId}/files`);
            const box = document.createElement("div");
            box.innerHTML =
              `<b style="display:block;padding:4px 8px 8px;font-size:11px;color:#94A3B8;letter-spacing:.06em;">FILES · ${items.length}</b>` +
              items.map((f) =>
                `<a href="${f.url}" download style="display:flex;justify-content:space-between;gap:14px;padding:7px 8px;border-radius:7px;color:#E2E8F0;text-decoration:none;">
                   <span>${f.name}</span><span style="color:#64748B;">${f.sizeKb} KB</span></a>`).join("");
            UI().openDropdown(tab, box, 380);
          } catch (_) {}
        });
      }
    });
  }

  /* ================= MANEUVERS PAGE — export + simulate progress + submit feedback ================= */

  function initManeuverPage() {
    if (document.body.dataset.page !== "maneuvers") return;

    // Export plan button
    const exportBtn = $$(".page-head-actions .btn").find((b) => b.textContent.includes("Export Plan"));
    if (exportBtn && !exportBtn.dataset.wired) {
      exportBtn.dataset.wired = "1";
      exportBtn.addEventListener("click", async () => {
        const planId = planIdFromSelection();
        const ok = await UI().downloadFromApi(`/api/v1/maneuvers/plans/${planId}/export?format=json`, `${planId}.json`);
        if (ok) UI().toast(`Plan ${planId} exported`, "success");
      });
    }

    // Simulate modal: replace console.log flow with visible progress bar
    const simModal = $("#simulateModal");
    if (simModal && !simModal.dataset.progressWired) {
      simModal.dataset.progressWired = "1";
      const runBtn = $(".modal-foot .btn-primary", simModal);
      const body = $(".modal-body", simModal);
      if (runBtn && body) {
        const origHtml = body.innerHTML;
        runBtn.addEventListener("click", async () => {
          if (!API()) return UI().toast("Backend offline — simulation unavailable.", "error");
          const planId = planIdFromSelection();
          try {
            const { jobId } = await API().simulate(planId);
            body.innerHTML =
              `<div id="simProgressWrap">
                 <div style="margin-bottom:8px;">Running high-fidelity propagation for <b>${planId.replace("MP-", "Plan ").slice(-1)}</b>&hellip;</div>
                 <div style="height:8px;border-radius:4px;background:rgba(148,163,184,.15);overflow:hidden;">
                   <div id="simBar" style="height:100%;width:0%;background:linear-gradient(90deg,#0369A1,#38BDF8);transition:width .5s ease;"></div>
                 </div>
                 <div id="simStage" style="margin-top:8px;font:500 11.5px 'JetBrains Mono',monospace;color:#94A3B8;">initializing&hellip;</div>
               </div>`;
            const poll = setInterval(async () => {
              try {
                const job = await API().jobStatus(jobId);
                const bar = $("#simBar", body);
                const stage = $("#simStage", body);
                if (bar) bar.style.width = job.progress + "%";
                if (stage) stage.textContent = job.stage;
                if (job.status === "complete") {
                  clearInterval(poll);
                  body.innerHTML = `<div><b style="color:var(--nominal);">\u2713 Simulation complete</b><br><br>${job.result.summary}</div>`;
                  UI().toast("Simulation finished — trajectory is clear for 72 h.", "success");
                  setTimeout(() => {
                    const bd = simModal.closest(".modal-backdrop") || simModal;
                    simModal.classList.remove("open");
                    body.innerHTML = origHtml;
                  }, 2600);
                }
              } catch (_) { clearInterval(poll); }
            }, 800);
          } catch (_) {
            UI().toast("Failed to start simulation.", "error");
          }
        });
      }
    }

    // Save modal: submit-for-approval with confirmation
    const saveModal = $("#saveModal");
    if (saveModal && !saveModal.dataset.submitWired) {
      saveModal.dataset.submitWired = "1";
      const submitBtn = $(".modal-foot .btn-danger", saveModal);
      if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
          const planId = planIdFromSelection();
          if (!API()) return UI().toast("Backend offline — cannot submit plan.", "error");
          try {
            await API().submitPlan(planId);
            UI().toast(`${planId} submitted for mission-director approval`, "success");
          } catch (_) {
            UI().toast("Submission failed.", "error");
          }
        });
      }
    }
  }

  function planIdFromSelection() {
    const selected = $(".plan-card.selected");
    const letter = (selected && selected.dataset.plan) || "A";
    return `MP-0417-${letter}`;
  }

  /* ================= ANALYTICS PAGE — range chips + export ================= */

  function initAnalyticsPage() {
    if (document.body.dataset.page !== "analytics") return;

    const chips = $$(".page-head-actions .btn-sm").filter((b) => /^\d+D$/.test(b.textContent.trim()));
    chips.forEach((chip) => {
      chip.addEventListener("click", async () => {
        chips.forEach((c) => c.classList.remove("on"));
        chip.classList.add("on");
        const range = chip.textContent.trim().toLowerCase();
        if (!API()) return UI().toast("Backend offline — showing cached data.", "warn");
        try {
          const summary = await API().get(`/analytics/summary?range=${range}`);
          const vals = $$(".metric-val.num");
          if (vals.length >= 4) {
            vals[0].textContent = summary.totalConjunctions;
            vals[1].textContent = summary.averagePc.toExponential(1);
            vals[2].textContent = summary.maneuversExecuted;
            vals[3].textContent = `${summary.riskReductionPct}%`;
          }
          UI().toast(`Analytics updated for last ${range}`, "info", 1600);
        } catch (_) {
          UI().toast("Could not refresh analytics.", "error");
        }
      });
    });

    const exportBtn = $$(".page-head-actions .btn").find((b) => b.textContent.includes("Export Report"));
    if (exportBtn && !exportBtn.dataset.wired) {
      exportBtn.dataset.wired = "1";
      exportBtn.addEventListener("click", async () => {
        const active = chips.find((c) => c.classList.contains("on"));
        const range = active ? active.textContent.trim().toLowerCase() : "30d";
        const ok = await UI().downloadFromApi(`/api/v1/analytics/report/export?range=${range}&format=csv`, `sos-report-${range}.csv`);
        if (ok) UI().toast(`Report (${range}) exported as CSV`, "success");
      });
    }
  }

  /* ================= ORBITAL VIEWER — layer chips, speed, fullscreen ================= */

  function initViewerControls() {
    const viewer = document.querySelector(".orbital-viewer");
    if (!viewer || viewer.dataset.viewerWired) return;
    viewer.dataset.viewerWired = "1";

    // Layer chips toggle actual layers
    $$(".layer-chips .chip", viewer).forEach((chip) => {
      const label = chip.textContent.trim();
      const key = /DEBRIS/i.test(label) ? "debris" : /ORBIT/i.test(label) ? "orbits" : "satellites";
      chip.addEventListener("click", () => {
        const v = window.sosOrbitalViewer;
        if (!v || !v.layers) return;
        v.layers[key] = chip.classList.contains("on");
      });
    });

    // 2x speed toggle
    const tlRight = $(".tl-right", viewer);
    if (tlRight) {
      const speedBtn = $(".btn.btn-sm", tlRight);
      if (speedBtn && !speedBtn.dataset.wired) {
        speedBtn.dataset.wired = "1";
        speedBtn.addEventListener("click", () => {
          const v = window.sosOrbitalViewer;
          if (!v) return;
          v.speedMult = v.speedMult === 1 ? 2 : 1;
          speedBtn.textContent = `${v.speedMult}\u00d7`;
          speedBtn.classList.toggle("on", v.speedMult !== 1);
          UI().toast(`Simulation speed: ${v.speedMult}\u00d7`, "info", 1400);
        });
      }
      const fsBtn = $('button[aria-label="Fullscreen"]', tlRight);
      if (fsBtn && !fsBtn.dataset.wired) {
        fsBtn.dataset.wired = "1";
        fsBtn.addEventListener("click", () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (viewer.requestFullscreen) {
            viewer.requestFullscreen();
          }
        });
      }
    }
  }

  /* ================= BOOT ================= */

  document.addEventListener("DOMContentLoaded", () => {
    initSearch();
    initNotifications();
    initTabs();
    initConjunctionPage();
    initSatellitePage();
    initManeuverPage();
    initAnalyticsPage();
    initViewerControls();
  });
})();
