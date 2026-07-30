(function () {
  "use strict";
  var root = document.documentElement;
  var toggle = document.getElementById("ideThemeToggle");
  function setTheme(theme, persist) {
    var next = theme === "light" ? "light" : "dark";
    root.dataset.theme = next;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === "light" ? "#f2f4f6" : "#090a0c";
    if (persist) { try { localStorage.setItem("minnong-theme", next); } catch (error) {} }
  }
  if (toggle) toggle.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark", true); });
  setTheme(root.dataset.theme || "dark", false);
})();
