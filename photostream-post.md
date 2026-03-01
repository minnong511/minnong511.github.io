---
layout: page
title: Photo Post
permalink: /photostream/post/
hide_page_title: true
hide_footer: true
hide_global_header: true
body_class: photo-immersive photo-post-focus
---

{% assign photos = site.static_files | where_exp: "item", "item.path contains '/assets/photo_lib/'" %}

<div id="photoPostApp" class="photo-post-focus-app">
  <div class="photo-post-hero" id="photoPostHero" aria-hidden="false">
    <div class="photo-post-hero-inner">
      <div class="photo-post-hero-flag" id="photoPostHeroFlagWrap">
        <img class="photo-post-hero-flag-image" id="photoPostHeroFlagImage" alt="" />
      </div>
      <h2 class="photo-post-hero-title" id="photoPostHeroTitle"></h2>
      <p class="photo-post-hero-date" id="photoPostHeroDate"></p>
      <button class="photo-post-hero-fade-btn" id="photoPostHeroGo" type="button" aria-label="Open post details">
        <i class="ri-arrow-right-line"></i>
      </button>
    </div>
  </div>

  <p class="photo-post-focus-location photo-post-focus-location-top-left" id="photoPostFocusLocation"></p>
  <div class="photo-post-focus-top-right">
    <button class="photo-post-focus-back" id="photoPostFocusBack" type="button" aria-label="Back to albums">
      <i class="ri-arrow-left-line"></i>
    </button>
  </div>

  <div class="photo-post-focus-layout">
    <section class="photo-post-focus-center" id="photoPostFocusCenter" aria-label="Photo viewer">
      <div class="photo-post-focus-image-frame">
        <img class="photo-post-focus-image" id="photoPostFocusImage" alt="" />
      </div>
    </section>

    <aside class="photo-post-focus-right">
      <div class="photo-post-focus-info-merged">
        <p class="photo-post-focus-title" id="photoPostFocusTitle"></p>
        <p class="photo-post-focus-meta" id="photoPostFocusMeta"></p>
        <p class="photo-post-focus-extra" id="photoPostFocusExtra"></p>
      </div>
      <p class="photo-post-focus-counter">
        No.
        <span class="photo-post-focus-counter-reel">
          <span class="photo-post-focus-counter-track" id="photoPostFocusCounterTrack"></span>
        </span>
        of <span id="photoPostFocusCounterTotal">01</span>
      </p>
    </aside>
  </div>
</div>

