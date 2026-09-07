<script setup lang="ts">
import { postTimestamp } from '~/utils/content'
import { topicSummaries } from '~/utils/topics'

const { posts } = await useContentIndex()
const recentPosts = computed(() => [...posts.value].sort((a, b) => postTimestamp(b) - postTimestamp(a)).slice(0, 6))
const topics = computed(() => topicSummaries(posts.value))
useSiteSeo({ title: "Minnong's Study Log", description: '개발과 AI를 공부하며 실험한 내용을 정리합니다.' })
</script>

<template>
  <section class="ide-home" aria-labelledby="homeTitle">
    <span class="ide-home-kicker">MINNONG.DEV / STUDY LOG</span>
    <h1 id="homeTitle">MINNONG'S Blog</h1>
    <p class="ide-home-intro">개발과 AI를 공부하며 실험한 내용을 정리합니다.</p>
    <div class="ide-home-actions" aria-label="빠른 탐색">
      <NuxtLink class="ide-home-action" to="/archive/"><i class="ri-file-list-3-line" aria-hidden="true" />전체 글</NuxtLink>
      <NuxtLink class="ide-home-action" to="/search/"><i class="ri-search-line" aria-hidden="true" />검색<kbd>⌘K</kbd></NuxtLink>
      <NuxtLink class="ide-home-action" to="/about/"><i class="ri-information-line" aria-hidden="true" />소개</NuxtLink>
    </div>
    <section aria-labelledby="recentTitle">
      <header class="ide-section-heading">
        <h2 id="recentTitle">최근 글</h2>
        <NuxtLink to="/archive/">전체 {{ posts.length }}개 보기 <i class="ri-arrow-right-line" aria-hidden="true" /></NuxtLink>
      </header>
      <IdePostList v-if="recentPosts.length" :posts="recentPosts" compact />
      <p v-else class="ide-empty">아직 게시물이 없습니다.</p>
    </section>
    <section id="topics" class="ide-home-topics" aria-labelledby="homeTopicsTitle">
      <header class="ide-section-heading"><h2 id="homeTopicsTitle">주제별로 읽기</h2><NuxtLink to="/archive/">전체 분류 보기</NuxtLink></header>
      <div class="ide-topic-grid">
        <NuxtLink v-for="topic in topics" :key="topic.key" class="ide-topic-link" :to="{ path: '/archive/', query: { topic: topic.key } }">
          <div><i class="ri-folder-3-line" aria-hidden="true" /><strong>{{ topic.name }}</strong><small>{{ topic.count }}개</small></div>
          <p>{{ topic.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </section>
</template>
