<script setup lang="ts">
import { formatPostDate, postTimestamp, primaryCategory } from '~/utils/content'

const { posts } = await useContentIndex()

function categoryKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replaceAll('_', '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
}

function categoryLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

const orderedPosts = computed(() => [...posts.value].sort((a, b) => postTimestamp(b) - postTimestamp(a)))
const recentPosts = computed(() => orderedPosts.value.slice(0, 6))
const categories = computed(() => {
  const summaries = new Map<string, { key: string, name: string, count: number }>()

  posts.value.forEach((post) => {
    const postCategories = post.categories.length ? post.categories : ['workspace']
    const uniqueCategories = new Set(postCategories.map(category => category.trim()).filter(Boolean))

    uniqueCategories.forEach((name) => {
      const key = categoryKey(name)
      const current = summaries.get(key)
      summaries.set(key, {
        key,
        name,
        count: (current?.count || 0) + 1,
      })
    })
  })

  return [...summaries.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

useSiteSeo({
  title: "Minnong's Study Log",
  description: '이민형의 개발 공부 기록입니다.',
})
</script>

<template>
  <section class="ide-home" aria-labelledby="homeTitle">
    <span class="ide-home-kicker">MINNONG.DEV / WORKSPACE</span>
    <h1 id="homeTitle">MINNONG'S Blog</h1>
    <p class="ide-home-intro">이민형의 블로그입니다</p>

    <div class="ide-home-visual" aria-hidden="true">
      <IdeAmbientThree />
      <div class="ide-home-visual-frame">
        <span>STUDY SPACE / LIVE MODEL</span>
        <strong>BUILD · LEARN · LOG</strong>
      </div>
    </div>

    <div class="ide-home-actions" aria-label="빠른 작업">
      <NuxtLink class="ide-home-action" to="/archive/">
        <i class="ri-file-search-line" aria-hidden="true" />
        전체 게시물
      </NuxtLink>
      <NuxtLink class="ide-home-action" to="/search/">
        <i class="ri-search-line" aria-hidden="true" />
        게시물 검색
        <kbd>⌘K</kbd>
      </NuxtLink>
      <NuxtLink class="ide-home-action" to="/about/">
        <i class="ri-information-line" aria-hidden="true" />
        소개 보기
      </NuxtLink>
    </div>

    <section aria-labelledby="homeCategoriesTitle">
      <header class="ide-section-heading">
        <h2 id="homeCategoriesTitle">CATEGORIES</h2>
        <span>{{ categories.length }} folders</span>
      </header>
      <div v-if="categories.length" class="ide-category-list">
        <NuxtLink
          v-for="(category, index) in categories"
          :key="category.key"
          class="ide-category-row"
          :to="{ path: '/archive/', query: { category: category.key } }"
          :aria-label="`${categoryLabel(category.name)} 카테고리, 게시물 ${category.count}개`"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong><i class="ri-folder-3-line" aria-hidden="true" /> {{ categoryLabel(category.name) }}</strong>
          <small>{{ category.count }} posts</small>
          <i class="ri-arrow-right-line" aria-hidden="true" />
        </NuxtLink>
      </div>
      <p v-else class="ide-empty">아직 분류된 게시물이 없습니다.</p>
    </section>

    <section aria-labelledby="recentTitle">
      <header class="ide-section-heading">
        <h2 id="recentTitle">RECENT DOCUMENTS</h2>
        <span>{{ posts.length }} indexed</span>
      </header>
      <div v-if="recentPosts.length" class="ide-archive-list">
        <NuxtLink
          v-for="post in recentPosts"
          :key="post.path"
          class="ide-archive-row"
          :to="post.path"
        >
          <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
          <strong>{{ post.title }}</strong>
          <span>{{ categoryLabel(primaryCategory(post)) }}</span>
          <i class="ri-arrow-right-line" aria-hidden="true" />
        </NuxtLink>
      </div>
      <p v-else class="ide-empty">아직 게시물이 없습니다. Explorer에서 카테고리를 선택해 문서를 찾아보세요.</p>
    </section>
  </section>
</template>
