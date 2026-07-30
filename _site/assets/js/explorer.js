(function () {
  "use strict";
  var tree = document.getElementById("explorerTree");
  var search = document.getElementById("explorerSearch");
  var sort = document.getElementById("explorerSort");
  var empty = document.getElementById("explorerEmpty");
  var count = document.getElementById("explorerCount");
  if (!tree) return;
  var folders = Array.prototype.slice.call(tree.querySelectorAll(".ide-tree-folder"));
  var posts = Array.prototype.slice.call(tree.querySelectorAll(".ide-tree-post"));
  var folderState = {};
  try { folderState = JSON.parse(localStorage.getItem("ide-folders") || "{}"); } catch (error) {}

  function applyFolder(folder, open) {
    folder.classList.toggle("is-open", open);
    folder.setAttribute("aria-expanded", String(open));
    folderState[folder.dataset.category] = open;
  }
  folders.forEach(function (folder) {
    var stored = folderState[folder.dataset.category];
    applyFolder(folder, stored === undefined ? true : Boolean(stored));
    folder.querySelector(".ide-tree-folder-toggle").addEventListener("click", function () {
      applyFolder(folder, !folder.classList.contains("is-open"));
      try { localStorage.setItem("ide-folders", JSON.stringify(folderState)); } catch (error) {}
    });
  });

  function filter(value) {
    var query = String(value || "").trim().toLowerCase();
    var visible = 0;
    folders.forEach(function (folder) {
      var folderMatch = String(folder.dataset.folderName || "").indexOf(query) !== -1;
      var folderPosts = Array.prototype.slice.call(folder.querySelectorAll(".ide-tree-post"));
      var shown = 0;
      folderPosts.forEach(function (post) {
        var match = !query || folderMatch || String(post.dataset.search || "").indexOf(query) !== -1;
        post.hidden = !match;
        if (match) shown += 1;
      });
      folder.hidden = Boolean(query && !folderMatch && !shown);
      if (!folder.hidden) visible += shown;
      if (query && (folderMatch || shown)) applyFolder(folder, true);
    });
    if (empty) empty.hidden = !query || visible > 0;
  }
  if (search) {
    search.addEventListener("input", function () { filter(search.value); });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { search.value = ""; filter(""); search.focus(); }
    });
  }

  function sortPosts(mode) {
    folders.forEach(function (folder) {
      var group = folder.querySelector(".ide-tree-children");
      var items = Array.prototype.slice.call(group.querySelectorAll(".ide-tree-post"));
      items.sort(function (a, b) {
        var aTitle = a.dataset.title || "";
        var bTitle = b.dataset.title || "";
        if (mode === "title") return aTitle.localeCompare(bTitle, "ko");
        var delta = Number(a.dataset.date || 0) - Number(b.dataset.date || 0);
        return mode === "oldest" ? delta : -delta;
      });
      items.forEach(function (item) { group.appendChild(item); });
    });
  }
  if (sort) sort.addEventListener("change", function () { sortPosts(sort.value); });
  var refresh = document.querySelector('[data-explorer-action="refresh"]');
  if (refresh) refresh.addEventListener("click", function () {
    if (search) { search.value = ""; filter(""); }
    if (sort) { sort.value = "newest"; sortPosts("newest"); }
    folders.forEach(function (folder) { applyFolder(folder, true); });
    try { localStorage.setItem("ide-folders", JSON.stringify(folderState)); } catch (error) {}
  });

  tree.addEventListener("keydown", function (event) {
    var current = document.activeElement;
    if (!current || !current.matches(".ide-tree-post")) return;
    var visible = posts.filter(function (post) { return !post.hidden && !post.closest(".ide-tree-folder").hidden; });
    var index = visible.indexOf(current);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      var next = visible[index + (event.key === "ArrowDown" ? 1 : -1)];
      if (next) next.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      current.click();
    }
  });
  if (count) count.textContent = posts.length + " POSTS";
})();
