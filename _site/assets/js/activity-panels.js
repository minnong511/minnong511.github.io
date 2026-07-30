(function () {
  "use strict";
  var app = document.getElementById("ideApp");
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-activity-panel]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-sidebar-panel]"));
  if (!app || !buttons.length || !panels.length) return;

  var viewKey = "ide-sidebar-view";
  var activeView = "explorer";
  try { activeView = localStorage.getItem(viewKey) || activeView; } catch (error) {}
  if (!panels.some(function (panel) { return panel.dataset.sidebarPanel === activeView; })) activeView = "explorer";

  function setOpen(open) {
    app.classList.toggle("sidebar-collapsed", !open);
    app.classList.toggle("explorer-open", open);
  }

  function showPanel(name, open) {
    var selected = panels.some(function (panel) { return panel.dataset.sidebarPanel === name; });
    if (!selected) return;
    activeView = name;
    try { localStorage.setItem(viewKey, name); } catch (error) {}
    panels.forEach(function (panel) {
      var active = panel.dataset.sidebarPanel === name;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    buttons.forEach(function (button) {
      var active = button.dataset.activityPanel === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (open !== false) setOpen(true);
    if (name === "search" && searchInput) window.requestAnimationFrame(function () { searchInput.focus(); });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.dataset.activityPanel;
      var isSameView = name === activeView;
      if (isSameView && !app.classList.contains("sidebar-collapsed")) setOpen(false);
      else showPanel(name, true);
    });
  });

  document.querySelectorAll("[data-toggle-panel='explorer']").forEach(function (button) {
    button.addEventListener("click", function () { setOpen(app.classList.contains("sidebar-collapsed")); });
  });

  var searchInput = document.getElementById("sidebarSearchInput");
  var searchResults = document.getElementById("sidebarSearchResults");
  var searchPosts = [];
  function renderSearch() {
    if (!searchInput || !searchResults) return;
    var query = searchInput.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if (!query) {
      var hint = document.createElement("p");
      hint.className = "ide-panel-empty";
      hint.textContent = "제목, 카테고리, 본문으로 검색하세요.";
      searchResults.appendChild(hint);
      return;
    }
    var matches = searchPosts.filter(function (post) {
      return [post.title, post.categories, post.tags, post.excerpt, post.content].join(" ").toLowerCase().indexOf(query) !== -1;
    });
    if (!matches.length) {
      var empty = document.createElement("p");
      empty.className = "ide-panel-empty";
      empty.textContent = "검색 결과가 없습니다.";
      searchResults.appendChild(empty);
      return;
    }
    matches.slice(0, 30).forEach(function (post) {
      var link = document.createElement("a");
      link.className = "ide-sidebar-result";
      link.href = post.url;
      link.innerHTML = '<i class="ri-markdown-line" aria-hidden="true"></i>';
      var title = document.createElement("span");
      title.textContent = post.title;
      var detail = document.createElement("small");
      detail.textContent = (post.categories || "workspace") + " · " + (post.date || "");
      title.appendChild(detail);
      link.appendChild(title);
      searchResults.appendChild(link);
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", renderSearch);
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { searchInput.value = ""; renderSearch(); searchInput.focus(); }
    });
  }
  fetch((document.body.dataset.baseurl || "") + "/search.json")
    .then(function (response) { return response.ok ? response.json() : []; })
    .then(function (posts) { searchPosts = Array.isArray(posts) ? posts : []; renderSearch(); })
    .catch(function () { renderSearch(); });

  showPanel(activeView, false);
})();
