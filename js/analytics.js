/**
 * Google Analytics 4 (gtag.js)
 * Replace GA4_MEASUREMENT_ID with your ID from Analytics → Admin → Data streams → Web → Measurement ID (G-xxxxxxxxxx).
 */
(function () {
  var GA4_MEASUREMENT_ID = "G-XXXXXXXXXX";

  if (!GA4_MEASUREMENT_ID || /XXXX/i.test(GA4_MEASUREMENT_ID)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_MEASUREMENT_ID);
  document.head.appendChild(s);
})();
