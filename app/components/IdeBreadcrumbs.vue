<script setup lang="ts">
import { categoryKey, categoryLabel } from '~/utils/topics'
const route = useRoute()
const documentContext = useDocumentContext()

const pageTitles: Record<string, string> = {
  '/': '홈',
  '/archive/': '전체 글',
  '/tags/': '태그',
  '/search/': '검색',
  '/about/': '소개',
}

const currentLabel = computed(() => {
  const post = documentContext.currentPost.value
  if (post) return `${post.path.split('/').filter(Boolean).at(-1) || 'document'}.md`
  return pageTitles[route.path] || route.path.split('/').filter(Boolean).at(-1) || 'workspace'
})
</script>

<template>
  <nav class="ide-breadcrumbs" aria-label="현재 경로">
    <NuxtLink to="/">홈</NuxtLink>
    <template v-if="documentContext.currentPost.value">
      <span aria-hidden="true">&gt;</span>
      <NuxtLink to="/archive/">전체 글</NuxtLink>
      <template v-for="category in documentContext.currentPost.value.categories" :key="category">
        <span aria-hidden="true">&gt;</span>
        <NuxtLink
          :to="{ path: '/archive/', query: { category: categoryKey(category) } }"
        >{{ categoryLabel(category) }}</NuxtLink>
      </template>
    </template>
    <span v-if="route.path !== '/'" aria-hidden="true">&gt;</span>
    <span v-if="route.path !== '/'" aria-current="page">{{ currentLabel }}</span>
  </nav>
</template>
