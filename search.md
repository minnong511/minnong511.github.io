---
layout: page
title: Search
permalink: /search/
---

<p class="search-page-help">검색어를 입력하면 제목, 카테고리, 태그, 본문에서 결과를 찾습니다.</p>
<div id="search-page-results" class="archive-list"></div>

<script>
  (function () {
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim().toLowerCase();
    if (q === "blog update" || q === "blog+update") {
      window.location.replace("{{ '/blog-update/' | relative_url }}");
    }
  })();
</script>
