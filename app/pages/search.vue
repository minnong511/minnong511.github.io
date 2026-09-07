<script setup lang="ts">
import MiniSearch from 'minisearch'
import type { BlogPost } from '~/types/content'
import { normalizeContentPath, postTimestamp } from '~/utils/content'

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
  title: '검색',
  description: '제목, 설명, 카테고리, 태그와 본문에서 블로그 게시물을 검색합니다.',
})
</script>

<template>
  <section class="ide-page ide-search-page" aria-labelledby="pageTitle">
    <header class="ide-document-header ide-list-header">
      <div class="ide-document-meta">
        <strong>SEARCH</strong>
        <span>전체 {{ posts.length }}개 글</span>
      </div>
      <h1 id="pageTitle">검색</h1>
      <p class="ide-document-deck">제목부터 본문까지, 궁금한 내용을 찾아보세요.</p>
    </header>

    <div class="ide-search-content">
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

      <IdePostList v-if="results.length" :posts="results" :query="query" />
      <div v-else-if="query.trim()" class="ide-empty"><p>검색 결과가 없습니다. 다른 표현으로 검색해 보세요.</p><button class="ide-home-action" type="button" @click="query = ''">검색어 지우기</button></div>
    </div>
  </section>
</template>
