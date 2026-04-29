(function () {
  var measurementId = "G-XW3WS16GZT";

  function loadAnalytics() {
    if (window.__gt3dAnalyticsLoaded) return;
    window.__gt3dAnalyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", measurementId);

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.appendChild(script);
  }

  window.addEventListener(
    "load",
    function () {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadAnalytics, { timeout: 2500 });
      } else {
        window.setTimeout(loadAnalytics, 1500);
      }
    },
    { once: true }
  );
})();
