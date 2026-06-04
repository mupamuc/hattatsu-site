// HATTATSU GROUP — interactions
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("navMenu");

  // nav shadow on scroll
  var onScroll = function () {
    if (window.scrollY > 8) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // mobile menu
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // deferred simulator iframe (load on click or when scrolled into view)
  var simEmbed = document.getElementById("simEmbed");
  var simPlay = document.getElementById("simPlay");
  if (simEmbed) {
    var loadSim = function () {
      if (simEmbed.dataset.loaded) return;
      simEmbed.dataset.loaded = "1";
      var iframe = document.createElement("iframe");
      iframe.src = simEmbed.dataset.src;
      iframe.title = "Бизнес-симулятор Hattatsu";
      iframe.setAttribute("allowfullscreen", "");
      iframe.referrerPolicy = "no-referrer";
      simEmbed.innerHTML = "";
      simEmbed.appendChild(iframe);
    };
    if (simPlay) simPlay.addEventListener("click", loadSim);
    if ("IntersectionObserver" in window) {
      var simIo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadSim(); simIo.disconnect(); }
      }, { threshold: 0.35 });
      simIo.observe(simEmbed);
    }
  }

  // lead form → compose email (no backend on static hosting)
  var form = document.getElementById("leadForm");
  var setStatus = function (msg, isErr) {
    var s = document.getElementById("formStatus");
    if (s) { s.textContent = msg; s.style.color = isErr ? "#cf303f" : "var(--primary)"; }
  };
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var name = String(f.get("name") || "").trim();
      var phone = String(f.get("phone") || "").trim();
      if (!name || !phone) { setStatus("Заполните имя и телефон.", true); return; }
      var body = "Имя: " + name +
        "\nКомпания: " + (f.get("company") || "") +
        "\nТелефон: " + phone +
        "\nСообщение: " + (f.get("message") || "");
      var href = "mailto:info@hattatsu.pro?subject=" +
        encodeURIComponent("Заявка с сайта — " + name) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
      setStatus("Открываем почтовый клиент… Если не открылся — напишите нам в Telegram.", false);
      form.reset();
    });
  }

  // current year
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
