(function () {
  "use strict";

  var baseUrl = (document.body && document.body.dataset && document.body.dataset.baseurl) || "";
  var searchLayer = document.getElementById("searchLayer");
  var searchButtons = Array.prototype.slice.call(document.querySelectorAll(".toggle-search"));
  var searchClose = searchLayer ? searchLayer.querySelector(".search-close") : null;
  var searchInput = searchLayer ? searchLayer.querySelector(".search-input") : null;
  var liveResults = document.getElementById("searchLiveResults");
  var searchPageResults = document.getElementById("search-page-results");
  var searchIndex = null;
  var lastTrigger = null;

  function normalize(text) {
    return String(text || "").toLowerCase();
  }

  function getScore(item, query) {
    var q = normalize(query);
    var score = 0;
    if (normalize(item.title).indexOf(q) !== -1) score += 5;
    if (normalize(item.categories).indexOf(q) !== -1) score += 3;
    if (normalize(item.tags).indexOf(q) !== -1) score += 3;
    if (normalize(item.excerpt).indexOf(q) !== -1) score += 2;
    if (normalize(item.content).indexOf(q) !== -1) score += 1;
    return score;
  }

  function searchItems(query) {
    if (!query || !searchIndex) return [];
    return searchIndex
      .map(function (item) { return { item: item, score: getScore(item, query) }; })
      .filter(function (result) { return result.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (result) { return result.item; });
  }

  function appendTextElement(parent, tagName, text) {
    var element = document.createElement(tagName);
    element.textContent = text || "";
    parent.appendChild(element);
    return element;
  }

  function createResultLink(item) {
    var link = document.createElement("a");
    link.className = "search-result-item";
    link.href = item.url;
    appendTextElement(link, "strong", item.title);
    appendTextElement(link, "time", item.date);
    appendTextElement(link, "span", String(item.excerpt || "").slice(0, 110));
    return link;
  }

  function renderEmpty(target, message) {
    var empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = message;
    target.appendChild(empty);
  }

  function renderLiveResults(query) {
    if (!liveResults) return;
    liveResults.replaceChildren();
    if (!query) return;
    var results = searchItems(query).slice(0, 6);
    if (!results.length) {
      renderEmpty(liveResults, "검색 결과가 없습니다.");
      return;
    }
    results.forEach(function (item) { liveResults.appendChild(createResultLink(item)); });
  }

  function renderSearchPage(query) {
    if (!searchPageResults) return;
    searchPageResults.replaceChildren();
    if (!query) {
      renderEmpty(searchPageResults, "검색어를 입력해 주세요.");
      return;
    }
    var results = searchItems(query);
    if (!results.length) {
      renderEmpty(searchPageResults, "검색 결과가 없습니다.");
      return;
    }
    results.forEach(function (item) { searchPageResults.appendChild(createResultLink(item)); });
  }

  function fetchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch(baseUrl + "/search.json")
      .then(function (response) {
        if (!response.ok) throw new Error("검색 색인을 불러오지 못했습니다.");
        return response.json();
      })
      .then(function (data) {
        searchIndex = Array.isArray(data) ? data : [];
        return searchIndex;
      })
      .catch(function () {
        searchIndex = [];
        return searchIndex;
      });
  }

  function setButtonState(open) {
    searchButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", String(open));
    });
  }

  function setBackgroundInert(open) {
    Array.prototype.slice.call(document.querySelectorAll(".site-header, .site-main, .site-footer")).forEach(function (element) {
      element.inert = Boolean(open || document.body.classList.contains("menu-open"));
    });
  }

  function openSearch(trigger) {
    if (!searchLayer) return;
    lastTrigger = trigger || document.activeElement;
    searchLayer.classList.remove("is-hidden");
    searchLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("search-open");
    setButtonState(true);
    window.dispatchEvent(new CustomEvent("minnong-search-open"));
    setBackgroundInert(true);
    fetchIndex();
    window.requestAnimationFrame(function () {
      if (!searchInput) return;
      try { searchInput.focus({ preventScroll: true }); }
      catch (error) { searchInput.focus(); }
    });
  }

  function closeSearch(restoreFocus) {
    if (!searchLayer || searchLayer.classList.contains("is-hidden")) return;
    searchLayer.classList.add("is-hidden");
    searchLayer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("search-open");
    setButtonState(false);
    setBackgroundInert(false);
    if (restoreFocus !== false && lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  }

  searchButtons.forEach(function (button) {
    button.addEventListener("click", function () { openSearch(button); });
  });

  if (searchClose) searchClose.addEventListener("click", function () { closeSearch(true); });

  if (searchLayer) {
    searchLayer.addEventListener("click", function (event) {
      if (event.target === searchLayer) closeSearch(true);
    });
  }

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && searchLayer) {
      event.preventDefault();
      openSearch(document.activeElement);
      return;
    }

    if (event.key === "Escape" && searchLayer && !searchLayer.classList.contains("is-hidden")) {
      event.preventDefault();
      closeSearch(true);
      return;
    }

    if (event.key !== "Tab" || !searchLayer || searchLayer.classList.contains("is-hidden")) return;
    var focusable = Array.prototype.slice.call(searchLayer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var query = searchInput.value.trim();
      fetchIndex().then(function () { renderLiveResults(query); });
    });
  }

  if (searchPageResults) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    fetchIndex().then(function () { renderSearchPage(query); });
  }

  if (searchLayer) {
    searchLayer.setAttribute("aria-hidden", searchLayer.classList.contains("is-hidden") ? "true" : "false");
    setButtonState(!searchLayer.classList.contains("is-hidden"));
  }
})();
