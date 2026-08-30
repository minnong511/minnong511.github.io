<script setup lang="ts">
import MiniSearch from 'minisearch'
import type { BlogPost } from '~/types/content'
import { formatPostDate, normalizeContentPath, postTimestamp, primaryCategory } from '~/utils/content'

interface SearchRecord {
  title: string
  description: string
  url: string
  date: string
  categories: string[]
  tags: string[]
  content: string
}

const route = useRoute()
const router = useRouter()
const { posts } = await useContentIndex()
const { data: searchRecords } = await useFetch<SearchRecord[]>('/search.json', {
  default: () => [],
})

const searchEngine = computed(() => {
  const engine = new MiniSearch<SearchRecord>({
    idField: 'url',
    fields: ['title', 'description', 'categories', 'tags', 'content'],
    storeFields: ['url'],
    searchOptions: {
      boost: { title: 5, categories: 3, tags: 3, description: 2 },
      prefix: true,
      fuzzy: 0.2,
    },
  })
  engine.addAll(searchRecords.value)
  return engine
})

function firstQueryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function categoryLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

function relevance(post: BlogPost, query: string): number {
  const needle = query.trim().toLocaleLowerCase('ko-KR')
  const title = post.title.toLocaleLowerCase('ko-KR')
  const categories = post.categories.join(' ').toLocaleLowerCase('ko-KR')
  const tags = post.tags.join(' ').toLocaleLowerCase('ko-KR')
  const description = post.description.toLocaleLowerCase('ko-KR')
  return (title.includes(needle) ? 5 : 0)
    + (categories.includes(needle) ? 3 : 0)
    + (tags.includes(needle) ? 3 : 0)
    + (description.includes(needle) ? 2 : 0)
}

const query = ref(firstQueryValue(route.query.q))
const results = computed(() => {
  const value = query.value.trim()
  if (!value) return []
  const needle = value.toLocaleLowerCase('ko-KR')
  const scoreByPath = new Map(
    searchEngine.value.search(value).map(result => [normalizeContentPath(result.id), result.score]),
  )
  const bodyMatches = new Set(searchRecords.value
    .filter(record => [record.title, record.description, record.content, ...record.categories, ...record.tags]
      .join(' ')
      .toLocaleLowerCase('ko-KR')
      .includes(needle))
    .map(record => normalizeContentPath(record.url)))

  return posts.value
    .filter(post => scoreByPath.has(post.path) || bodyMatches.has(post.path))
    .sort((a, b) => (scoreByPath.get(b.path) || relevance(b, value))
      - (scoreByPath.get(a.path) || relevance(a, value))
      || postTimestamp(b) - postTimestamp(a))
})

watch(() => route.query.q, (value) => {
  const nextQuery = firstQueryValue(value)
  if (nextQuery !== query.value) query.value = nextQuery
})

watch(query, (value) => {
  const nextQuery = { ...route.query }
  if (value.trim()) nextQuery.q = value.trim()
  else delete nextQuery.q
  void router.replace({ path: route.path, query: nextQuery })
})

useSiteSeo({
  title: 'Search',
  description: '제목, 설명, 카테고리, 태그와 본문에서 블로그 게시물을 검색합니다.',
})
</script>

<template>
  <section class="ide-page" aria-labelledby="pageTitle">
    <header class="ide-document-header">
      <div class="ide-document-meta">
        <strong>SEARCH</strong>
        <span>{{ posts.length }} indexed documents</span>
      </div>
      <h1 id="pageTitle">Search</h1>
      <p class="ide-document-deck">검색어를 입력하면 제목, 설명, 카테고리, 태그와 본문에서 결과를 찾습니다.</p>
    </header>

    <article class="ide-document-content prose">
      <label class="sr-only" for="pageSearchInput">게시물 검색어</label>
      <input
        id="pageSearchInput"
        v-model="query"
        class="ide-input"
        type="search"
        autocomplete="off"
        placeholder="검색어를 입력하세요"
        @keydown.esc="query = ''"
      >

      <p class="search-page-help" aria-live="polite">
        <template v-if="query.trim()">‘{{ query.trim() }}’ 검색 결과 {{ results.length }}개</template>
        <template v-else>검색어를 입력해 주세요.</template>
      </p>

      <div v-if="results.length" id="search-page-results" class="search-page-results ide-archive-list">
        <NuxtLink
          v-for="post in results"
          :key="post.path"
          class="ide-archive-row"
          :to="post.path"
        >
          <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
          <strong>{{ post.title }}</strong>
          <span>{{ post.description || categoryLabel(primaryCategory(post)) }}</span>
          <i class="ri-arrow-right-line" aria-hidden="true" />
        </NuxtLink>
      </div>
      <p v-else-if="query.trim()" class="ide-empty">검색 결과가 없습니다.</p>
    </article>
  </section>
</template>
