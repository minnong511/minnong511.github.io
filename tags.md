---
layout: page
title: Topics
permalink: /tags/
hide_page_index: true
page_hero_note: Browse by subject and keyword.
---

{% if site.tags.size > 0 %}
  {% assign sorted_tags = site.tags | sort %}
  {% assign primary_topic_names = "AI|Computer Science|Web & Blog|Places" | split: "|" %}
  {% assign primary_topic_descriptions = "모델, 검색, 학습|알고리즘과 컴퓨터 과학|블로그를 만들고 다듬은 기록|맛집과 서울의 주말 기록" | split: "|" %}
  {% assign primary_topic_tags = "deep-learning,multimodal,retrieval,training|algorithm,sorting,cs|design,ui,reference,library,jekyll|food,seoul,weekend" | split: "|" %}
  <div class="tag-hub" id="tagHub">
    <section class="primary-topic-section" aria-labelledby="primaryTopicsTitle">
      <div class="topic-section-heading">
        <span class="section-kicker">CORE TOPICS</span>
        <h2 id="primaryTopicsTitle">주요 주제</h2>
      </div>
      <div class="primary-topic-grid">
        {% for topic_name in primary_topic_names %}
          {% assign topic_index = forloop.index0 %}
          <button class="primary-topic-card" type="button" data-topic-key="{{ topic_name | slugify }}" data-topic-tags="{{ primary_topic_tags[topic_index] }}">
            <strong>{{ topic_name }}</strong>
            <span>{{ primary_topic_descriptions[topic_index] }}</span>
            <i class="ri-arrow-right-line" aria-hidden="true"></i>
          </button>
        {% endfor %}
      </div>
    </section>

    <section class="secondary-topic-section" aria-labelledby="secondaryTopicsTitle">
      <div class="topic-section-heading topic-section-heading-compact">
        <span class="section-kicker">DETAIL TAGS</span>
        <h2 id="secondaryTopicsTitle">세부 태그</h2>
      </div>
      <section class="tag-hub-cloud" aria-label="Tag collection">
        <button class="tag-hub-chip is-active" data-tag="all" style="--tag-index: 0;" type="button">
          <span>전체</span>
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
    </section>

    <section class="tag-hub-results" id="tagResults" aria-live="polite">
      <div class="tag-default-results" id="tagDefaultResults">
        <div class="topic-results-heading">
          <span class="section-kicker">RECENT NOTES</span>
          <h2>최근 기록</h2>
        </div>
        <div class="archive-list">
          {% for post in site.posts limit: 6 %}
            <a class="archive-item" href="{{ post.url | relative_url }}">
              <time>{{ post.date | date: "%Y.%m.%d" }}</time>
              <strong>{{ post.title }}</strong>
              <span>{{ post.excerpt | strip_html | truncate: 90 }}</span>
            </a>
          {% endfor %}
        </div>
      </div>
      {% for topic_name in primary_topic_names %}
        {% assign topic_index = forloop.index0 %}
        {% assign topic_tags = primary_topic_tags[topic_index] | split: "," %}
        {% assign topic_key = topic_name | slugify %}
        {% assign seen_urls = "|" %}
        <div class="primary-topic-result is-hidden" data-topic-result="{{ topic_key }}">
          <div class="topic-results-heading">
            <span class="section-kicker">TOPIC NOTES</span>
            <h2>{{ topic_name }}</h2>
          </div>
          <div class="archive-list">
            {% for post in site.posts %}
              {% assign post_matches = false %}
              {% for post_tag in post.tags %}
                {% assign normalized_post_tag = post_tag | slugify %}
                {% if topic_tags contains normalized_post_tag %}
                  {% assign post_matches = true %}
                {% endif %}
              {% endfor %}
              {% assign post_marker = post.url | append: "|" %}
              {% if post_matches %}
                {% unless seen_urls contains post_marker %}
                  <a class="archive-item" href="{{ post.url | relative_url }}">
                    <time>{{ post.date | date: "%Y.%m.%d" }}</time>
                    <strong>{{ post.title }}</strong>
                    <span>{{ post.excerpt | strip_html | truncate: 90 }}</span>
                  </a>
                  {% assign seen_urls = seen_urls | append: post_marker %}
                {% endunless %}
              {% endif %}
            {% endfor %}
          </div>
        </div>
      {% endfor %}
      <p class="tag-hub-placeholder is-hidden" id="tagHubPlaceholder">태그를 선택하면 관련 포스트가 표시됩니다.</p>
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
      var primaryTopics = Array.prototype.slice.call(hub.querySelectorAll('.primary-topic-card'));
      var primaryTopicResults = Array.prototype.slice.call(hub.querySelectorAll('.primary-topic-result'));
      var sections = Array.prototype.slice.call(hub.querySelectorAll('.tag-result'));
      var defaultResults = document.getElementById('tagDefaultResults');
      var knownTags = {};

      sections.forEach(function (section) {
        knownTags[section.dataset.tag] = true;
      });

      var placeholder = document.getElementById('tagHubPlaceholder');

      var selectedTags = [];
      var selectedTopic = null;
      var selectedTopicKey = null;

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

        primaryTopics.forEach(function (topic) {
          var topicTags = topic.dataset.topicTags.split(',').filter(Boolean);
          var active = selectedTopic && topicTags.join(',') === selectedTopic.join(',');
          topic.classList.toggle('is-active', Boolean(active));
        });

        var hasVisible = false;
        if (defaultResults) {
          defaultResults.classList.toggle('is-hidden', !isAll);
          hasVisible = isAll;
        }
        primaryTopicResults.forEach(function (result) {
          var visible = Boolean(selectedTopicKey && result.dataset.topicResult === selectedTopicKey);
          result.classList.toggle('is-hidden', !visible);
          if (visible) hasVisible = true;
        });
        sections.forEach(function (section) {
          var visible = !isAll && !selectedTopicKey && selectedTags.indexOf(section.dataset.tag) !== -1;
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
            selectedTopic = null;
            selectedTopicKey = null;
            applySelection(true);
            return;
          }

          selectedTopic = null;
          selectedTopicKey = null;
          selectedTags = selectedTags.filter(function (t) { return t !== 'all'; });
          var idx = selectedTags.indexOf(tag);
          if (idx === -1) selectedTags.push(tag);
          else selectedTags.splice(idx, 1);

          applySelection(true);
        });
      });

      primaryTopics.forEach(function (topic) {
        topic.addEventListener('click', function () {
          selectedTopic = topic.dataset.topicTags.split(',').filter(Boolean);
          selectedTopicKey = topic.dataset.topicKey;
          selectedTags = selectedTopic.slice();
          applySelection(true);
        });
      });

      selectedTags = normalizeFromHash(window.location.hash);
      if (!selectedTags.length) selectedTags = ['all'];
      applySelection(false);

      requestAnimationFrame(function () {
        hub.classList.add('is-ready');
      });
    })();
  </script>
{% else %}
  <p class="empty-msg">태그가 아직 없습니다. 포스트 front matter에 <code>tags</code>를 추가해보세요.</p>
{% endif %}
