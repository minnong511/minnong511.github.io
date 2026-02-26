---
layout: page
title: Blog update
permalink: /blog-update/
---

블로그 업데이트 로그

{% assign blog_update_posts = site.posts | where_exp: "post", "post.categories contains 'Blog update'" %}

{% if blog_update_posts.size > 0 %}
<div class="archive-list">
  {% for post in blog_update_posts %}
  <a class="archive-item" href="{{ post.url | relative_url }}">
    <time>{{ post.date | date: "%Y.%m.%d" }}</time>
    <strong>{{ post.title }}</strong>
    <span>{{ post.excerpt | strip_html | truncate: 90 }}</span>
  </a>
  {% endfor %}
</div>
{% else %}
<p class="empty-msg">Blog update 카테고리 게시글이 없습니다.</p>
{% endif %}
