/* ============================================================
   Gabriel's Portfolio — shared behaviour
   All storage access is guarded so the page never breaks
   if localStorage is unavailable.
   ============================================================ */
(function () {
  "use strict";

  /* ---- safe storage helpers ---- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---- THEME ---- */
  var root = document.documentElement;
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    store.set("gp-theme", t);
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.setAttribute("aria-label", t === "dark" ? "Attiva il tema chiaro" : "Attiva il tema scuro");
  }
  // toggle button
  function initTheme() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* ---- NAVBAR: scroll state + mobile collapse ---- */
  function initNav() {
    var nav = document.querySelector(".site-nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    var toggler = document.querySelector(".nav-toggler");
    var collapse = document.querySelector(".nav-collapse");
    if (toggler && collapse) {
      var setOpen = function (open) {
        collapse.classList.toggle("open", open);
        toggler.setAttribute("aria-expanded", open ? "true" : "false");
        toggler.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
      };
      toggler.addEventListener("click", function () {
        setOpen(!collapse.classList.contains("open"));
      });
      collapse.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setOpen(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
      });
      window.addEventListener("resize", function () { if (window.innerWidth > 1024) setOpen(false); });
    }
  }

  /* ---- SCROLL REVEAL ---- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- ACCESSIBILITY TOOLBAR (text scale + read aloud) ---- */
  function initA11y() {
    var scope = document.querySelector(".a11y-scope");
    var inc = document.getElementById("a11y-inc");
    var dec = document.getElementById("a11y-dec");
    var rst = document.getElementById("a11y-reset");
    var speakBtn = document.getElementById("a11y-speak");

    // --- font scaling ---
    if (scope && (inc || dec || rst)) {
      var scale = parseFloat(store.get("gp-scale")) || 1;
      var clamp = function (v) { return Math.max(0.85, Math.min(1.4, v)); };
      var apply = function () {
        scale = clamp(scale);
        scope.style.setProperty("--user-scale", scale);
        store.set("gp-scale", String(scale));
      };
      apply();
      if (inc) inc.addEventListener("click", function () { scale += 0.1; apply(); });
      if (dec) dec.addEventListener("click", function () { scale -= 0.1; apply(); });
      if (rst) rst.addEventListener("click", function () { scale = 1; apply(); });
    }

    // --- read aloud ---
    if (speakBtn) {
      var synth = window.speechSynthesis;
      if (!synth) { speakBtn.disabled = true; speakBtn.style.opacity = ".5"; return; }
      var speaking = false;
      var lang = (document.documentElement.getAttribute("lang") || "it").indexOf("en") === 0 ? "en-US" : "it-IT";
      var setState = function (on) {
        speaking = on;
        speakBtn.classList.toggle("is-active", on);
        speakBtn.innerHTML = on
          ? '<i class="bi bi-stop-fill"></i> Ferma la lettura'
          : '<i class="bi bi-volume-up-fill"></i> Ascolta la pagina';
      };
      var stop = function () { try { synth.cancel(); } catch (e) {} setState(false); };
      speakBtn.addEventListener("click", function () {
        if (speaking) { stop(); return; }
        var target = document.getElementById("speakable") || document.querySelector("main");
        if (!target) return;
        var text = target.innerText.replace(/\s+/g, " ").trim();
        if (!text) return;
        try { synth.cancel(); } catch (e) {}
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang; u.rate = 1; u.pitch = 1;
        u.onend = function () { setState(false); };
        u.onerror = function () { setState(false); };
        synth.speak(u);
        setState(true);
      });
      window.addEventListener("beforeunload", stop);
      document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
    }
  }

  /* ---- footer year ---- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---- boot ---- */
  function boot() { initTheme(); initNav(); initReveal(); initA11y(); initYear(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
