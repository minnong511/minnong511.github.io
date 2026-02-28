---
layout: page
title: Tags
permalink: /tags/
---

{% if site.tags.size > 0 %}
  {% assign sorted_tags = site.tags | sort %}
  <div class="tag-hub" id="tagHub">
    <section class="tag-hub-cloud" aria-label="Tag collection">
      <button class="tag-hub-chip is-active" data-tag="all" style="--tag-index: 0;" type="button">
        <span>All</span>
      </button>
      {% for tag_item in sorted_tags %}
        {% assign tag_name = tag_item[0] %}
        {% assign tag_posts = tag_item[1] %}
        <button class="tag-hub-chip" data-tag="{{ tag_name | slugify }}" style="--tag-index: {{ forloop.index }};" type="button">
          <span>#{{ tag_name }}</span>
          <small>{{ tag_posts.size }}</small>
        </button>
      {% endfor %}
    </section>

    <section class="tag-hub-results" id="tagResults" aria-live="polite">
      <p class="tag-hub-placeholder" id="tagHubPlaceholder">태그를 선택하면 관련 포스트가 표시됩니다.</p>
      {% for tag_item in sorted_tags %}
        {% assign tag_name = tag_item[0] %}
        {% assign tag_posts = tag_item[1] %}
        <div id="{{ tag_name | slugify }}" class="tag-result is-hidden" data-tag="{{ tag_name | slugify }}">
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
        </div>
      {% endfor %}
    </section>
  </div>

  <script>
    (function () {
      var hub = document.getElementById('tagHub');
      if (!hub) return;

      var chips = Array.prototype.slice.call(hub.querySelectorAll('.tag-hub-chip'));
      var sections = Array.prototype.slice.call(hub.querySelectorAll('.tag-result'));
      var knownTags = {};

      sections.forEach(function (section) {
        knownTags[section.dataset.tag] = true;
      });

      var placeholder = document.getElementById('tagHubPlaceholder');

      var selectedTags = [];

      function normalizeFromHash(rawHash) {
        var raw = (rawHash || '').replace(/^#/, '').trim();
        if (!raw) return [];
        if (raw === 'all') return ['all'];
        return raw
          .split(',')
          .map(function (t) { return t.trim(); })
          .filter(function (t) { return knownTags[t]; });
      }

      function applySelection(syncHash) {
        var isAll = selectedTags.indexOf('all') !== -1;

        chips.forEach(function (chip) {
          var tag = chip.dataset.tag;
          var active = isAll ? tag === 'all' : selectedTags.indexOf(tag) !== -1;
          chip.classList.toggle('is-active', active);
        });

        var hasVisible = false;
        sections.forEach(function (section) {
          var visible = isAll || selectedTags.indexOf(section.dataset.tag) !== -1;
          section.classList.toggle('is-hidden', !visible);
          if (visible) hasVisible = true;
        });

        if (placeholder) {
          placeholder.classList.toggle('is-hidden', hasVisible);
        }

        if (!syncHash) return;
        if (!selectedTags.length || isAll) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          history.replaceState(null, '', '#' + selectedTags.join(','));
        }
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var tag = chip.dataset.tag;

          if (tag === 'all') {
            selectedTags = ['all'];
            applySelection(true);
            return;
          }

          selectedTags = selectedTags.filter(function (t) { return t !== 'all'; });
          var idx = selectedTags.indexOf(tag);
          if (idx === -1) selectedTags.push(tag);
          else selectedTags.splice(idx, 1);

          applySelection(true);
        });
      });

      selectedTags = normalizeFromHash(window.location.hash);
      if (!selectedTags.length) selectedTags = [];
      applySelection(false);

      requestAnimationFrame(function () {
        hub.classList.add('is-ready');
      });
    })();
  </script>
{% else %}
  <p class="empty-msg">태그가 아직 없습니다. 포스트 front matter에 <code>tags</code>를 추가해보세요.</p>
{% endif %}
