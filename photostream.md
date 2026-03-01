---
layout: page
title: Photo Stream
permalink: /photostream/
hide_page_title: true
body_class: photo-immersive
hide_global_header: true
---

{% assign photos = site.static_files | where_exp: "item", "item.path contains '/assets/photo_lib/'" %}

<div id="photoArchiveApp" class="photo-archive-app">
  <header class="photo-page-header">
    <div class="container">
      <div class="photo-page-header-tools">
        <button class="photo-page-home" id="photoBackPageButton" type="button" aria-label="Back to home">
          <i class="ri-arrow-left-line"></i>
        </button>
      </div>
      <h1 class="photo-page-header-title">
        <button class="photo-page-title-button" id="photoTopButton" type="button" aria-label="Back to top">MINNONG PHOTO</button>
      </h1>
    </div>
  </header>

  <div class="photo-home-list-wrap">
    <div class="photo-archive-grid" id="photoAlbumGrid"></div>
  </div>
</div>

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
    var backPageButton = document.getElementById("photoBackPageButton");
    var topButton = document.getElementById("photoTopButton");
    var detailRootUrl = "{{ '/photostream/post/' | relative_url }}";

    function toTitleCase(text) {
      return (text || "").replace(/\w\S*/g, function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    }

    function escapeHtml(text) {
      return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
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
          date: dateText,
          timestamp: latestTs || Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000
        };
      }

      var fallback = latestTs ? new Date(latestTs * 1000) : new Date();
      var y = fallback.getFullYear();
      var m = String(fallback.getMonth() + 1).padStart(2, "0");
      var d = String(fallback.getDate()).padStart(2, "0");

      return {
        title: toTitleCase(raw.replace(/[-_]+/g, " ")),
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
      var slug = slugify(albumName) || ("album-" + String(index + 1));
      var displayDate = slug === "santorini" ? "12.27 ~ 12.31" : meta.date;
      return {
        slug: slug,
        title: meta.title,
        date: displayDate,
        coverImage: albumPhotos[0] ? albumPhotos[0].url : "",
        description: albumPhotos[0] && albumPhotos[0].caption ? albumPhotos[0].caption : "필름 사진 기록",
        timestamp: meta.timestamp
      };
    }).sort(function (a, b) {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    function renderAlbums() {
      if (!albumGrid) return;
      albumGrid.innerHTML = "";

      albums.forEach(function (album) {
        var card = document.createElement("button");
        card.className = "photo-album-card";
        card.type = "button";
        card.innerHTML =
          '<div class="photo-album-cover"><img loading="lazy" src="' + album.coverImage + '" alt="' + escapeHtml(album.title) + '">' +
          '<div class="photo-album-card-meta">' +
            '<h3 class="photo-album-card-title">' + escapeHtml(album.title) + '</h3>' +
            '<p class="photo-album-date">' + escapeHtml(album.date) + '</p>' +
            '<p class="photo-album-card-description">' + escapeHtml(album.description) + '</p>' +
          '</div>' +
          '</div>';

        card.addEventListener("click", function () {
          try { sessionStorage.setItem("photo_album_list_scroll", String(window.scrollY || window.pageYOffset || 0)); } catch (e) {}
          window.location.href = detailRootUrl + "?album=" + encodeURIComponent(album.slug);
        });
        albumGrid.appendChild(card);
      });
    }

    function syncPhotoStreamHeaderState() {
      var y = window.scrollY || window.pageYOffset || 0;
      var isScrolled = document.body.classList.contains("is-scrolled");
      var enterThreshold = 160;
      var leaveThreshold = 72;

      if (!isScrolled && y > enterThreshold) {
        document.body.classList.add("is-scrolled");
      } else if (isScrolled && y < leaveThreshold) {
        document.body.classList.remove("is-scrolled");
      }
    }

    if (topButton) {
      topButton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (backPageButton) {
      backPageButton.addEventListener("click", function () {
        window.location.href = "{{ '/' | relative_url }}";
      });
    }

    renderAlbums();
    window.addEventListener("scroll", syncPhotoStreamHeaderState, { passive: true });
    syncPhotoStreamHeaderState();

    try {
      var savedY = parseInt(sessionStorage.getItem("photo_album_list_scroll") || "", 10);
      if (!isNaN(savedY) && savedY > 0) {
        window.scrollTo(0, savedY);
      }
      sessionStorage.removeItem("photo_album_list_scroll");
    } catch (e) {}
  })();
</script>
