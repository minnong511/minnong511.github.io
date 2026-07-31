(function () {
  "use strict";
  var scrollTarget = null;
  var scrollHandler = null;
  var resizeHandler = null;

  function slugify(text, fallback) {
    var slug = String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
    return slug || fallback;
  }

  function setCurrentLink(links, index) {
    links.forEach(function (link, linkIndex) {
      var active = linkIndex === index;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function initOutline() {
    var content = document.getElementById("postContent");
    var outline = document.getElementById("postOutline");
    if (scrollTarget && scrollHandler) scrollTarget.removeEventListener("scroll", scrollHandler);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    scrollTarget = null;
    scrollHandler = null;
    resizeHandler = null;
    if (!content || !outline) return;

    var headings = Array.prototype.slice.call(content.querySelectorAll("h2, h3"));
    outline.replaceChildren();
    if (!headings.length) {
      var empty = document.createElement("p");
      empty.className = "ide-panel-empty";
      empty.textContent = "이 문서에는 목차가 없습니다.";
      outline.appendChild(empty);
    }

    var links = [];
    var usedIds = {};
    headings.forEach(function (heading, index) {
      var baseId = heading.id || slugify(heading.textContent, "section-" + (index + 1));
      var id = baseId;
      var duplicate = 2;
      while (usedIds[id]) {
        id = baseId + "-" + duplicate;
        duplicate += 1;
      }
      usedIds[id] = true;
      heading.id = id;

      var link = document.createElement("a");
      link.href = "#" + id;
      link.className = heading.tagName === "H3" ? "is-h3" : "";
      link.textContent = heading.textContent;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var target = document.querySelector(".ide-main");
        if (!target) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        var targetTop = heading.getBoundingClientRect().top - target.getBoundingClientRect().top + target.scrollTop - 24;
        target.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
        if (window.history && window.history.replaceState) window.history.replaceState(null, "", "#" + id);
      });
      outline.appendChild(link);
      links.push(link);
    });

    scrollTarget = document.querySelector(".ide-main");
    function updateCurrent() {
      var containerTop = scrollTarget ? scrollTarget.getBoundingClientRect().top : 0;
      var threshold = containerTop + 88;
      var activeIndex = 0;
      headings.forEach(function (heading, index) {
        if (heading.getBoundingClientRect().top <= threshold) activeIndex = index;
      });
      if (links.length) setCurrentLink(links, activeIndex);
    }

    scrollHandler = updateCurrent;
    resizeHandler = updateCurrent;
    if (scrollTarget) scrollTarget.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", resizeHandler, { passive: true });
    updateCurrent();

    var text = content.innerText || "";
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var reading = Math.max(1, Math.ceil(words / 200));
    document.querySelectorAll("[data-word-count]").forEach(function (element) { element.textContent = words.toLocaleString("ko-KR"); });
    document.querySelectorAll("[data-reading-time], [data-status-reading]").forEach(function (element) { element.textContent = reading + " min read"; });
  }

  document.addEventListener("ide:document-change", initOutline);
  initOutline();
})();
