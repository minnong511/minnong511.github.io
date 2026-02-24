---
layout: page
title: Photo Stream
permalink: /photostream/
---

필름 사진과 일상 기록을 모아두는 공간입니다.

{% assign photos = site.static_files | where_exp: "item", "item.path contains '/assets/photo_lib/'" %}

{% if photos.size > 0 %}
<div class="photo-grid">
  {% for photo in photos %}
  <figure class="photo-item">
    <img src="{{ photo.path | relative_url }}" alt="Photo {{ forloop.index }}" loading="lazy" />
  </figure>
  {% endfor %}
</div>
{% else %}
<p class="empty-msg">`assets/photo_lib/` 폴더에 이미지를 넣으면 이 페이지에 자동으로 표시됩니다.</p>
{% endif %}
