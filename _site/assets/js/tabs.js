(function () {
  "use strict";
  var root = document.getElementById("editorTabs");
  if (!root) return;
  var app = document.getElementById("ideApp");
  var empty = document.getElementById("tabsEmpty");
  var body = document.body;
  var currentUrl = normalizeUrl(body.dataset.pageUrl || window.location.pathname);
  var currentTitle = body.dataset.pageTitle || "workspace";
  var key = "minnong-tabs-v2";
  var tabs = [];

  try { tabs = JSON.parse(localStorage.getItem(key) || "[]"); } catch (error) { tabs = []; }
  tabs = Array.isArray(tabs) ? tabs.filter(function (tab) { return tab && tab.url; }).slice(-6) : [];

  function normalizeUrl(url) {
    try {
      var parsed = new URL(url, window.location.href);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (error) {
      return String(url || "/");
    }
  }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(tabs.slice(-6))); } catch (error) {}
  }

  function addTab(tab) {
    var normalized = normalizeUrl(tab.url);
    var existing = tabs.filter(function (item) { return normalizeUrl(item.url) === normalized; })[0];
    if (existing) {
      if (tab.title) existing.title = tab.title;
      return { url: normalized, title: existing.title };
    }
    var next = { url: normalized, title: tab.title || "untitled" };
    tabs.push(next);
    tabs = tabs.slice(-6);
    save();
    return next;
  }

  function getLinkTitle(link) {
    var label = link.querySelector("strong, .ide-sidebar-result > span, .ide-tree-post > span");
    if (label && label.firstChild && label.firstChild.nodeType === 3) return label.firstChild.textContent.trim();
    return label ? label.textContent.trim() : link.textContent.trim();
  }

  function render() {
    root.querySelectorAll(".ide-tab").forEach(function (tab) { tab.remove(); });
    if (empty) empty.hidden = tabs.length > 0;
    root.classList.toggle("is-empty", tabs.length === 0);
    tabs.forEach(function (tab) {
      var item = document.createElement("div");
      var active = normalizeUrl(tab.url) === currentUrl;
      item.className = "ide-tab" + (active ? " is-active" : "");
      item.setAttribute("role", "tab");
      item.setAttribute("aria-selected", String(active));
      item.title = tab.title;
      item.innerHTML = '<i class="ri-markdown-line" aria-hidden="true"></i><span></span><small aria-hidden="true">●</small><button type="button" aria-label="탭 닫기">×</button>';
      item.querySelector("span").textContent = tab.title;
      item.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        openDocument(tab, true);
      });
      item.addEventListener("auxclick", function (event) { if (event.button === 1) close(tab.url); });
      item.querySelector("button").addEventListener("click", function (event) { event.stopPropagation(); close(tab.url); });
      root.appendChild(item);
    });
  }

  function updateDocument(parsed, targetUrl) {
    var nextArea = parsed.querySelector(".ide-document-area");
    var currentArea = document.querySelector(".ide-document-area");
    if (!nextArea || !currentArea) throw new Error("문서 영역을 찾을 수 없습니다.");
    currentArea.innerHTML = nextArea.innerHTML;

    var nextBreadcrumbs = parsed.querySelector(".ide-breadcrumbs");
    var currentBreadcrumbs = document.querySelector(".ide-breadcrumbs");
    if (nextBreadcrumbs && currentBreadcrumbs) currentBreadcrumbs.innerHTML = nextBreadcrumbs.innerHTML;

    var nextContext = parsed.querySelector("#contextPanel");
    var currentContext = document.getElementById("contextPanel");
    if (nextContext && currentContext) currentContext.innerHTML = nextContext.innerHTML;

    var nextStatus = parsed.querySelector(".ide-statusbar");
    var currentStatus = document.querySelector(".ide-statusbar");
    if (nextStatus && currentStatus) currentStatus.innerHTML = nextStatus.innerHTML;

    var nextBody = parsed.body;
    currentUrl = normalizeUrl(targetUrl);
    currentTitle = (nextBody && nextBody.dataset.pageTitle) || currentTitle;
    body.dataset.pageUrl = currentUrl;
    body.dataset.pageTitle = currentTitle;
    body.dataset.pageLayout = (nextBody && nextBody.dataset.pageLayout) || "post";
    document.title = parsed.title || currentTitle;
    var main = document.querySelector(".ide-main");
    if (main) main.scrollTo({ top: 0, behavior: "auto" });
    if (app) { app.classList.remove("is-document-loading"); app.setAttribute("aria-busy", "false"); }
    document.dispatchEvent(new CustomEvent("ide:document-change", { detail: { url: currentUrl, title: currentTitle } }));
  }

  function openDocument(tab, pushHistory) {
    var targetUrl = normalizeUrl(tab.url);
    if (targetUrl === currentUrl) { render(); return Promise.resolve(); }
    if (app) { app.classList.add("is-document-loading"); app.setAttribute("aria-busy", "true"); }
    return fetch(targetUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (response) { if (!response.ok) throw new Error("문서를 불러오지 못했습니다."); return response.text(); })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, "text/html");
        if (pushHistory) window.history.pushState({ ideDocument: true }, "", targetUrl);
        updateDocument(parsed, targetUrl);
        var savedTab = addTab({ url: targetUrl, title: (parsed.body && parsed.body.dataset.pageTitle) || tab.title });
        if (savedTab && savedTab.title) currentTitle = savedTab.title;
        render();
      })
      .catch(function () {
        if (app) { app.classList.remove("is-document-loading"); app.setAttribute("aria-busy", "false"); }
        if (window.console && console.error) console.error("문서를 불러오지 못했습니다:", targetUrl);
      });
  }

  function close(url) {
    var normalized = normalizeUrl(url);
    var wasCurrent = normalized === currentUrl;
    tabs = tabs.filter(function (item) { return normalizeUrl(item.url) !== normalized; });
    save();
    if (wasCurrent && tabs[0]) openDocument(tabs[0], true);
    else render();
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a.ide-tree-post, a.ide-archive-row, a.ide-related-list a, a.ide-sidebar-result, a.ide-document-navigation a");
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;
    event.preventDefault();
    var tab = addTab({ url: link.getAttribute("href"), title: getLinkTitle(link) });
    openDocument(tab, true);
  });
  window.addEventListener("popstate", function () {
    var targetUrl = normalizeUrl(window.location.pathname + window.location.search + window.location.hash);
    var tab = tabs.filter(function (item) { return normalizeUrl(item.url) === targetUrl; })[0] || { url: targetUrl, title: "workspace" };
    openDocument(tab, false);
  });
  render();
})();
