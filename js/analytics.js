(function () {
  "use strict";

  function track(eventName, params) {
    if (typeof SITE_CONFIG === "undefined") return;
    var id = SITE_CONFIG.yandexMetrikaId;
    if (!id || typeof window.ym !== "function") return;
    try {
      window.ym(Number(id), "reachGoal", eventName, params || {});
    } catch (e) {
      /* ignore */
    }
  }

  function loadMetrika() {
    if (typeof SITE_CONFIG === "undefined") return;
    var id = SITE_CONFIG.yandexMetrikaId;
    if (!id) return;

    window.ym =
      window.ym ||
      function () {
        (window.ym.a = window.ym.a || []).push(arguments);
      };
    window.ym.l = Date.now();

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);

    window.ym(Number(id), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
  }

  window.siteAnalytics = { track: track, loadMetrika: loadMetrika };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadMetrika);
  } else {
    loadMetrika();
  }
})();
