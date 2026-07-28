(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var menuButton = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobileNav");
  var themeButton = document.querySelector(".theme-toggle");

  function syncGiscusTheme() {
    var giscusFrame = document.querySelector("iframe.giscus-frame");
    if (!giscusFrame || !giscusFrame.contentWindow) return;
    giscusFrame.contentWindow.postMessage({
      giscus: { setConfig: { theme: root.dataset.theme === "light" ? "light" : "transparent_dark" } }
    }, "https://giscus.app");
  }

  function setTheme(theme, persist) {
    var nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;

    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", nextTheme === "light" ? "#ffffff" : "#050505");

    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(nextTheme === "dark"));
      themeButton.setAttribute("title", nextTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
    }

    if (persist) {
      try { localStorage.setItem("minnong-theme", nextTheme); } catch (error) {}
    }

    syncGiscusTheme();

    window.dispatchEvent(new CustomEvent("study-theme-change", { detail: { theme: nextTheme } }));
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      setTheme(root.dataset.theme === "light" ? "dark" : "light", true);
    });
  }

  setTheme(root.dataset.theme || "light", false);

  if ("MutationObserver" in window) {
    var giscusObserver = new MutationObserver(function () {
      var frame = document.querySelector("iframe.giscus-frame");
      if (!frame || frame.dataset.minnongThemeReady) return;
      frame.dataset.minnongThemeReady = "true";
      frame.addEventListener("load", syncGiscusTheme);
      syncGiscusTheme();
    });
    giscusObserver.observe(body, { childList: true, subtree: true });
  }

  function setPageInert(open) {
    Array.prototype.slice.call(document.querySelectorAll(".site-main, .site-footer")).forEach(function (element) {
      element.inert = Boolean(open || body.classList.contains("search-open"));
    });
  }

  function setMenu(open, restoreFocus) {
    if (!menuButton || !mobileNav) return;
    mobileNav.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "모바일 메뉴 닫기" : "모바일 메뉴 열기");
    menuButton.innerHTML = open
      ? '<i class="ri-close-line" aria-hidden="true"></i>'
      : '<i class="ri-menu-3-line" aria-hidden="true"></i>';
    body.classList.toggle("menu-open", open);
    setPageInert(open);

    if (open) {
      window.requestAnimationFrame(function () {
        var firstLink = mobileNav.querySelector("a, button");
        if (firstLink) firstLink.focus();
      });
    } else if (restoreFocus && typeof menuButton.focus === "function") {
      menuButton.focus();
    }
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      setMenu(mobileNav.hidden, false);
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a") && !event.target.closest(".toggle-search")) setMenu(false, false);
    });

    window.addEventListener("minnong-search-open", function () { setMenu(false, false); });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 767 && !mobileNav.hidden) setMenu(false, false);
    }, { passive: true });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !mobileNav.hidden) {
        event.preventDefault();
        setMenu(false, true);
        return;
      }

      if (event.key !== "Tab" || mobileNav.hidden) return;
      var focusable = Array.prototype.slice.call(mobileNav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        menuButton.focus();
      } else if (event.shiftKey && document.activeElement === menuButton) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        menuButton.focus();
      } else if (!event.shiftKey && document.activeElement === menuButton) {
        event.preventDefault();
        first.focus();
      }
    });
  }

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
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
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
    copyTimer = window.setTimeout(function () { copyToast.classList.remove("is-visible"); }, 1600);
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var url = copyButton.getAttribute("data-url") || window.location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url)
          .then(function () { showCopyToast("링크를 복사했습니다."); })
          .catch(function () { showCopyToast("주소창의 링크를 복사해 주세요."); });
        return;
      }

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
      } catch (error) {
        showCopyToast("주소창의 링크를 복사해 주세요.");
      }
      input.remove();
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
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.innerHTML = '<button type="button" aria-label="닫기"><i class="ri-close-line" aria-hidden="true"></i></button><img alt="" />';
      document.body.appendChild(lightbox);

      var lightboxImage = lightbox.querySelector("img");
      var lightboxClose = lightbox.querySelector("button");
      var sourceImage = null;

      function closeLightbox() {
        if (lightbox.classList.contains("is-hidden")) return;
        lightbox.classList.add("is-hidden");
        lightbox.setAttribute("aria-hidden", "true");
        body.classList.remove("lightbox-open");
        if (sourceImage) sourceImage.focus();
      }

      contentImages.forEach(function (image) {
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", (image.alt || "본문 이미지") + " 크게 보기");
        function openImage() {
          sourceImage = image;
          lightboxImage.src = image.currentSrc || image.src;
          lightboxImage.alt = image.alt || "";
          lightbox.classList.remove("is-hidden");
          lightbox.setAttribute("aria-hidden", "false");
          body.classList.add("lightbox-open");
          lightboxClose.focus();
        }
        image.addEventListener("click", openImage);
        image.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openImage();
          }
        });
      });

      lightboxClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeLightbox();
      });
    }
  }
})();
