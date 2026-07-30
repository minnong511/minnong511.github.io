(function () {
  "use strict";
  var app = document.getElementById("ideApp");
  if (!app) return;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("ide-panel-widths") || "{}"); } catch (error) {}
  if (saved.explorer) app.style.setProperty("--explorer-width", saved.explorer + "px");
  if (saved.context) app.style.setProperty("--context-width", saved.context + "px");
  document.querySelectorAll("[data-resize-panel]").forEach(function (handle) {
    handle.addEventListener("pointerdown", function (event) {
      if (window.innerWidth < 1200) return;
      event.preventDefault();
      var panel = handle.dataset.resizePanel;
      var startX = event.clientX;
      var start = panel === "explorer" ? parseInt(getComputedStyle(app).getPropertyValue("--explorer-width"), 10) : parseInt(getComputedStyle(app).getPropertyValue("--context-width"), 10);
      function move(moveEvent) {
        var delta = moveEvent.clientX - startX;
        var next = panel === "explorer" ? start + delta : start - delta;
        next = Math.max(220, Math.min(420, next));
        app.style.setProperty("--" + panel + "-width", next + "px");
      }
      function stop() {
        var value = parseInt(getComputedStyle(app).getPropertyValue("--" + panel + "-width"), 10);
        saved[panel] = value;
        try { localStorage.setItem("ide-panel-widths", JSON.stringify(saved)); } catch (error) {}
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
    });
  });
})();
