(function () {
  "use strict";
  var root = document.documentElement;
  var toggle = document.getElementById("ideThemeToggle");
  var fontSizeKey = "minnong-font-size";
  function setTheme(theme, persist) {
    var next = theme === "light" ? "light" : "dark";
    root.dataset.theme = next;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === "light" ? "#f2f4f6" : "#090a0c";
    if (persist) { try { localStorage.setItem("minnong-theme", next); } catch (error) {} }
  }
  if (toggle) toggle.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark", true); });
  setTheme(root.dataset.theme || "dark", false);

  function setFontSize(size, persist) {
    var next = ["small", "medium", "large"].indexOf(size) !== -1 ? size : "medium";
    root.dataset.fontSize = next;
    document.querySelectorAll("[data-font-size-option]").forEach(function (option) {
      option.checked = option.dataset.fontSizeOption === next;
    });
    if (persist) { try { localStorage.setItem(fontSizeKey, next); } catch (error) {} }
  }

  document.addEventListener("change", function (event) {
    var option = event.target.closest("[data-font-size-option]");
    if (option) setFontSize(option.dataset.fontSizeOption, true);
  });
  document.addEventListener("ide:document-change", function () { setFontSize(root.dataset.fontSize, false); });
  var savedFontSize = "medium";
  try { savedFontSize = localStorage.getItem(fontSizeKey) || savedFontSize; } catch (error) {}
  setFontSize(savedFontSize, false);
})();
