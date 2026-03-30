/**
 * Scan scheduler admin: session helpers and password check (static site).
 * Before production: set ADMIN_PASSWORD to a strong secret and redeploy.
 */
(function (global) {
  var SESSION_KEY = "gt3d_scheduler_admin";
  var ADMIN_PASSWORD = "changeme";

  global.GT3DScanSchedulerAdmin = {
    SESSION_KEY: SESSION_KEY,

    /** Returns true if this browser tab has an active admin session. */
    hasSession: function () {
      return sessionStorage.getItem(SESSION_KEY) === "ok";
    },

    /** Grant administrative privileges for this tab until the tab is closed or sign out. */
    grantSession: function () {
      sessionStorage.setItem(SESSION_KEY, "ok");
    },

    revokeSession: function () {
      sessionStorage.removeItem(SESSION_KEY);
    },

    authenticate: function (candidate) {
      return typeof candidate === "string" && candidate === ADMIN_PASSWORD;
    },
  };
})(window);
