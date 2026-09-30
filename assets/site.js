/* Shared behaviour: scroll reveal, count-up, nav glow, mobile CTA, chapter stepper.
   IntersectionObserver only. No scroll listeners. All motion collapses under reduced motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canObserve = "IntersectionObserver" in window;

  var revealables = document.querySelectorAll("[data-reveal]");
  if (reduce || !canObserve) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  var counters = document.querySelectorAll("[data-count]");
  function run(el) {
    var target = Number(el.dataset.count);
    var start = performance.now();
    function step(now) {
      var t = Math.min((now - start) / 900, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (reduce || !canObserve) {
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
  } else {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  if (canObserve) {
    var nav = document.getElementById("nav");
    var sentinel = document.getElementById("sentinel");
    if (nav && sentinel) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle("scrolled", !entries[0].isIntersecting);
      }).observe(sentinel);
    }

    var sticky = document.getElementById("stickyCta");
    // Home has a .hero; interior pages start with .page-head. Either way, the CTA
    // appears once the intro block has scrolled past.
    var trigger = document.querySelector(".hero") || document.querySelector(".page-head");
    if (sticky && trigger) {
      new IntersectionObserver(function (entries) {
        sticky.classList.toggle("show", !entries[0].isIntersecting);
      }, { threshold: 0.2 }).observe(trigger);
    }
  }

  // Chapter stepper. Without JS every panel stays visible, which still reads fine.
  var list = document.getElementById("chapterList");
  if (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });

    select(0, false);
  }
})();
