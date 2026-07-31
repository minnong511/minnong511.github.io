(function () {
  "use strict";

  var scriptUrl = "https://giscus.app/client.js";
  var commentObserver = null;

  function loadComments(section) {
    if (!section) return;

    var mount = section.querySelector(".giscus");
    if (!mount || mount.dataset.loaded === "true") return;

    var attributes = {
      "data-repo": section.dataset.giscusRepo,
      "data-repo-id": section.dataset.giscusRepoId,
      "data-category": section.dataset.giscusCategory,
      "data-category-id": section.dataset.giscusCategoryId,
      "data-mapping": section.dataset.giscusMapping,
      "data-strict": section.dataset.giscusStrict,
      "data-reactions-enabled": section.dataset.giscusReactions,
      "data-emit-metadata": section.dataset.giscusEmit,
      "data-input-position": section.dataset.giscusInput,
      "data-theme": section.dataset.giscusTheme,
      "data-lang": section.dataset.giscusLang,
      "data-loading": section.dataset.giscusLoading
    };

    var script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.keys(attributes).forEach(function (name) {
      if (attributes[name]) script.setAttribute(name, attributes[name]);
    });

    mount.dataset.loaded = "true";
    mount.appendChild(script);
  }

  function initComments() {
    if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
    var section = document.getElementById("commentsSection");
    if (!section) return;
    if (!("IntersectionObserver" in window)) { loadComments(section); return; }
    commentObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        loadComments(section);
        commentObserver.disconnect();
        commentObserver = null;
      });
    }, { root: document.querySelector(".ide-main"), rootMargin: "0px 0px 240px" });
    commentObserver.observe(section);
  }

  initComments();
  document.addEventListener("ide:document-change", initComments);
})();
