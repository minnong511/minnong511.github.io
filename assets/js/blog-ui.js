(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var menuButton = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobileNav");
  var themeButton = document.querySelector(".theme-toggle");
  var searchLayer = document.getElementById("searchLayer");
  var searchClose = document.querySelector(".search-close");
  var searchInput = document.querySelector(".search-input");

  function setTheme(theme, persist) {
    var nextTheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = nextTheme;

    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", nextTheme === "light" ? "#f3f7f3" : "#07111f");

    if (persist) {
      try { localStorage.setItem("minnong-theme", nextTheme); } catch (e) {}
    }

    var giscusFrame = document.querySelector("iframe.giscus-frame");
    if (giscusFrame && giscusFrame.contentWindow) {
      giscusFrame.contentWindow.postMessage({
        giscus: { setConfig: { theme: nextTheme === "light" ? "light" : "transparent_dark" } }
      }, "https://giscus.app");
    }

    window.dispatchEvent(new CustomEvent("study-theme-change", { detail: { theme: nextTheme } }));
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      setTheme(root.dataset.theme === "light" ? "dark" : "light", true);
    });
  }

  setTheme(root.dataset.theme || "dark", false);

  function setMenu(open) {
    if (!menuButton || !mobileNav) return;
    mobileNav.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "모바일 메뉴 닫기" : "모바일 메뉴 열기");
    menuButton.innerHTML = open ? '<i class="ri-close-line"></i>' : '<i class="ri-menu-3-line"></i>';
    body.classList.toggle("menu-open", open);
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      setMenu(mobileNav.hidden);
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  function closeSearch() {
    if (!searchLayer) return;
    searchLayer.classList.add("is-hidden");
    body.classList.remove("search-open");
  }

  if (searchClose) searchClose.addEventListener("click", closeSearch);
  if (searchLayer) {
    searchLayer.addEventListener("click", function (event) {
      if (event.target === searchLayer) closeSearch();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSearch();
      setMenu(false);
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && searchLayer) {
      event.preventDefault();
      searchLayer.classList.remove("is-hidden");
      body.classList.add("search-open");
      if (searchInput) searchInput.focus();
    }
  });

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var copyButton = document.querySelector(".copy-url");
  var copyToast = document.getElementById("copyToast");
  var copyTimer;

  function showCopyToast(message) {
    if (!copyToast) return;
    copyToast.textContent = message;
    copyToast.classList.add("is-visible");
    clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () {
      copyToast.classList.remove("is-visible");
    }, 1600);
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var url = copyButton.getAttribute("data-url") || window.location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () {
          showCopyToast("링크를 복사했습니다.");
        }).catch(function () {
          showCopyToast("주소창의 링크를 복사해 주세요.");
        });
      } else {
        var input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        try {
          document.execCommand("copy");
          showCopyToast("링크를 복사했습니다.");
        } catch (e) {
          showCopyToast("주소창의 링크를 복사해 주세요.");
        }
        input.remove();
      }
    });
  }

  var postContent = document.getElementById("postContent");
  var tocList = document.getElementById("postTocList");

  if (postContent && tocList) {
    var headings = Array.prototype.slice.call(postContent.querySelectorAll("h2, h3"));
    var usedIds = {};

    headings.forEach(function (heading, index) {
      var baseId = heading.id || heading.textContent.trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-") || ("section-" + (index + 1));
      var id = baseId;
      var duplicate = 2;
      while (usedIds[id]) {
        id = baseId + "-" + duplicate;
        duplicate += 1;
      }
      usedIds[id] = true;
      heading.id = id;

      var item = document.createElement("li");
      item.className = heading.tagName === "H3" ? "toc-h3" : "toc-h2";
      var link = document.createElement("a");
      link.href = "#" + id;
      link.textContent = heading.textContent;
      item.appendChild(link);
      tocList.appendChild(item);
    });

    if (headings.length && "IntersectionObserver" in window) {
      var tocLinks = Array.prototype.slice.call(tocList.querySelectorAll("a"));
      var headingObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-20% 0px -70%", threshold: 0 });

      headings.forEach(function (heading) { headingObserver.observe(heading); });
    }
  }

  if (postContent) {
    var contentImages = postContent.querySelectorAll("img");
    if (contentImages.length) {
      var lightbox = document.createElement("div");
      lightbox.className = "image-lightbox is-hidden";
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.setAttribute("aria-label", "이미지 크게 보기");
      lightbox.innerHTML = '<button type="button" aria-label="닫기"><i class="ri-close-line"></i></button><img alt="" />';
      document.body.appendChild(lightbox);

      var lightboxImage = lightbox.querySelector("img");
      function closeLightbox() {
        lightbox.classList.add("is-hidden");
        body.classList.remove("lightbox-open");
      }

      contentImages.forEach(function (image) {
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", (image.alt || "본문 이미지") + " 크게 보기");
        function openImage() {
          lightboxImage.src = image.currentSrc || image.src;
          lightboxImage.alt = image.alt || "";
          lightbox.classList.remove("is-hidden");
          body.classList.add("lightbox-open");
        }
        image.addEventListener("click", openImage);
        image.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openImage();
          }
        });
      });

      lightbox.querySelector("button").addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeLightbox();
      });
    }
  }
})();
