---
layout: page
title: Archive
permalink: /archive/
---

게시글 아카이브입니다.

{% if site.posts.size > 0 %}
<div class="archive-list">
  {% for post in site.posts %}
  <a class="archive-item" href="{{ post.url | relative_url }}">
    <time>{{ post.date | date: "%Y.%m.%d" }}</time>
    <strong>{{ post.title }}</strong>
    <span>{{ post.excerpt | strip_html | truncate: 90 }}</span>
  </a>
  {% endfor %}
</div>
{% else %}
<p class="empty-msg">아카이브에 표시할 게시글이 없습니다.</p>
{% endif %}
