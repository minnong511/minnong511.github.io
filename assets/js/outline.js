(function () {
  "use strict";
  var observer = null;

  function initOutline() {
    var content = document.getElementById("postContent");
    var outline = document.getElementById("postOutline");
    if (observer) { observer.disconnect(); observer = null; }
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
    headings.forEach(function (heading, index) {
      var id = heading.id || "section-" + (index + 1);
      heading.id = id;
      var link = document.createElement("a");
      link.href = "#" + id;
      link.className = heading.tagName === "H3" ? "is-h3" : "";
      link.textContent = heading.textContent;
      link.addEventListener("click", function (event) { event.preventDefault(); heading.scrollIntoView({ behavior: "smooth", block: "start" }); });
      outline.appendChild(link);
      links.push(link);
    });
    if (headings.length && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) { link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id); });
        });
      }, { rootMargin: "-12% 0px -70% 0px" });
      headings.forEach(function (heading) { observer.observe(heading); });
    }
    var text = content.innerText || "";
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var reading = Math.max(1, Math.ceil(words / 200));
    document.querySelectorAll("[data-word-count]").forEach(function (element) { element.textContent = words.toLocaleString("ko-KR"); });
    document.querySelectorAll("[data-reading-time], [data-status-reading]").forEach(function (element) { element.textContent = reading + " min read"; });
  }

  document.addEventListener("ide:document-change", initOutline);
  initOutline();
})();
