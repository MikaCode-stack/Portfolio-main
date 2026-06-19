/* ==========================================================================
   Michaël Etiennette — Portfolio · shared behaviour
   Plain vanilla JS. No build step, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    // close menu after a link is tapped (mobile)
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* ---- Highlight current page in nav ---- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here || (here === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Tabs (Wood Badge clusters etc.) ---- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var btns = group.querySelectorAll('.tab-btn');
    var panels = group.querySelectorAll('.tab-panel');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-target');
        btns.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.toggle('active', p.id === target); });
        btn.classList.add('active');
        // Reveal any cards inside the newly shown panel. They were hidden
        // (display:none), so the scroll observer never marked them visible.
        var shown = group.querySelector('#' + target);
        if (shown) {
          shown.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
        }
      });
    });
  });

  /* ---- Gallery filter ---- */
  var gFilters = document.querySelectorAll('.gallery-filters .tab-btn');
  var gItems = document.querySelectorAll('.gallery .gphoto');
  if (gFilters.length) {
    gFilters.forEach(function (f) {
      f.addEventListener('click', function () {
        var cat = f.getAttribute('data-cat');
        gFilters.forEach(function (x) { x.classList.remove('active'); });
        f.classList.add('active');
        gItems.forEach(function (item) {
          var show = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---- Contact form (display only — no backend) ---- */
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.querySelector('#form-status');
      var name = (document.querySelector('#cf-name') || {}).value || 'there';
      if (note) {
        note.textContent = 'Thanks, ' + name.trim() + '! This is a display-only form. '
          + 'To send a real message, please email michael@example.com directly.';
        note.style.color = '#4d006e';
      }
      form.reset();
    });
  }

  /* ---- Footer year ---- */
  var yr = document.querySelector('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();

(function heroTilt() {
  const card = document.querySelector("#heroPhoto .hero-photo__inner");
  if (!card) return;

  // Respect users who prefer reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX = 12; // max tilt in degrees

  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0 → 1
    const py = (e.clientY - r.top) / r.height;   // 0 → 1

    const rotateY = (px - 0.5) * 2 * MAX;        // left/right
    const rotateX = (0.5 - py) * 2 * MAX;        // up/down

    card.style.transform =
      `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;

    // move the shine toward the cursor
    card.querySelector(".hero-photo__shine")
      ?.style.setProperty("--mx", `${px * 100}%`);
    card.querySelector(".hero-photo__shine")
      ?.style.setProperty("--my", `${py * 100}%`);
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0) rotateY(0) scale(1)";
  });
})();