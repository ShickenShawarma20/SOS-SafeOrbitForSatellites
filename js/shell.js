/* SOS · SafeOrbitForSattelites — persistent application shell */
(function () {
  "use strict";

  const I = {
    logo:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-28 12 12)"/><circle cx="19" cy="7.6" r="1.5" fill="currentColor" stroke="none"/></svg>',
    home:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    conjunction:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    satellite:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M2.5 10.5h5v-3h-5zM16.5 13.5h5v3h-5z"/><path d="M12 3v3M12 18v3M4 20l3-3M17 6l3-3"/></svg>',
    maneuver:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19c6 0 4-11 10-11h4"/><path d="m15.5 5 3 3-3 3"/><circle cx="4" cy="19" r="1.6"/></svg>',
    orbit:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-22 12 12)"/></svg>',
    ground:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21v-8M8 21l2.5-5M16 21l-2.5-5"/><path d="M7.5 8a6 6 0 0 1 9 0M9.5 10.5a3.2 3.2 0 0 1 5 0"/></svg>',
    analytics:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
    reports:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 12h6M9 16h6"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>',
    sat_metric:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M3 8h4V5H3zM17 16h4v3h-4z"/><path d="M7 6.5 9 8.5M17 17.5l-2-2"/></svg>',
    alert:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 9.5v4.5M12 17.2v.3" stroke-linecap="round"/></svg>',
    route:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 19h8a4 4 0 0 0 4-4V7"/></svg>',
    health:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-6 4 12L16 12h5"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    zoom_in:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/></svg>',
    zoom_out:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/></svg>',
    target:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
    fullscreen:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    layers:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>',
  };

  const NAV = [
    { id: "home", label: "Home", href: "index.html", icon: I.home },
    { id: "conjunctions", label: "Conjunctions", href: "conjunction.html", icon: I.conjunction, badge: "12" },
    { id: "satellites", label: "Satellites", href: "satellite.html", icon: I.satellite },
    { id: "maneuvers", label: "Maneuvers", href: "maneuvers.html", icon: I.maneuver },
    { id: "orbits", label: "Orbits", href: "#orbits", icon: I.orbit },
    { id: "groundstations", label: "Ground Stations", href: "#groundstations", icon: I.ground },
    { id: "analytics", label: "Analytics", href: "analytics.html", icon: I.analytics },
    { id: "reports", label: "Reports", href: "#reports", icon: I.reports },
    { id: "settings", label: "Settings", href: "#settings", icon: I.settings },
  ];

  function sidebar(active) {
    return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">${I.logo}</div>
        <div class="brand-text">
          <div class="brand-name">SOS</div>
          <div class="brand-sub">SafeOrbitForSattelites</div>
          <div class="brand-tag">COLLISION AVOIDANCE</div>
        </div>
      </div>
      <nav class="nav" aria-label="Primary">
        ${NAV.map(
          (n) => `
        <a class="nav-item${n.id === active ? " active" : ""}" href="${n.href}" ${
          n.id === active ? 'aria-current="page"' : ""
        }>
          ${n.icon}<span>${n.label}</span>${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ""}
        </a>`
        ).join("")}
      </nav>
      <div class="side-bottom">
        <div class="sys-status">
          <div class="label">System Status</div>
          <span class="sys-ok"><span class="dot"></span>NOMINAL</span>
          <div class="sys-row"><span>Tracking Sources</span><b>32 Online</b></div>
          <div class="sys-row"><span>Data Latency</span><b>1.2 s</b></div>
          <div class="sys-row"><span>Coverage</span><b>98.7%</b></div>
        </div>
        <div class="operator">
          <div class="avatar">AM</div>
          <div class="who">
            <div class="name">Alex Morgan</div>
            <div class="role">Mission Controller</div>
          </div>
        </div>
      </div>
    </aside>`;
  }

  function topbar() {
    return `
    <header class="topbar">
      <button class="icon-btn menu-btn" id="menuBtn" aria-label="Toggle navigation">${I.settings.replace(
        'stroke-width="1.8"',
        'stroke-width="1.8"'
      )}</button>
      <div class="clock">
        <div class="t num" id="utcTime">--:--:-- UTC</div>
        <div class="d" id="utcDate"></div>
      </div>
      <div class="search" role="search">
        ${I.search}
        <input type="search" placeholder="Search satellites, objects, TCA…" aria-label="Search">
        <kbd>Ctrl K</kbd>
      </div>
      <div class="top-metrics">
        <div class="top-metric">${I.sat_metric}
          <div><div class="v num">124</div><div class="k">Active Satellites</div></div>
        </div>
        <div class="top-metric crit">${I.alert}
          <div><div class="v num">12</div><div class="k">Conjunction Alerts</div></div>
        </div>
        <div class="top-metric warn">${I.route}
          <div><div class="v num">3</div><div class="k">Maneuvers Planned</div></div>
        </div>
        <div class="top-metric">${I.health}
          <div><div class="v num">98%</div><div class="k">System Health</div></div>
        </div>
      </div>
      <button class="icon-btn ping" aria-label="Notifications">${I.bell}</button>
      <a class="icon-btn" href="#settings" aria-label="Settings">${I.settings}</a>
    </header>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page || "home";
    const shell = document.getElementById("shell");
    if (shell) {
      shell.innerHTML =
        sidebar(page) +
        `<div class="main-col">${topbar()}${shell.innerHTML}</div>`;
      const menuBtn = document.getElementById("menuBtn");
      if (menuBtn)
        menuBtn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      document.dispatchEvent(new CustomEvent("shellready"));
    }
  });
})();
