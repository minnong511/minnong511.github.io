<script setup lang="ts">
import { postMatches, postTimestamp } from '~/utils/content'
import { categoryKey, categoryLabel, postMatchesCategory, topicForPost, topicSummaries } from '~/utils/topics'

type SortMode = 'newest' | 'oldest' | 'title'
const route = useRoute()
const router = useRouter()
const { posts } = await useContentIndex()
const first = (value: unknown) => Array.isArray(value) ? String(value[0] || '') : String(value || '')
const toSort = (value: unknown): SortMode => ['oldest', 'title'].includes(first(value)) ? first(value) as SortMode : 'newest'
const filterFromRoute = () => first(route.query.topic) ? `topic:${first(route.query.topic)}` : categoryKey(first(route.query.category))
const searchQuery = ref(first(route.query.q))
const selectedFilter = ref(filterFromRoute())
const sortMode = ref<SortMode>(toSort(route.query.sort))
const topics = computed(() => topicSummaries(posts.value))
const categories = computed(() => {
  const names = new Map<string, string>()
  posts.value.forEach(post => post.categories.forEach(name => names.set(categoryKey(name), categoryLabel(name))))
  return [...names].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})
const visiblePosts = computed(() => posts.value.filter(post => {
  const filter = selectedFilter.value
  const matches = filter.startsWith('topic:') ? topicForPost(post).key === filter.slice(6) : postMatchesCategory(post, filter)
  return matches && postMatches(post, searchQuery.value)
}).sort((a, b) => sortMode.value === 'title' ? a.title.localeCompare(b.title, 'ko')
  : (postTimestamp(a) - postTimestamp(b)) * (sortMode.value === 'oldest' ? 1 : -1)))
const filterLabel = computed(() => selectedFilter.value.startsWith('topic:')
  ? topics.value.find(topic => `topic:${topic.key}` === selectedFilter.value)?.name || '선택한 주제'
  : categories.value.find(category => category.key === selectedFilter.value)?.name || '')
const hasFilters = computed(() => Boolean(searchQuery.value || selectedFilter.value || sortMode.value !== 'newest'))
function resetFilters() { searchQuery.value = ''; selectedFilter.value = ''; sortMode.value = 'newest' }
watch(() => [route.query.q, route.query.category, route.query.topic, route.query.sort], () => {
  searchQuery.value = first(route.query.q)
  selectedFilter.value = filterFromRoute()
  sortMode.value = toSort(route.query.sort)
})
watch([searchQuery, selectedFilter, sortMode], () => {
  const query = { ...route.query }
  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  else delete query.q
  delete query.topic
  delete query.category
  if (selectedFilter.value.startsWith('topic:')) query.topic = selectedFilter.value.slice(6)
  else if (selectedFilter.value) query.category = selectedFilter.value
  if (sortMode.value !== 'newest') query.sort = sortMode.value
  else delete query.sort
  void router.replace({ path: route.path, query })
})
useSiteSeo({ title: '전체 글', description: '주제와 검색어로 공부 기록을 찾아보세요.' })
</script>

<template>
  <section class="ide-archive" aria-labelledby="archiveTitle">
    <header class="ide-document-header ide-list-header">
      <div class="ide-document-meta"><strong>STUDY ARCHIVE</strong><span>전체 {{ posts.length }}개 글</span></div>
      <h1 id="archiveTitle">전체 글</h1>
      <p class="ide-document-deck">주제와 검색어로 공부 기록을 찾아보세요.</p>
    </header>
    <div class="ide-archive-toolbar">
      <label class="sr-only" for="archiveSearch">게시물 검색</label>
      <input id="archiveSearch" v-model="searchQuery" class="ide-input" type="search" autocomplete="off" placeholder="제목, 설명, 태그로 검색" @keydown.esc="searchQuery = ''">
      <label class="sr-only" for="archiveCategory">주제와 카테고리</label>
      <select id="archiveCategory" v-model="selectedFilter" class="ide-select">
        <option value="">전체 주제</option>
        <optgroup label="주제별로 읽기"><option v-for="topic in topics" :key="topic.key" :value="`topic:${topic.key}`">{{ topic.name }} ({{ topic.count }})</option></optgroup>
        <optgroup label="세부 카테고리"><option v-for="category in categories" :key="category.key" :value="category.key">{{ category.name }}</option></optgroup>
      </select>
      <label class="sr-only" for="archiveSort">게시물 정렬</label>
      <select id="archiveSort" v-model="sortMode" class="ide-select"><option value="newest">최신순</option><option value="oldest">오래된순</option><option value="title">제목순</option></select>
    </div>
    <div class="ide-results-toolbar">
      <p role="status" aria-live="polite"><template v-if="filterLabel">{{ filterLabel }} · </template><template v-if="searchQuery.trim()">‘{{ searchQuery.trim() }}’ 검색 결과 </template>{{ visiblePosts.length }}개 글</p>
      <button v-if="hasFilters" class="ide-text-button" type="button" @click="resetFilters">조건 초기화</button>
    </div>
    <IdePostList v-if="visiblePosts.length" :posts="visiblePosts" :query="searchQuery" />
    <div v-else class="ide-empty"><p>조건에 맞는 글이 없습니다. 다른 검색어나 주제로 찾아보세요.</p><button v-if="hasFilters" class="ide-home-action" type="button" @click="resetFilters">전체 글 보기</button></div>
  </section>
</template>
