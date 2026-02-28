---
layout: page
title: Photo Stream
permalink: /photostream/
hide_page_title: true
body_class: photo-immersive
hide_footer: true
---

{% assign photos = site.static_files | where_exp: "item", "item.path contains '/assets/photo_lib/'" %}

<div id="photoArchiveApp" class="photo-archive-app">
  <header class="photo-page-header">
    <div class="container">
      <div class="photo-page-header-tools">
        <a class="photo-page-home" href="{{ '/' | relative_url }}" aria-label="Go Home">
          <i class="ri-home-5-line"></i>
        </a>
      </div>
      <h1 class="photo-page-header-title">MINNONG PHOTO</h1>
    </div>
  </header>

  <div class="photo-archive-view is-active" data-view="albums">
    <section class="photo-home-editorial">
      <div class="photo-home-stage">
        <button class="photo-home-nav is-prev" id="photoHomePrev" type="button" aria-label="Previous album">
          <i class="ri-arrow-left-line"></i>
        </button>

        <div class="photo-home-split">
          <button class="photo-home-frame" id="photoHomeFrameA" type="button" aria-label="Open first album">
            <img id="photoHomeImageA" alt="" loading="lazy" />
          </button>
          <button class="photo-home-frame" id="photoHomeFrameB" type="button" aria-label="Open second album">
            <img id="photoHomeImageB" alt="" loading="lazy" />
          </button>
        </div>

        <button class="photo-home-nav is-next" id="photoHomeNext" type="button" aria-label="Next album">
          <i class="ri-arrow-right-line"></i>
        </button>
      </div>
    </section>

    <div class="photo-home-list-wrap">
      <header class="photo-archive-intro">
        <h2>All Albums</h2>
        <p>필름 사진과 일상 기록을 모아두는 공간입니다.</p>
      </header>
      <div class="photo-archive-grid" id="photoAlbumGrid"></div>
    </div>
  </div>

  <div class="photo-archive-view" data-view="album">
    <section class="photo-editorial-detail">
      <header class="photo-editorial-top">
        <div class="photo-editorial-left">
          <button class="photo-back-button" id="photoBackButton" type="button" aria-label="Back to albums">
            <i class="ri-arrow-left-s-line"></i>
            <span>All Albums</span>
          </button>
          <a class="photo-editorial-link" href="{{ '/' | relative_url }}">Home</a>
        </div>
        <div class="photo-editorial-right">
          <span id="photoAlbumLocation"></span>
          <span id="photoAlbumDate"></span>
        </div>
      </header>

      <h2 class="photo-editorial-title" id="photoAlbumTitle"></h2>

      <div class="photo-editorial-stage">
        <button class="photo-editorial-nav is-prev" id="photoAlbumPrev" type="button" aria-label="Previous image">
          <i class="ri-arrow-left-line"></i>
        </button>

        <div class="photo-editorial-split">
          <button class="photo-editorial-frame" id="photoEditorialFrameA" type="button" aria-label="Open first image">
            <img id="photoEditorialImageA" alt="" loading="lazy" />
          </button>
          <button class="photo-editorial-frame" id="photoEditorialFrameB" type="button" aria-label="Open second image">
            <img id="photoEditorialImageB" alt="" loading="lazy" />
          </button>
        </div>

        <button class="photo-editorial-nav is-next" id="photoAlbumNext" type="button" aria-label="Next image">
          <i class="ri-arrow-right-line"></i>
        </button>
      </div>

      <footer class="photo-editorial-meta">
        <span id="photoAlbumCount"></span>
        <span class="dot"></span>
        <span id="photoAlbumCaption"></span>
      </footer>
    </section>
  </div>
</div>

<div class="photo-archive-lightbox is-hidden" id="photoArchiveLightbox" aria-hidden="true">
  <button class="photo-archive-lightbox-close" id="photoArchiveLightboxClose" type="button" aria-label="Close">
    <i class="ri-close-line"></i>
  </button>
  <div class="photo-archive-lightbox-inner">
    <img id="photoArchiveLightboxImage" alt="" />
    <p id="photoArchiveLightboxCaption"></p>
  </div>
</div>

{% if photos.size == 0 %}
<p class="empty-msg" style="margin-top: 0.8rem;">현재는 Unsplash 샘플 이미지로 렌더링 중입니다. `assets/photo_lib/`에 이미지를 추가하면 자동으로 대체됩니다.</p>
{% endif %}

