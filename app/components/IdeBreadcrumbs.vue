<script setup lang="ts">
const route = useRoute()
const documentContext = useDocumentContext()

const pageTitles: Record<string, string> = {
  '/': 'workspace',
  '/archive/': 'archive',
  '/tags/': 'topics',
  '/search/': 'search',
  '/about/': 'about',
}

function categoryKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replaceAll('_', '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
}

const currentLabel = computed(() => {
  const post = documentContext.currentPost.value
  if (post) return `${post.path.split('/').filter(Boolean).at(-1) || 'document'}.md`
  return pageTitles[route.path] || route.path.split('/').filter(Boolean).at(-1) || 'workspace'
})
</script>

<template>
  <nav class="ide-breadcrumbs" aria-label="현재 경로">
    <NuxtLink to="/">workspace</NuxtLink>
    <template v-if="documentContext.currentPost.value">
      <span aria-hidden="true">&gt;</span>
      <NuxtLink to="/archive/">posts</NuxtLink>
      <template v-for="category in documentContext.currentPost.value.categories" :key="category">
        <span aria-hidden="true">&gt;</span>
        <NuxtLink
          :to="{ path: '/archive/', query: { category: categoryKey(category) } }"
        >{{ category.replaceAll('_', ' ').toLocaleLowerCase('ko-KR') }}</NuxtLink>
      </template>
    </template>
    <span v-if="route.path !== '/'" aria-hidden="true">&gt;</span>
    <span v-if="route.path !== '/'" aria-current="page">{{ currentLabel }}</span>
  </nav>
</template>
