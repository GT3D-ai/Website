(function () {
  var dialog = document.getElementById("deliverables-viewer-3d");
  var iframe = document.getElementById("sketchfab-viewer-frame");
  var rvtPanel = document.getElementById("deliverables-rvt-panel");
  var rvtLink = document.getElementById("deliverables-rvt-download");
  var objPanel = document.getElementById("deliverables-obj-viewer");
  if (!dialog || !iframe) return;

  var embedSrc =
    typeof window.SKETCHFAB_DELIVERABLES_EMBED_SRC === "string"
      ? window.SKETCHFAB_DELIVERABLES_EMBED_SRC.trim()
      : "";
  var rvtUrl =
    typeof window.DELIVERABLES_RVT_URL === "string" ? window.DELIVERABLES_RVT_URL.trim() : "";
  var modelUrl =
    (typeof window.DELIVERABLES_MODEL_URL === "string" && window.DELIVERABLES_MODEL_URL.trim()) ||
    (typeof window.DELIVERABLES_OBJ_URL === "string" ? window.DELIVERABLES_OBJ_URL.trim() : "");

  function setMode() {
    var useObj = !!modelUrl;
    var useSketchfab = !!embedSrc && !useObj;
    var useRvt = !!rvtUrl && !useObj && !useSketchfab;
    iframe.hidden = !useSketchfab;
    if (rvtPanel) rvtPanel.hidden = !useRvt;
    if (objPanel) objPanel.hidden = !useObj;
    if (rvtLink && rvtUrl) {
      rvtLink.setAttribute("href", rvtUrl);
      rvtLink.setAttribute("download", "sample.rvt");
    }
  }

  dialog.addEventListener("close", function () {
    iframe.removeAttribute("src");
    if (typeof window.__deliverablesDisposeObjViewer === "function") {
      window.__deliverablesDisposeObjViewer();
    }
  });

  document.querySelectorAll('.deliverables-card[data-viewer="3d"]').forEach(function (card) {
    card.addEventListener("click", function () {
      setMode();
      dialog.showModal();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (embedSrc && !modelUrl) {
            iframe.setAttribute("src", embedSrc);
          } else {
            iframe.removeAttribute("src");
          }
          // Defer WebGL init past modal layout + paint (avoids 0×0 canvas on some browsers).
          if (modelUrl && typeof window.__deliverablesInitObjViewer === "function") {
            setTimeout(function () {
              window.__deliverablesInitObjViewer();
            }, 0);
          }
          if (!embedSrc && !rvtUrl && !modelUrl) {
            console.warn(
              "example-deliverables/sketchfab-config.js: set DELIVERABLES_MODEL_URL (or DELIVERABLES_OBJ_URL), SKETCHFAB_DELIVERABLES_EMBED_SRC, and/or DELIVERABLES_RVT_URL."
            );
          }
        });
      });
    });
  });
})();
