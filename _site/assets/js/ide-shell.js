(function () {
  "use strict";
  var app = document.getElementById("ideApp");
  if (!app) return;
  var contextPanel = document.getElementById("contextPanel");
  var contextToggle = document.getElementById("ideContextToggle");
  var mobileContextToggle = document.querySelector("[data-toggle-context]");
  var contextBackdrop = document.getElementById("contextBackdrop");
  var mobileMenu = document.getElementById("ideMobileMenu");
  var explorerBackdrop = document.getElementById("explorerBackdrop");
  var mobileViewport = window.matchMedia("(max-width: 767px)");
  var contextVisible = true;
  try { contextVisible = localStorage.getItem("ide-context-visible") !== "false"; } catch (error) {}

  function setContextVisible(visible) {
    contextVisible = Boolean(visible);
    app.classList.toggle("context-collapsed", !contextVisible);
    if (contextPanel && !contextVisible) contextPanel.classList.remove("mobile-open");
    if (contextBackdrop && !contextVisible) contextBackdrop.hidden = true;
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

  function setMobileContext(open, restoreFocus) {
    var isOpen = Boolean(open) && mobileViewport.matches;
    if (isOpen && !contextVisible) setContextVisible(true);
    if (contextPanel) contextPanel.classList.toggle("mobile-open", isOpen);
    if (contextBackdrop) contextBackdrop.hidden = !isOpen;
    if (mobileContextToggle) {
      mobileContextToggle.setAttribute("aria-expanded", String(isOpen));
      mobileContextToggle.setAttribute("aria-label", isOpen ? "목차 닫기" : "목차 열기");
    }
    if (!isOpen && restoreFocus && mobileViewport.matches && mobileContextToggle) mobileContextToggle.focus();
  }

  function syncExplorerState(open, restoreFocus) {
    var isMobile = mobileViewport.matches;
    var isOpen = Boolean(open) && isMobile;
    if (isMobile) {
      app.classList.toggle("sidebar-collapsed", !isOpen);
      app.classList.toggle("explorer-open", isOpen);
    }
    if (mobileMenu) mobileMenu.setAttribute("aria-expanded", String(isOpen));
    if (explorerBackdrop) explorerBackdrop.hidden = !isOpen;
    document.body.classList.toggle("ide-explorer-lock", isOpen);
    if (!isOpen && restoreFocus && isMobile && mobileMenu) mobileMenu.focus();
  }

  function syncViewportState() {
    if (mobileViewport.matches) {
      syncExplorerState(false, false);
      setMobileContext(false, false);
      return;
    }
    app.classList.remove("sidebar-collapsed", "explorer-open");
    if (mobileMenu) mobileMenu.setAttribute("aria-expanded", "false");
    if (explorerBackdrop) explorerBackdrop.hidden = true;
    setMobileContext(false, false);
    document.body.classList.remove("ide-explorer-lock");
  }

  if (mobileMenu) mobileMenu.addEventListener("click", function () {
    var open = !app.classList.contains("explorer-open");
    syncExplorerState(open, false);
  });
  if (explorerBackdrop) explorerBackdrop.addEventListener("click", function () { syncExplorerState(false, true); });
  if (contextBackdrop) contextBackdrop.addEventListener("click", function () { setMobileContext(false, true); });
  document.addEventListener("click", function (event) {
    if (mobileViewport.matches && app.classList.contains("explorer-open") && event.target.closest(".ide-tree-post, .ide-sidebar-result")) {
      syncExplorerState(false, true);
    }
  });
  document.addEventListener("ide:sidebar-state", function (event) {
    var open = event.detail && event.detail.open;
    syncExplorerState(open, !open);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileViewport.matches && contextPanel && contextPanel.classList.contains("mobile-open")) {
      event.preventDefault();
      setMobileContext(false, true);
      return;
    }
    if (event.key === "Escape" && mobileViewport.matches && app.classList.contains("explorer-open")) {
      event.preventDefault();
      syncExplorerState(false, true);
    }
  });
  var handleViewportChange = function () { syncViewportState(); };
  if (mobileViewport.addEventListener) mobileViewport.addEventListener("change", handleViewportChange);
  else if (mobileViewport.addListener) mobileViewport.addListener(handleViewportChange);
  syncViewportState();
  document.querySelectorAll("[data-toggle-theme]").forEach(function (button) {
    button.addEventListener("click", function () { var themeButton = document.getElementById("ideThemeToggle"); if (themeButton) themeButton.click(); });
  });
  document.querySelectorAll("[data-history]").forEach(function (button) {
    button.addEventListener("click", function () {
      var direction = button.dataset.history === "back" ? "back" : "forward";
      if (typeof window.history[direction] === "function") window.history[direction]();
    });
  });
  var fullscreen = document.getElementById("ideFullscreen");
  function syncFullscreenState() {
    if (!fullscreen) return;
    var active = Boolean(document.fullscreenElement);
    fullscreen.setAttribute("aria-label", active ? "전체 화면 닫기" : "전체 화면");
    fullscreen.title = active ? "전체 화면 닫기" : "전체 화면";
    fullscreen.innerHTML = '<i class="' + (active ? "ri-fullscreen-exit-line" : "ri-fullscreen-line") + '" aria-hidden="true"></i>';
  }
  if (fullscreen) {
    var fullscreenSupported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen && document.exitFullscreen);
    fullscreen.hidden = !fullscreenSupported;
    if (fullscreenSupported) {
      fullscreen.addEventListener("click", function () {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
        else document.exitFullscreen().catch(function () {});
      });
      document.addEventListener("fullscreenchange", syncFullscreenState);
      syncFullscreenState();
    }
  }
  if (contextToggle) contextToggle.addEventListener("click", function () { setContextVisible(!contextVisible); });
  document.addEventListener("ide:document-change", function () { setContextVisible(contextVisible); setMobileContext(false, false); });

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
    if (mobileContext && contextPanel) {
      setMobileContext(!contextPanel.classList.contains("mobile-open"), false);
      return;
    }
    if (mobileViewport.matches && contextPanel && contextPanel.classList.contains("mobile-open")) {
      if (event.target.closest("#postOutline a")) setMobileContext(false, false);
      else if (!event.target.closest("#contextPanel")) setMobileContext(false, true);
    }
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
