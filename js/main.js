(function () {
  "use strict";

  var navOpen = false;
  var menuBtn = null;
  var navEl = null;
  var headerEl = null;

  function setNavOpen(open) {
    navOpen = open;
    if (!menuBtn || !navEl) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    navEl.classList.toggle("nav--open", open);
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  function closeNav() {
    setNavOpen(false);
  }

  function initNav() {
    menuBtn = document.querySelector("[data-nav-toggle]");
    navEl = document.querySelector("[data-site-nav]");
    headerEl = document.querySelector(".header");
    if (!menuBtn || !navEl) return;

    menuBtn.addEventListener("click", function () {
      setNavOpen(!navOpen);
    });

    navEl.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navOpen) closeNav();
    });

    document.addEventListener("click", function (e) {
      if (!navOpen || !headerEl) return;
      if (headerEl.contains(e.target)) return;
      closeNav();
    });
  }

  function buildMessengerUrl(type, value) {
    if (!value) return "";
    if (type === "telegram") {
      var tg = value.replace(/^@/, "");
      return tg.indexOf("http") === 0 ? tg : "https://t.me/" + tg;
    }
    if (type === "whatsapp") {
      var digits = value.replace(/\D/g, "");
      return digits ? "https://wa.me/" + digits : "";
    }
    if (type === "vk") {
      return value.indexOf("http") === 0 ? value : "https://vk.com/" + value;
    }
    if (type === "max") {
      return value.indexOf("http") === 0 ? value : "";
    }
    return value;
  }

  function renderContacts() {
    if (typeof SITE_CONFIG === "undefined") return;
    var cfg = SITE_CONFIG;

    document.querySelectorAll("[data-site-full-name]").forEach(function (el) {
      if (cfg.fullName) el.textContent = cfg.fullName;
    });

    var messengers = document.querySelector("[data-contact-messengers]");
    if (messengers) {
      messengers.innerHTML = "";
      var items = [
        { key: "telegram", label: "Telegram", type: "telegram" },
        { key: "whatsapp", label: "WhatsApp", type: "whatsapp" },
        { key: "vk", label: "VK", type: "vk" },
        { key: "max", label: "MAX", type: "max" },
      ];
      items.forEach(function (item) {
        var val = cfg[item.key];
        if (!val) return;
        var href = buildMessengerUrl(item.type, val);
        if (!href) return;
        var a = document.createElement("a");
        a.className = "messenger-link";
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = item.label;
        a.addEventListener("click", function () {
          if (window.siteAnalytics) {
            window.siteAnalytics.track(item.key + "_click");
          }
        });
        messengers.appendChild(a);
      });
    }

    var contactsBlock = document.querySelector("[data-contacts-list]");
    if (contactsBlock) {
      contactsBlock.innerHTML = "";
      var hasAny = false;

      if (cfg.email) {
        hasAny = true;
        var emailWrap = document.createElement("div");
        emailWrap.className = "contacts__item";
        emailWrap.innerHTML =
          '<span class="contacts__label">Email</span><a href="mailto:' +
          cfg.email +
          '" data-track="email">' +
          cfg.email +
          "</a>";
        contactsBlock.appendChild(emailWrap);
      }

      if (cfg.phone) {
        hasAny = true;
        var phoneWrap = document.createElement("div");
        phoneWrap.className = "contacts__item";
        phoneWrap.innerHTML =
          '<span class="contacts__label">Телефон</span><a href="tel:' +
          cfg.phone.replace(/[^\d+]/g, "") +
          '" data-track="phone">' +
          cfg.phone +
          "</a>";
        contactsBlock.appendChild(phoneWrap);
      }

      var socialWrap = document.createElement("div");
      socialWrap.className = "contacts__item";
      var socialInner = document.createElement("div");
      socialInner.className = "contacts__social";
      ["telegram", "whatsapp", "vk"].forEach(function (key) {
        var val = cfg[key];
        if (!val) return;
        var href = buildMessengerUrl(key, val);
        if (!href) return;
        hasAny = true;
        var a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = key === "telegram" ? "TG" : key === "whatsapp" ? "WA" : "VK";
        a.setAttribute("aria-label", key);
        socialInner.appendChild(a);
      });
      if (socialInner.children.length) {
        socialWrap.innerHTML = '<span class="contacts__label">Соцсети</span>';
        socialWrap.appendChild(socialInner);
        contactsBlock.appendChild(socialWrap);
      }

      if (!hasAny) {
        contactsBlock.innerHTML =
          '<p class="contacts__placeholder">Контакты будут опубликованы после настройки. Пока можно оставить заявку через форму, когда она будет подключена.</p>';
      }
    }

    if (contactsBlock) {
      document.querySelectorAll("[data-contacts-list] [data-track]").forEach(function (el) {
        el.addEventListener("click", function () {
          var t = el.getAttribute("data-track");
          if (window.siteAnalytics && t) window.siteAnalytics.track(t + "_click");
        });
      });
    }

    document.querySelectorAll("[data-analytics-cta]").forEach(function (el) {
      el.addEventListener("click", function () {
        var ev = el.getAttribute("data-analytics-cta");
        if (window.siteAnalytics && ev) window.siteAnalytics.track(ev);
      });
    });

    document.querySelectorAll("[data-booking-service]").forEach(function (el) {
      el.addEventListener("click", function () {
        var serviceName = el.getAttribute("data-booking-service");
        var select = document.querySelector('.booking__form select[name="service"]');
        if (!select || !serviceName) return;
        Array.from(select.options).forEach(function (opt) {
          if (opt.textContent === serviceName) {
            select.value = opt.value;
          }
        });
      });
    });
  }

  function applyCanonicalAndOg() {
    if (typeof SITE_CONFIG === "undefined" || !SITE_CONFIG.domain) return;
    var path = window.location.pathname.replace(/^\//, "");
    var url = SITE_CONFIG.domain.replace(/\/$/, "") + "/" + path;
    if (path === "" || path === "index.html") {
      url = SITE_CONFIG.domain.replace(/\/$/, "") + "/";
    }

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", url);

    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", url);
  }

  function init() {
    initNav();
    renderContacts();
    applyCanonicalAndOg();

    if (!window.location.hash) {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
