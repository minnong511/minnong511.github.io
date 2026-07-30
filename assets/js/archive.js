(function () {
  "use strict";
  var list = document.getElementById("archiveList");
  var search = document.getElementById("archiveSearch");
  var category = document.getElementById("archiveCategory");
  var sort = document.getElementById("archiveSort");
  var empty = document.getElementById("archiveEmpty");
  if (!list) return;
  var rows = Array.prototype.slice.call(list.querySelectorAll(".ide-archive-row"));
  var params = new URLSearchParams(window.location.search);
  if (search) search.value = params.get("q") || "";
  if (category) category.value = params.get("category") || "";

  function updateUrl() {
    var next = new URLSearchParams();
    if (search && search.value.trim()) next.set("q", search.value.trim());
    if (category && category.value) next.set("category", category.value);
    var query = next.toString();
    history.replaceState(null, "", window.location.pathname + (query ? "?" + query : ""));
  }
  function apply() {
    var query = search ? search.value.trim().toLowerCase() : "";
    var selectedCategory = category ? category.value : "";
    var shown = 0;
    rows.forEach(function (row) {
      var visible = (!query || String(row.dataset.search || "").indexOf(query) !== -1) && (!selectedCategory || row.dataset.category === selectedCategory);
      row.hidden = !visible;
      if (visible) shown += 1;
    });
    if (empty) empty.hidden = shown > 0;
    updateUrl();
  }
  function sortRows() {
    var mode = sort ? sort.value : "newest";
    rows.sort(function (a, b) {
      if (mode === "title") return (a.dataset.title || "").localeCompare(b.dataset.title || "", "ko");
      var delta = Number(a.dataset.date || 0) - Number(b.dataset.date || 0);
      return mode === "oldest" ? delta : -delta;
    });
    rows.forEach(function (row) { list.appendChild(row); });
    apply();
  }
  if (search) search.addEventListener("input", apply);
  if (category) category.addEventListener("change", apply);
  if (sort) sort.addEventListener("change", sortRows);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && search && document.activeElement === search) { search.value = ""; apply(); }
  });
  apply();
})();
