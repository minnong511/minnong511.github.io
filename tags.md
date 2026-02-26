---
layout: page
title: Tags
permalink: /tags/
---

{% if site.tags.size > 0 %}
  <div class="tags-index">
    {% assign sorted_tags = site.tags | sort %}
    {% for tag_item in sorted_tags %}
      {% assign tag_name = tag_item[0] %}
      {% assign tag_posts = tag_item[1] %}
      <section id="{{ tag_name | slugify }}" class="tag-section">
        <h2 class="tag-section-title">#{{ tag_name }}</h2>
        <div class="archive-list">
          {% for post in tag_posts %}
            <a class="archive-item" href="{{ post.url | relative_url }}">
              <time>{{ post.date | date: "%Y.%m.%d" }}</time>
              <strong>{{ post.title }}</strong>
              <span>{{ post.excerpt | strip_html | truncate: 90 }}</span>
            </a>
          {% endfor %}
        </div>
      </section>
    {% endfor %}
  </div>
{% else %}
  <p class="empty-msg">태그가 아직 없습니다. 포스트 front matter에 <code>tags</code>를 추가해보세요.</p>
{% endif %}
