(function () {
  "use strict";
  var app = document.getElementById("ideApp");
  if (!app) return;
  var contextPanel = document.getElementById("contextPanel");
  var contextToggle = document.getElementById("ideContextToggle");
  var contextVisible = true;
  try { contextVisible = localStorage.getItem("ide-context-visible") !== "false"; } catch (error) {}

  function setContextVisible(visible) {
    contextVisible = Boolean(visible);
    app.classList.toggle("context-collapsed", !contextVisible);
    if (contextPanel && !contextVisible) contextPanel.classList.remove("mobile-open");
    if (contextToggle) {
      contextToggle.setAttribute("aria-expanded", String(contextVisible));
      contextToggle.setAttribute("aria-label", contextVisible ? "목차 패널 숨기기" : "목차 패널 보이기");
      contextToggle.title = contextVisible ? "목차 패널 숨기기" : "목차 패널 보이기";
    }
    document.querySelectorAll("[data-toggle-context-panel]").forEach(function (button) {
      button.setAttribute("aria-label", contextVisible ? "목차 패널 숨기기" : "목차 패널 보이기");
      button.title = contextVisible ? "목차 패널 숨기기" : "목차 패널 보이기";
    });
    try { localStorage.setItem("ide-context-visible", String(contextVisible)); } catch (error) {}
  }
  setContextVisible(contextVisible);

  var mobileMenu = document.getElementById("ideMobileMenu");
  if (mobileMenu) mobileMenu.addEventListener("click", function () {
    var open = app.classList.contains("sidebar-collapsed") || !app.classList.contains("explorer-open");
    app.classList.toggle("sidebar-collapsed", !open);
    app.classList.toggle("explorer-open", open);
    mobileMenu.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll("[data-toggle-theme]").forEach(function (button) {
    button.addEventListener("click", function () { var themeButton = document.getElementById("ideThemeToggle"); if (themeButton) themeButton.click(); });
  });
  document.querySelectorAll("[data-history]").forEach(function (button) {
    button.addEventListener("click", function () { window.history[button.dataset.history === "back" ? "back" : "forward"](); });
  });
  var fullscreen = document.getElementById("ideFullscreen");
  if (fullscreen) fullscreen.addEventListener("click", function () { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen(); });
  if (contextToggle) contextToggle.addEventListener("click", function () { setContextVisible(!contextVisible); });
  document.addEventListener("ide:document-change", function () { setContextVisible(contextVisible); });

  document.addEventListener("click", function (event) {
    var contextTab = event.target.closest("[data-context-tab]");
    if (contextTab) {
      var name = contextTab.dataset.contextTab;
      document.querySelectorAll("[data-context-tab]").forEach(function (item) { item.classList.toggle("is-active", item === contextTab); item.setAttribute("aria-selected", String(item === contextTab)); });
      document.querySelectorAll("[data-context-view]").forEach(function (view) { view.hidden = view.dataset.contextView !== name; view.classList.toggle("is-active", view.dataset.contextView === name); });
      return;
    }
    var contextCollapse = event.target.closest("[data-toggle-context-panel]");
    if (contextCollapse) { setContextVisible(!contextVisible); return; }
    var mobileContext = event.target.closest("[data-toggle-context]");
    if (mobileContext && contextPanel) { contextPanel.classList.toggle("mobile-open"); return; }
    var themeControl = event.target.closest("[data-toggle-theme]");
    if (themeControl) return;
    var copyButton = event.target.closest("[data-copy-link]");
    if (copyButton) {
      var value = copyButton.dataset.copyLink || window.location.href;
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(value).then(function () { copyButton.lastChild.textContent = " Copied"; });
      else window.prompt("Copy page link", value);
      return;
    }
    var bookmarkButton = event.target.closest("[data-bookmark-page]");
    if (bookmarkButton) {
      var bookmarkKey = "ide-bookmarks";
      var saved = [];
      try { saved = JSON.parse(localStorage.getItem(bookmarkKey) || "[]"); } catch (error) {}
      var url = bookmarkButton.dataset.bookmarkPage;
      var exists = saved.some(function (item) { return item.url === url; });
      var next = saved.filter(function (item) { return item.url !== url; });
      if (!exists) next.unshift({ url: url, title: bookmarkButton.dataset.bookmarkTitle });
      try { localStorage.setItem(bookmarkKey, JSON.stringify(next.slice(0, 30))); } catch (error) {}
      var label = bookmarkButton.querySelector("span");
      if (label) label.textContent = exists ? "Bookmark document" : "Bookmarked";
      bookmarkButton.classList.toggle("is-saved", !exists);
      return;
    }
    var scrollButton = event.target.closest("[data-scroll-top]");
    if (scrollButton) {
      var main = document.querySelector(".ide-main");
      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
})();
