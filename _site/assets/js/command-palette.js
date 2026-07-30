(function () {
  "use strict";
  var palette = document.getElementById("commandPalette");
  var input = document.getElementById("paletteInput");
  var results = document.getElementById("paletteResults");
  var recentRoot = document.getElementById("paletteRecent");
  if (!palette || !input || !results) return;
  var selected = 0;
  var items = [];
  var commands = [
    { title: "홈 열기", detail: "workspace", icon: "ri-home-5-line", url: "/" },
    { title: "전체 게시물 열기", detail: "archive", icon: "ri-file-list-3-line", url: "/archive/" },
    { title: "카테고리 탐색", detail: "explorer", icon: "ri-folder-3-line", action: "explorer" },
    { title: "태그 열기", detail: "tags", icon: "ri-price-tag-3-line", url: "/tags/" },
    { title: "라이트 테마 전환", detail: "appearance", icon: "ri-sun-line", action: "theme" },
    { title: "북마크 안내", detail: "local browser feature", icon: "ri-bookmark-3-line", action: "bookmarks" }
  ];
  function openPalette(query) {
    palette.hidden = false;
    selected = 0;
    input.value = query || "";
    render();
    window.requestAnimationFrame(function () { input.focus(); input.select(); });
  }
  function closePalette() { palette.hidden = true; }
  function loadPosts() {
    return fetch((document.body.dataset.baseurl || "") + "/search.json").then(function (response) { return response.ok ? response.json() : []; }).catch(function () { return []; });
  }
  function render() {
    var query = input.value.trim().toLowerCase();
    var all = commands.slice();
    document.querySelectorAll(".ide-tree-folder").forEach(function (folder) { all.push({ title: folder.dataset.folderName, detail: "category", icon: "ri-folder-3-line", url: "/archive/?category=" + folder.dataset.category }); });
    try { JSON.parse(localStorage.getItem("ide-bookmarks") || "[]").forEach(function (item) { all.push({ title: item.title, detail: "bookmark", icon: "ri-bookmark-3-line", url: item.url }); }); } catch (error) {}
    items = all.filter(function (item) { return !query || (item.title + " " + item.detail).toLowerCase().indexOf(query) !== -1; });
    results.replaceChildren();
    if (!items.length) { var empty = document.createElement("p"); empty.className = "ide-panel-empty"; empty.textContent = "검색 결과가 없습니다."; results.appendChild(empty); renderRecent(); return; }
    items.slice(0, 12).forEach(function (item, index) {
      var button = document.createElement("button"); button.type = "button"; button.className = "ide-palette-result" + (index === selected ? " is-selected" : ""); button.setAttribute("role", "option");
      button.innerHTML = '<i class="' + item.icon + '" aria-hidden="true"></i><span></span><small></small>';
      button.querySelector("span").textContent = item.title; button.querySelector("small").textContent = item.detail;
      button.addEventListener("mouseenter", function () { selected = index; render(); }); button.addEventListener("click", function () { execute(item); }); results.appendChild(button);
    });
    renderRecent();
  }
  function renderRecent() {
    if (!recentRoot) return;
    var recent = [{ title: "Minnong's Study Log", detail: window.location.host || "workspace", icon: "ri-global-line", url: "/" }];
    try {
      JSON.parse(localStorage.getItem("minnong-tabs-v2") || "[]").forEach(function (item) { recent.push({ title: item.title, detail: "recently opened", icon: "ri-markdown-line", url: item.url }); });
    } catch (error) {}
    var unique = [];
    recent.forEach(function (item) { if (!unique.some(function (saved) { return saved.url === item.url; })) unique.push(item); });
    recentRoot.replaceChildren();
    unique.slice(0, 7).forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ide-palette-recent-item";
      button.innerHTML = '<i class="' + item.icon + '" aria-hidden="true"></i><span></span><small></small>';
      button.querySelector("span").textContent = item.title;
      button.querySelector("small").textContent = item.detail;
      button.addEventListener("click", function () { window.location.href = (document.body.dataset.baseurl || "") + item.url; });
      recentRoot.appendChild(button);
    });
  }
  function execute(item) {
    if (item.url) { window.location.href = (document.body.dataset.baseurl || "") + item.url; return; }
    closePalette();
    if (item.action === "explorer") {
      var explorerButton = document.querySelector('[data-activity-panel="explorer"]');
      if (explorerButton) explorerButton.click();
      else document.getElementById("ideApp").classList.add("explorer-open");
    }
    if (item.action === "theme") document.getElementById("ideThemeToggle").click();
    if (item.action === "bookmarks") {
      var saved = [];
      try { saved = JSON.parse(localStorage.getItem("ide-bookmarks") || "[]"); } catch (error) {}
      if (saved.length) openPalette("bookmark");
      else window.alert("저장된 북마크가 없습니다. 게시물의 INFO 패널에서 문서를 북마크할 수 있습니다.");
    }
  }
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-palette]")) { event.preventDefault(); openPalette(event.target.closest("[data-open-palette]").dataset.openPalette === "search" ? "" : ""); }
    if (event.target.closest("#ideAddressbar")) openPalette("");
  });
  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && ["k", "p"].indexOf(event.key.toLowerCase()) !== -1) { event.preventDefault(); openPalette(""); return; }
    if (palette.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); closePalette(); }
    if (event.key === "ArrowDown") { event.preventDefault(); selected = Math.min(selected + 1, Math.max(0, items.length - 1)); render(); }
    if (event.key === "ArrowUp") { event.preventDefault(); selected = Math.max(0, selected - 1); render(); }
    if (event.key === "Enter" && items[selected]) { event.preventDefault(); execute(items[selected]); }
  });
  input.addEventListener("input", function () { selected = 0; render(); });
  palette.addEventListener("click", function (event) { if (event.target === palette) closePalette(); });
  loadPosts().then(function (posts) {
    posts.forEach(function (post) { commands.push({ title: post.title, detail: (post.categories || "posts") + " · " + (post.date || ""), icon: "ri-markdown-line", url: post.url }); });
  });
})();