<script id="photoPostData" type="application/json">
[
{% if photos.size > 0 %}
{% for photo in photos %}
  {% assign path_parts = photo.path | split: "/" %}
  {% assign folder_index = path_parts.size | minus: 2 %}
  {% assign folder_name = path_parts[folder_index] %}
  {
    "id": {{ forloop.index }},
    "url": {{ photo.path | relative_url | jsonify }},
    "album": {{ folder_name | jsonify }},
    "caption": {{ folder_name | replace: "-", " " | capitalize | append: " #" | append: forloop.index | jsonify }},
    "modified": {{ photo.modified_time | date: "%s" | jsonify }}
  }{% unless forloop.last %},{% endunless %}
{% endfor %}
{% else %}
  { "id": 1, "url": "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Eiffel Tower at sunset", "modified": 1734566400 },
  { "id": 2, "url": "https://images.unsplash.com/photo-1695306812834-7f7ccc0e1140?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Cafe in Paris", "modified": 1734652800 },
  { "id": 3, "url": "https://images.unsplash.com/photo-1707952189186-8694f03529f7?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Louvre details", "modified": 1734739200 },
  { "id": 4, "url": "https://images.unsplash.com/photo-1617581219723-68d352f989e7?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Shibuya crossing", "modified": 1734825600 },
  { "id": 5, "url": "https://images.unsplash.com/photo-1641385511718-d736d65e6d04?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Temple morning light", "modified": 1734912000 },
  { "id": 6, "url": "https://images.unsplash.com/photo-1614932750312-440cdfc45fea?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Cherry blossom season", "modified": 1734998400 },
  { "id": 7, "url": "https://images.unsplash.com/photo-1573481726566-9d98bb795fff?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "Blue domes and sea", "modified": 1735084800 },
  { "id": 8, "url": "https://images.unsplash.com/photo-1656677476420-7159cac2366a?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "Sunset in Oia", "modified": 1735171200 },
  { "id": 9, "url": "https://images.unsplash.com/photo-1536011251940-0f9e91890ec5?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "White-washed houses", "modified": 1735257600 },
  { "id": 10, "url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Skyline at dusk", "modified": 1735344000 },
  { "id": 11, "url": "https://images.unsplash.com/photo-1595901688281-9cef114adb0b?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Times Square neon", "modified": 1735430400 },
  { "id": 12, "url": "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Central Park autumn", "modified": 1735516800 }
{% endif %}
]
</script>

<script>
  (function () {
    var app = document.getElementById("photoPostApp");
    var dataEl = document.getElementById("photoPostData");
    if (!app || !dataEl) return;

    var photos = [];
    try {
      photos = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      photos = [];
    }

    var backButton = document.getElementById("photoPostFocusBack");
    var locationEl = document.getElementById("photoPostFocusLocation");
    var imageEl = document.getElementById("photoPostFocusImage");
    var titleEl = document.getElementById("photoPostFocusTitle");
    var metaEl = document.getElementById("photoPostFocusMeta");
    var extraEl = document.getElementById("photoPostFocusExtra");
    var infoMergedEl = app.querySelector(".photo-post-focus-info-merged");
    var counterTrackEl = document.getElementById("photoPostFocusCounterTrack");
    var counterTotalEl = document.getElementById("photoPostFocusCounterTotal");
    var counterReelEl = app.querySelector(".photo-post-focus-counter-reel");
    var heroEl = document.getElementById("photoPostHero");
    var heroTitleEl = document.getElementById("photoPostHeroTitle");
    var heroDateEl = document.getElementById("photoPostHeroDate");
    var heroGoButton = document.getElementById("photoPostHeroGo");
    var heroFlagWrapEl = document.getElementById("photoPostHeroFlagWrap");
    var heroFlagImageEl = document.getElementById("photoPostHeroFlagImage");

    var albumRootUrl = "{{ '/photostream/' | relative_url }}";
    var index = 0;
    var wheelLocked = false;
    var isHeroActive = !!heroEl;
    var motionOutMs = 360;
    var motionInMs = 620;
    var motionLockMs = motionOutMs + motionInMs + 20;

    var albumFlags = {
      "new-york": {
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg",
        alt: "United States flag"
      }
    };

    function toTitleCase(text) {
      return (text || "").replace(/\w\S*/g, function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    }

    function slugify(text) {
      return String(text || "")
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    function formatDate(ts) {
      var n = parseInt(ts, 10);
      if (isNaN(n) || n <= 0) return "";
      var d = new Date(n * 1000);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "." + m + "." + day;
    }

    function getAlbumDate(slug, albumPhotos) {
      if (slug === "santorini") return "12.27 ~ 12.31";
      var latest = 0;
      (albumPhotos || []).forEach(function (photo) {
        var ts = parseInt(photo.modified, 10);
        if (!isNaN(ts) && ts > latest) latest = ts;
      });
      return formatDate(latest);
    }

    function gcd(a, b) {
      var x = Math.abs(a || 0);
      var y = Math.abs(b || 0);
      while (y) {
        var t = y;
        y = x % y;
        x = t;
      }
      return x || 1;
    }

    function getAspectRatioText() {
      if (!imageEl) return "";
      var w = imageEl.naturalWidth || 0;
      var h = imageEl.naturalHeight || 0;
      if (!w || !h) return "";
      var d = gcd(w, h);
      return String(w / d) + ":" + String(h / d);
    }

    function updateExtraInfo() {
      if (!extraEl) return;
      var ratio = getAspectRatioText();
      var ratioText = ratio ? ("Ratio " + ratio) : "Ratio -";
      extraEl.textContent = "Hasselblad 500CM · Kodak Gold 200 · " + ratioText;
    }

    function lockScroll() {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100dvh";
      window.scrollTo(0, 0);
    }

    function closeHero() {
      if (!heroEl || !isHeroActive) return;
      isHeroActive = false;
      heroEl.classList.add("is-faded");
      heroEl.setAttribute("aria-hidden", "true");
    }

    function buildCounterTrack(total) {
      if (!counterTrackEl) return;
      counterTrackEl.textContent = "01";
    }

    function renderCurrent(albumPhotos) {
      var photo = albumPhotos[index];
      if (!photo || !imageEl) return;
      if (titleEl) titleEl.textContent = photo.caption || "Untitled";
      if (metaEl) metaEl.textContent = formatDate(photo.modified);

      if (counterTrackEl) counterTrackEl.textContent = String(index + 1).padStart(2, "0");
      if (counterTotalEl) {
        counterTotalEl.textContent = String(albumPhotos.length).padStart(2, "0");
      }

    }

    function setInitialImage(photo) {
      if (!imageEl || !photo) return;
      imageEl.src = photo.url;
      imageEl.alt = photo.caption || "";
      updateExtraInfo();
    }

    function transitionToIndex(nextIndex, albumPhotos) {
      if (!albumPhotos || !albumPhotos.length) return;
      if (wheelLocked) return;
      nextIndex = Math.max(0, Math.min(albumPhotos.length - 1, nextIndex));
      if (nextIndex === index) return;
      var isForward = nextIndex > index;

      var nextPhoto = albumPhotos[nextIndex];
      if (!nextPhoto || !imageEl) return;

      wheelLocked = true;
      if (app) app.classList.add("is-transitioning");

      imageEl.classList.remove("is-forward", "is-backward");
      imageEl.classList.add(isForward ? "is-forward" : "is-backward");
      imageEl.classList.add("is-leaving");
      if (infoMergedEl) {
        infoMergedEl.classList.remove("is-entering");
        infoMergedEl.classList.add("is-leaving");
      }
      if (counterReelEl) {
        counterReelEl.classList.remove("is-entering");
        counterReelEl.classList.add("is-leaving");
      }

      window.setTimeout(function () {
        index = nextIndex;
        imageEl.src = nextPhoto.url;
        imageEl.alt = nextPhoto.caption || "";
        updateExtraInfo();
        renderCurrent(albumPhotos);

        imageEl.classList.remove("is-leaving");
        imageEl.classList.add("is-entering");
        if (infoMergedEl) {
          infoMergedEl.classList.remove("is-leaving");
          infoMergedEl.classList.add("is-entering");
        }
        if (counterReelEl) {
          counterReelEl.classList.remove("is-leaving");
          counterReelEl.classList.add("is-entering");
        }

        window.setTimeout(function () {
          imageEl.classList.remove("is-entering");
          if (infoMergedEl) infoMergedEl.classList.remove("is-entering");
          if (counterReelEl) counterReelEl.classList.remove("is-entering");
          if (app) app.classList.remove("is-transitioning");
        }, motionInMs);
      }, motionOutMs);

      window.setTimeout(function () {
        wheelLocked = false;
      }, motionLockMs);
    }

    var params = new URLSearchParams(window.location.search || "");
    var targetSlug = params.get("album") || "";

    var albums = Object.keys(
      photos.reduce(function (acc, photo) {
        acc[photo.album] = true;
        return acc;
      }, {})
    ).map(function (albumName) {
      var albumPhotos = photos.filter(function (photo) { return photo.album === albumName; });
      albumPhotos.sort(function (a, b) { return (a.modified || 0) - (b.modified || 0); });
      return {
        slug: slugify(albumName),
        title: toTitleCase(String(albumName || "").replace(/[-_]+/g, " ")),
        photos: albumPhotos
      };
    });

    var currentAlbum = albums.find(function (album) { return album.slug === targetSlug; });
    if (!currentAlbum || !currentAlbum.photos.length) {
      window.location.replace(albumRootUrl);
      return;
    }

    lockScroll();

    if (locationEl) locationEl.textContent = currentAlbum.title;
    if (heroTitleEl) heroTitleEl.textContent = currentAlbum.title;
    if (heroDateEl) heroDateEl.textContent = getAlbumDate(currentAlbum.slug, currentAlbum.photos);
    if (heroFlagWrapEl && heroFlagImageEl) {
      var flag = albumFlags[currentAlbum.slug];
      if (flag && flag.src) {
        heroFlagImageEl.src = flag.src;
        heroFlagImageEl.alt = flag.alt || "";
        heroFlagWrapEl.classList.add("is-visible");
      } else {
        heroFlagImageEl.removeAttribute("src");
        heroFlagImageEl.alt = "";
        heroFlagWrapEl.classList.remove("is-visible");
      }
    }

    buildCounterTrack(currentAlbum.photos.length);
    renderCurrent(currentAlbum.photos);
    setInitialImage(currentAlbum.photos[index]);
    if (imageEl) {
      imageEl.addEventListener("load", updateExtraInfo);
    }

    if (heroGoButton) {
      heroGoButton.addEventListener("click", function () {
        closeHero();
      });
    }

    document.addEventListener("wheel", function (event) {
      event.preventDefault();
      if (isHeroActive) {
        if (Math.abs(event.deltaY) < 8) return;
        closeHero();
        return;
      }
      if (Math.abs(event.deltaY) < 8) return;
      if (event.deltaY > 0) {
        transitionToIndex(index + 1, currentAlbum.photos);
      } else {
        transitionToIndex(index - 1, currentAlbum.photos);
      }
    }, { passive: false });

    if (backButton) {
      backButton.addEventListener("click", function () {
        window.location.href = albumRootUrl;
      });
    }

    document.addEventListener("keydown", function (event) {
      if (isHeroActive) {
        if (event.key === "Escape") {
          window.location.href = albumRootUrl;
          return;
        }
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          closeHero();
          return;
        }
      }
      if (event.key === "Escape") window.location.href = albumRootUrl;
      if (event.key === "ArrowRight") {
        transitionToIndex(index + 1, currentAlbum.photos);
      }
      if (event.key === "ArrowLeft") {
        transitionToIndex(index - 1, currentAlbum.photos);
      }
    });
  })();
</script>
