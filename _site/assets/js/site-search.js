(function () {
  var baseUrl = (document.body && document.body.dataset && document.body.dataset.baseurl) || "";
  var searchLayer = document.getElementById("searchLayer");
  var searchButton = document.querySelector(".toggle-search");
  var searchInput = document.querySelector(".search-input");
  var liveResults = document.getElementById("searchLiveResults");
  var searchPageResults = document.getElementById("search-page-results");
  var searchIndex = null;

  function normalize(text) {
    return (text || "").toLowerCase();
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
      .map(function (item) {
        return { item: item, score: getScore(item, query) };
      })
      .filter(function (x) {
        return x.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (x) {
        return x.item;
      });
  }

  function createResultLink(item) {
    var a = document.createElement("a");
    a.className = "search-result-item";
    a.href = item.url;
    a.innerHTML =
      "<strong>" +
      item.title +
      "</strong>" +
      "<time>" +
      item.date +
      "</time>" +
      "<span>" +
      (item.excerpt || "").slice(0, 110) +
      "</span>";
    return a;
  }

  function renderLiveResults(query) {
    if (!liveResults) return;
    liveResults.innerHTML = "";
    if (!query) return;

    var results = searchItems(query).slice(0, 6);
    if (!results.length) {
      liveResults.innerHTML = '<p class="search-empty">검색 결과가 없습니다.</p>';
      return;
    }
    results.forEach(function (item) {
      liveResults.appendChild(createResultLink(item));
    });
  }

  function renderSearchPage(query) {
    if (!searchPageResults) return;
    searchPageResults.innerHTML = "";
    if (!query) {
      searchPageResults.innerHTML = '<p class="search-empty">검색어를 입력해 주세요.</p>';
      return;
    }
    var results = searchItems(query);
    if (!results.length) {
      searchPageResults.innerHTML = '<p class="search-empty">검색 결과가 없습니다.</p>';
      return;
    }
    results.forEach(function (item) {
      searchPageResults.appendChild(createResultLink(item));
    });
  }

  function fetchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch(baseUrl + "/search.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        searchIndex = data || [];
        return searchIndex;
      })
      .catch(function () {
        searchIndex = [];
        return [];
      });
  }

  if (searchButton && searchLayer) {
    searchButton.addEventListener("click", function () {
      searchLayer.classList.toggle("is-hidden");
      if (!searchLayer.classList.contains("is-hidden") && searchInput) {
        searchInput.focus();
      }
      fetchIndex();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var q = searchInput.value.trim();
      fetchIndex().then(function () {
        renderLiveResults(q);
      });
    });
  }

  if (searchPageResults) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    fetchIndex().then(function () {
      renderSearchPage(query);
    });
  }
})();
