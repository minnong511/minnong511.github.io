(function () {
  "use strict";

  var scriptUrl = "https://giscus.app/client.js";

  function initComments() {
    var section = document.getElementById("commentsSection");
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

  initComments();
  document.addEventListener("ide:document-change", initComments);
})();
