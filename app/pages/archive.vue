<script setup lang="ts">
import { formatPostDate, postMatches, postTimestamp, primaryCategory } from '~/utils/content'

type SortMode = 'newest' | 'oldest' | 'title'

const route = useRoute()
const router = useRouter()
const { posts } = await useContentIndex()

function firstQueryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

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

function toSortMode(value: unknown): SortMode {
  const mode = firstQueryValue(value)
  return mode === 'oldest' || mode === 'title' ? mode : 'newest'
}

const searchQuery = ref(firstQueryValue(route.query.q))
const selectedCategory = ref(firstQueryValue(route.query.category))
const sortMode = ref<SortMode>(toSortMode(route.query.sort))

const categories = computed(() => {
  const names = new Map<string, string>()
  posts.value.forEach((post) => {
    const postCategories = post.categories.length ? post.categories : ['workspace']
    postCategories.forEach((name) => names.set(categoryKey(name), name))
  })
  return [...names].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

const visiblePosts = computed(() => {
  const filtered = posts.value.filter((post) => {
    const matchesCategory = !selectedCategory.value
      || (post.categories.length ? post.categories : ['workspace'])
        .some(category => categoryKey(category) === selectedCategory.value)
    return matchesCategory && postMatches(post, searchQuery.value)
  })

  return [...filtered].sort((a, b) => {
    if (sortMode.value === 'title') return a.title.localeCompare(b.title, 'ko')
    const difference = postTimestamp(a) - postTimestamp(b)
    return sortMode.value === 'oldest' ? difference : -difference
  })
})

watch(
  () => [route.query.q, route.query.category, route.query.sort] as const,
  ([query, category, sort]) => {
    const nextQuery = firstQueryValue(query)
    const nextCategory = firstQueryValue(category)
    const nextSort = toSortMode(sort)
    if (nextQuery !== searchQuery.value) searchQuery.value = nextQuery
    if (nextCategory !== selectedCategory.value) selectedCategory.value = nextCategory
    if (nextSort !== sortMode.value) sortMode.value = nextSort
  },
)

watch([searchQuery, selectedCategory, sortMode], () => {
  const query = { ...route.query }

  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  else delete query.q

  if (selectedCategory.value) query.category = selectedCategory.value
  else delete query.category

  if (sortMode.value !== 'newest') query.sort = sortMode.value
  else delete query.sort

  void router.replace({ path: route.path, query })
})

useSiteSeo({
  title: 'Archive',
  description: '전체 게시물을 검색하고 카테고리와 정렬 순서로 탐색합니다.',
})
</script>

<template>
  <section class="ide-archive" aria-labelledby="archiveTitle">
    <header class="ide-document-header">
      <div class="ide-document-meta">
        <strong>EXPLORER</strong>
        <span>{{ posts.length }} indexed documents</span>
      </div>
      <h1 id="archiveTitle">All posts</h1>
      <p class="ide-document-deck">파일 목록처럼 빠르게 탐색하고 읽을 수 있는 전체 게시물 인덱스입니다.</p>
    </header>

    <div class="ide-archive-toolbar">
      <label class="sr-only" for="archiveSearch">게시물 검색</label>
      <input
        id="archiveSearch"
        v-model="searchQuery"
        class="ide-input"
        type="search"
        autocomplete="off"
        placeholder="제목, 설명, 카테고리, 태그 검색"
        @keydown.esc="searchQuery = ''"
      >

      <label class="sr-only" for="archiveCategory">카테고리 필터</label>
      <select id="archiveCategory" v-model="selectedCategory" class="ide-select">
        <option value="">전체 카테고리</option>
        <option v-for="category in categories" :key="category.key" :value="category.key">
          {{ categoryLabel(category.name) }}
        </option>
      </select>

      <label class="sr-only" for="archiveSort">게시물 정렬</label>
      <select id="archiveSort" v-model="sortMode" class="ide-select">
        <option value="newest">최신순</option>
        <option value="oldest">오래된순</option>
        <option value="title">제목순</option>
      </select>
    </div>

    <p class="sr-only" aria-live="polite">{{ visiblePosts.length }}개의 게시물이 표시됩니다.</p>
    <div v-if="visiblePosts.length" class="ide-archive-list">
      <NuxtLink
        v-for="post in visiblePosts"
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
    <p v-else class="ide-empty">{{ posts.length ? '조건에 맞는 게시물이 없습니다.' : '아직 게시물이 없습니다.' }}</p>
  </section>
</template>
