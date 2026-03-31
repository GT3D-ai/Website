(function () {
  var dialog = document.getElementById("deliverables-viewer-3d");
  var iframe = document.getElementById("sketchfab-viewer-frame");
  if (!dialog || !iframe) return;

  var embedSrc =
    typeof window.SKETCHFAB_DELIVERABLES_EMBED_SRC === "string"
      ? window.SKETCHFAB_DELIVERABLES_EMBED_SRC.trim()
      : "";

  dialog.addEventListener("close", function () {
    iframe.removeAttribute("src");
  });

  document.querySelectorAll('.deliverables-card[data-viewer="3d"]').forEach(function (card) {
    card.addEventListener("click", function () {
      dialog.showModal();
      if (embedSrc) {
        iframe.setAttribute("src", embedSrc);
      } else {
        iframe.removeAttribute("src");
        console.warn(
          "example-deliverables/sketchfab-config.js: set window.SKETCHFAB_DELIVERABLES_EMBED_SRC to your Sketchfab embed URL."
        );
      }
    });
  });
})();
