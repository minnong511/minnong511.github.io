---
layout: page
title: Photo Stream
permalink: /photostream/
hide_page_title: true
---

{% assign photos = site.static_files | where_exp: "item", "item.path contains '/assets/photo_lib/'" %}

<div id="photoArchiveApp" class="photo-archive-app">
  <div class="photo-archive-view is-active" data-view="albums">
    <header class="photo-archive-intro">
      <h1>{{ page.title }}</h1>
      <p>필름 사진과 일상 기록을 모아두는 공간입니다.</p>
    </header>
    <div class="photo-archive-grid" id="photoAlbumGrid"></div>
  </div>

  <div class="photo-archive-view" data-view="album">
    <button class="photo-back-button" id="photoBackButton" type="button" aria-label="Back to albums">
      <i class="ri-arrow-left-s-line"></i>
      <span>All Albums</span>
    </button>

    <header class="photo-album-header">
      <h2 id="photoAlbumTitle"></h2>
      <div class="photo-album-meta">
        <span id="photoAlbumLocation"></span>
        <span class="dot"></span>
        <span id="photoAlbumDate"></span>
        <span class="dot"></span>
        <span id="photoAlbumCount"></span>
      </div>
    </header>

    <div class="photo-album-grid" id="photoAlbumDetailGrid"></div>
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
    "caption": {{ folder_name | replace: "-", " " | capitalize | append: " #" | append: forloop.index | jsonify }}
  }{% unless forloop.last %},{% endunless %}
{% endfor %}
{% else %}
  { "id": 1, "url": "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Eiffel Tower at sunset" },
  { "id": 2, "url": "https://images.unsplash.com/photo-1695306812834-7f7ccc0e1140?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Cafe in Paris" },
  { "id": 3, "url": "https://images.unsplash.com/photo-1707952189186-8694f03529f7?auto=format&fit=crop&w=1400&q=80", "album": "Paris", "caption": "Louvre details" },
  { "id": 4, "url": "https://images.unsplash.com/photo-1617581219723-68d352f989e7?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Shibuya crossing" },
  { "id": 5, "url": "https://images.unsplash.com/photo-1641385511718-d736d65e6d04?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Temple morning light" },
  { "id": 6, "url": "https://images.unsplash.com/photo-1614932750312-440cdfc45fea?auto=format&fit=crop&w=1400&q=80", "album": "Tokyo", "caption": "Cherry blossom season" },
  { "id": 7, "url": "https://images.unsplash.com/photo-1573481726566-9d98bb795fff?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "Blue domes and sea" },
  { "id": 8, "url": "https://images.unsplash.com/photo-1656677476420-7159cac2366a?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "Sunset in Oia" },
  { "id": 9, "url": "https://images.unsplash.com/photo-1536011251940-0f9e91890ec5?auto=format&fit=crop&w=1400&q=80", "album": "Santorini", "caption": "White-washed houses" },
  { "id": 10, "url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Skyline at dusk" },
  { "id": 11, "url": "https://images.unsplash.com/photo-1595901688281-9cef114adb0b?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Times Square neon" },
  { "id": 12, "url": "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=1400&q=80", "album": "New York", "caption": "Central Park autumn" }
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
    var albumDetailGrid = document.getElementById("photoAlbumDetailGrid");
    var backButton = document.getElementById("photoBackButton");
    var albumTitle = document.getElementById("photoAlbumTitle");
    var albumLocation = document.getElementById("photoAlbumLocation");
    var albumDate = document.getElementById("photoAlbumDate");
    var albumCount = document.getElementById("photoAlbumCount");
    var views = app.querySelectorAll(".photo-archive-view");

    var lightbox = document.getElementById("photoArchiveLightbox");
    var lightboxClose = document.getElementById("photoArchiveLightboxClose");
    var lightboxImage = document.getElementById("photoArchiveLightboxImage");
    var lightboxCaption = document.getElementById("photoArchiveLightboxCaption");

    var albums = Object.keys(
      photos.reduce(function (acc, photo) {
        acc[photo.album] = true;
        return acc;
      }, {})
    ).map(function (albumName, index) {
      var albumPhotos = photos.filter(function (photo) { return photo.album === albumName; });
      return {
        id: index + 1,
        title: albumName.replace(/[-_]/g, " "),
        location: albumName.replace(/[-_]/g, " "),
        date: "Archive",
        coverImage: albumPhotos[0].url,
        photos: albumPhotos
      };
    });

    function setView(name) {
      views.forEach(function (view) {
        var isTarget = view.getAttribute("data-view") === name;
        view.classList.toggle("is-active", isTarget);
        view.style.display = isTarget ? "block" : "none";
      });
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

    function renderAlbumDetail(album) {
      if (!albumDetailGrid || !albumTitle || !albumLocation || !albumDate || !albumCount) return;
      albumTitle.textContent = album.title;
      albumLocation.textContent = album.location;
      albumDate.textContent = album.date;
      albumCount.textContent = album.photos.length + " Photos";

      albumDetailGrid.innerHTML = "";
      album.photos.forEach(function (photo) {
        var card = document.createElement("button");
        card.className = "photo-detail-card";
        card.type = "button";
        card.innerHTML = '<div class="photo-detail-image"><img loading="lazy" src="' + photo.url + '" alt="' + (photo.caption || "") + '"></div><p>' + (photo.caption || "") + "</p>";
        card.addEventListener("click", function () { openLightbox(photo); });
        albumDetailGrid.appendChild(card);
      });
      setView("album");
    }

    function renderAlbums() {
      if (!albumGrid) return;
      albumGrid.innerHTML = "";
      albums.forEach(function (album) {
        var card = document.createElement("button");
        card.className = "photo-album-card";
        card.type = "button";
        card.innerHTML = '<div class="photo-album-cover"><img loading="lazy" src="' + album.coverImage + '" alt="' + album.title + '"></div><div class="photo-album-info"><h3>' + album.title + '</h3><div class="meta"><span>' + album.location + '</span><span class="dot"></span><span>' + album.date + '</span></div><p>' + album.photos.length + " Photos</p></div>";
        card.addEventListener("click", function () { renderAlbumDetail(album); });
        albumGrid.appendChild(card);
      });
    }

    if (backButton) {
      backButton.addEventListener("click", function () {
        setView("albums");
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
    renderAlbums();
  })();
</script>