<script id="photoArchiveData" type="application/json">
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
    var app = document.getElementById("photoArchiveApp");
    var dataEl = document.getElementById("photoArchiveData");
    if (!app || !dataEl) return;

    var photos = [];
    try {
      photos = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      photos = [];
    }

    var albumGrid = document.getElementById("photoAlbumGrid");
    var homePrev = document.getElementById("photoHomePrev");
    var homeNext = document.getElementById("photoHomeNext");
    var homeFrameA = document.getElementById("photoHomeFrameA");
    var homeFrameB = document.getElementById("photoHomeFrameB");
    var homeImageA = document.getElementById("photoHomeImageA");
    var homeImageB = document.getElementById("photoHomeImageB");
    var backButton = document.getElementById("photoBackButton");
    var albumTitle = document.getElementById("photoAlbumTitle");
    var albumLocation = document.getElementById("photoAlbumLocation");
    var albumDate = document.getElementById("photoAlbumDate");
    var albumCount = document.getElementById("photoAlbumCount");
    var albumCaption = document.getElementById("photoAlbumCaption");
    var albumPrev = document.getElementById("photoAlbumPrev");
    var albumNext = document.getElementById("photoAlbumNext");
    var frameA = document.getElementById("photoEditorialFrameA");
    var frameB = document.getElementById("photoEditorialFrameB");
    var imageA = document.getElementById("photoEditorialImageA");
    var imageB = document.getElementById("photoEditorialImageB");
    var views = app.querySelectorAll(".photo-archive-view");
    var currentAlbum = null;
    var currentIndex = 0;
    var homeIndex = 0;

    var lightbox = document.getElementById("photoArchiveLightbox");
    var lightboxClose = document.getElementById("photoArchiveLightboxClose");
    var lightboxImage = document.getElementById("photoArchiveLightboxImage");
    var lightboxCaption = document.getElementById("photoArchiveLightboxCaption");

    function toTitleCase(text) {
      return (text || "").replace(/\w\S*/g, function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    }

    function parseAlbumMeta(albumName, albumPhotos) {
      var raw = String(albumName || "");
      var compact = raw.replace(/[_\s]+/g, "-");
      var match = compact.match(/^(\d{4})[-.]?(\d{2})[-.]?(\d{2})-(.+)$/);
      var latestTs = 0;

      (albumPhotos || []).forEach(function (photo) {
        var ts = parseInt(photo.modified, 10);
        if (!isNaN(ts) && ts > latestTs) latestTs = ts;
      });

      if (match) {
        var dateText = match[1] + "." + match[2] + "." + match[3];
        var locationText = toTitleCase(match[4].replace(/[-_]+/g, " "));
        return {
          title: locationText,
          location: locationText,
          date: dateText,
          timestamp: latestTs || Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000
        };
      }

      var location = toTitleCase(raw.replace(/[-_]+/g, " "));
      var dateFallback = latestTs ? new Date(latestTs * 1000) : new Date();
      var y = dateFallback.getFullYear();
      var m = String(dateFallback.getMonth() + 1).padStart(2, "0");
      var d = String(dateFallback.getDate()).padStart(2, "0");

      return {
        title: location,
        location: location,
        date: y + "." + m + "." + d,
        timestamp: latestTs || 0
      };
    }

    var albums = Object.keys(
      photos.reduce(function (acc, photo) {
        acc[photo.album] = true;
        return acc;
      }, {})
    ).map(function (albumName, index) {
      var albumPhotos = photos.filter(function (photo) { return photo.album === albumName; });
      var meta = parseAlbumMeta(albumName, albumPhotos);
      return {
        id: index + 1,
        title: meta.title,
        location: meta.location,
        date: meta.date,
        timestamp: meta.timestamp,
        coverImage: albumPhotos[0].url,
        photos: albumPhotos
      };
    }).sort(function (a, b) {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    function setView(name) {
      views.forEach(function (view) {
        var isTarget = view.getAttribute("data-view") === name;
        view.classList.toggle("is-active", isTarget);
        view.style.display = isTarget ? "block" : "none";
      });

      if (name === "albums") {
        document.body.classList.add("photo-home-mode");
      } else {
        document.body.classList.remove("photo-home-mode");
      }
    }

    function openLightbox(photo) {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = photo.url;
      lightboxImage.alt = photo.caption || "";
      if (lightboxCaption) lightboxCaption.textContent = photo.caption || "";
      lightbox.classList.remove("is-hidden");
      lightbox.setAttribute("aria-hidden", "false");
    }

    function closeLightbox() {
      if (!lightbox || !lightboxImage) return;
      lightbox.classList.add("is-hidden");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
      if (lightboxCaption) lightboxCaption.textContent = "";
    }

    function renderEditorialPair() {
      if (!currentAlbum || !currentAlbum.photos.length || !imageA || !imageB) return;
      var list = currentAlbum.photos;
      var first = list[currentIndex % list.length];
      var second = list[(currentIndex + 1) % list.length];

      imageA.src = first.url;
      imageA.alt = first.caption || currentAlbum.title;
      imageB.src = second.url;
      imageB.alt = second.caption || currentAlbum.title;

      if (albumCaption) {
        albumCaption.textContent = (first.caption || currentAlbum.title) + " / " + (second.caption || currentAlbum.title);
      }
    }

    function renderAlbumDetail(album) {
      if (!albumTitle || !albumLocation || !albumDate || !albumCount) return;
      currentAlbum = album;
      currentIndex = 0;

      albumTitle.textContent = album.title;
      albumLocation.textContent = album.location;
      albumDate.textContent = album.date;
      albumCount.textContent = album.photos.length + " Photos";
      renderEditorialPair();
      setView("album");
    }

    function renderHomePair() {
      if (!albums.length || !homeImageA || !homeImageB) return;

      var firstAlbum = albums[homeIndex % albums.length];
      var secondAlbum = albums[(homeIndex + 1) % albums.length];

      homeImageA.src = firstAlbum.coverImage;
      homeImageA.alt = firstAlbum.title;
      homeImageB.src = secondAlbum.coverImage;
      homeImageB.alt = secondAlbum.title;
    }

    function renderAlbums() {
      if (!albumGrid) return;
      albumGrid.innerHTML = "";
      albums.forEach(function (album) {
        var card = document.createElement("button");
        card.className = "photo-album-card";
        card.type = "button";
        card.innerHTML = '<div class="photo-album-cover"><img loading="lazy" src="' + album.coverImage + '" alt="' + album.title + '"><div class="photo-album-overlay"><span class="photo-album-region">' + album.location + '</span><span class="photo-album-date">' + album.date + '</span></div></div>';
        card.addEventListener("click", function () { renderAlbumDetail(album); });
        albumGrid.appendChild(card);
      });
    }

    if (backButton) {
      backButton.addEventListener("click", function () {
        setView("albums");
      });
    }

    if (homePrev) {
      homePrev.addEventListener("click", function () {
        if (!albums.length) return;
        homeIndex = (homeIndex - 1 + albums.length) % albums.length;
        renderHomePair();
      });
    }

    if (homeNext) {
      homeNext.addEventListener("click", function () {
        if (!albums.length) return;
        homeIndex = (homeIndex + 1) % albums.length;
        renderHomePair();
      });
    }

    if (homeFrameA) {
      homeFrameA.addEventListener("click", function () {
        if (!albums.length) return;
        renderAlbumDetail(albums[homeIndex % albums.length]);
      });
    }

    if (homeFrameB) {
      homeFrameB.addEventListener("click", function () {
        if (!albums.length) return;
        renderAlbumDetail(albums[(homeIndex + 1) % albums.length]);
      });
    }

    if (albumPrev) {
      albumPrev.addEventListener("click", function () {
        if (!currentAlbum || !currentAlbum.photos.length) return;
        currentIndex = (currentIndex - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
        renderEditorialPair();
      });
    }

    if (albumNext) {
      albumNext.addEventListener("click", function () {
        if (!currentAlbum || !currentAlbum.photos.length) return;
        currentIndex = (currentIndex + 1) % currentAlbum.photos.length;
        renderEditorialPair();
      });
    }

    if (frameA) {
      frameA.addEventListener("click", function () {
        if (!currentAlbum || !currentAlbum.photos.length) return;
        openLightbox(currentAlbum.photos[currentIndex % currentAlbum.photos.length]);
      });
    }

    if (frameB) {
      frameB.addEventListener("click", function () {
        if (!currentAlbum || !currentAlbum.photos.length) return;
        openLightbox(currentAlbum.photos[(currentIndex + 1) % currentAlbum.photos.length]);
      });
    }

    if (lightboxClose) {
      lightboxClose.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeLightbox();
      });
    }

    if (lightbox) {
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLightbox();
    });

    setView("albums");
    renderHomePair();
    renderAlbums();

    requestAnimationFrame(function () {
      var homeEditorial = document.querySelector(".photo-home-editorial");
      if (homeEditorial) {
        homeEditorial.classList.add("is-ready");
      }
    });
  })();
</script>
