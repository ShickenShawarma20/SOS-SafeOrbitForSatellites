/* SOS · SafeOrbitForSattelites — Landing page interactivity */
(function () {
  "use strict";

  /* ---------- UTC clock ---------- */
  function updateClock() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    var el = document.getElementById("utcClock");
    if (el) el.textContent = p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + " UTC";
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Scroll progress bar ---------- */
  var progress = document.getElementById("scrollProgress");
  window.addEventListener("scroll", function () {
    if (!progress) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    progress.style.width = pct + "%";
  }, { passive: true });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add("visible"); }, i * 80);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("visible"); });
  }

  /* ---------- Count-up stats ---------- */
  function countUp(el, target, suffix) {
    var dur = 1600, start = 0, startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min(1, (ts - startTime) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(start + (target - start) * eased);
      el.textContent = val.toLocaleString() + (suffix || "");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + (suffix || "");
    }
    requestAnimationFrame(step);
  }
  var statsObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var textAttr = el.getAttribute("data-text");
      if (textAttr) { el.textContent = textAttr; }
      else if (!isNaN(target)) { countUp(el, target, suffix); }
      statsObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".stat-val[data-count], .stat-val[data-text]").forEach(function (s) { statsObserver.observe(s); });

  /* ---------- 3D card tilt ---------- */
  var tiltCards = document.querySelectorAll("[data-tilt]");
  tiltCards.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = "rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg) translateZ(5px)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "rotateY(0) rotateX(0) translateZ(0)";
    });
  });

  /* ---------- Mouse parallax on hero ---------- */
  var hero = document.querySelector("[data-parallax]");
  if (hero) {
    document.addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 16;
      var y = (e.clientY / window.innerHeight - 0.5) * 12;
      hero.style.transform = "translate(" + x + "px, " + y + "px)";
    }, { passive: true });
  }

  /* ---------- Typewriter effect ---------- */
  var tagEl = document.getElementById("heroTag");
  var tagText =
    "An autonomous mission-control console that watches LEO satellites, " +
    "detects debris conjunctions, and plans collision-avoidance maneuvers \u2014 " +
    "all visualised on a live 3D orbital digital twin.";
  if (tagEl) {
    var idx = 0;
    function typeChar() {
      if (idx <= tagText.length) {
        tagEl.textContent = tagText.slice(0, idx);
        idx++;
        var delay = tagText.charAt(idx - 1) === " " ? 12 : 28;
        if (idx <= 4) delay = 60;
        setTimeout(typeChar, delay);
      }
    }
    setTimeout(typeChar, 600);
  }

  /* ---------- Ensure video plays (browsers can block autoplay) ---------- */
  var vid = document.getElementById("vidBg");
  if (vid) {
    vid.muted = true;
    var tryPlay = function () { vid.play().catch(function () {}); };
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay, { once: true });
  }
})();
