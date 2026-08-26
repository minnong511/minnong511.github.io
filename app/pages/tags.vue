<script setup lang="ts">
import { formatPostDate, postTimestamp, primaryCategory } from '~/utils/content'

const route = useRoute()
const router = useRouter()
const { posts } = await useContentIndex()

const coreTopics = [
  {
    key: 'ai',
    name: 'AI',
    description: '모델, 검색, 학습',
    tags: ['deep-learning', 'multimodal', 'retrieval', 'training'],
  },
  {
    key: 'computer-science',
    name: 'Computer Science',
    description: '알고리즘과 컴퓨터 과학',
    tags: ['algorithm', 'sorting', 'cs'],
  },
  {
    key: 'web-blog',
    name: 'Web & Blog',
    description: '블로그를 만들고 다듬은 기록',
    tags: ['design', 'ui', 'reference', 'library', 'jekyll'],
  },
  {
    key: 'places',
    name: 'Places',
    description: '맛집과 서울의 주말 기록',
    tags: ['food', 'seoul', 'weekend'],
  },
] as const

function tagKey(value: string): string {
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

function parseHash(hash: string): string[] {
  return hash
    .replace(/^#/, '')
    .split(',')
    .map((value) => {
      try {
        return decodeURIComponent(value).trim()
      } catch {
        return value.trim()
      }
    })
    .filter(Boolean)
}

function sameTags(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every(tag => rightSet.has(tag))
}

const orderedPosts = computed(() => [...posts.value].sort((a, b) => postTimestamp(b) - postTimestamp(a)))
const tagOptions = computed(() => {
  const summaries = new Map<string, { key: string, name: string, count: number }>()

  posts.value.forEach((post) => {
    const uniquePostTags = new Map<string, string>()
    post.tags.forEach(name => uniquePostTags.set(tagKey(name), name))
    uniquePostTags.forEach((name, key) => {
      const current = summaries.get(key)
      summaries.set(key, { key, name, count: (current?.count || 0) + 1 })
    })
  })

  return [...summaries.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

const selectedTags = ref<string[]>([])
const selectedTopicKey = ref<string | null>(null)

function matchingTopicKey(tags: readonly string[]): string | null {
  return coreTopics.find(topic => sameTags(topic.tags, tags))?.key || null
}

function applyHash(hash: string): void {
  const knownTags = new Set(tagOptions.value.map(tag => tag.key))
  const nextTags = [...new Set(parseHash(hash).filter(tag => knownTags.has(tag)))]
  selectedTags.value = nextTags
  selectedTopicKey.value = matchingTopicKey(nextTags)
}

function syncHash(): void {
  const hash = selectedTags.value.length
    ? `#${selectedTags.value.map(tag => encodeURIComponent(tag)).join(',')}`
    : ''
  void router.replace({ path: route.path, query: route.query, hash })
}

function showAll(): void {
  selectedTags.value = []
  selectedTopicKey.value = null
  syncHash()
}

function toggleTag(key: string): void {
  selectedTopicKey.value = null
  selectedTags.value = selectedTags.value.includes(key)
    ? selectedTags.value.filter(tag => tag !== key)
    : [...selectedTags.value, key]
  syncHash()
}

function selectTopic(key: string): void {
  const topic = coreTopics.find(item => item.key === key)
  if (!topic) return
  selectedTopicKey.value = key
  selectedTags.value = [...topic.tags]
  syncHash()
}

watch(() => route.hash, (hash) => {
  const nextTags = parseHash(hash)
  if (!sameTags(nextTags, selectedTags.value)) applyHash(hash)
}, { immediate: true })

const visiblePosts = computed(() => {
  if (!selectedTags.value.length) return orderedPosts.value.slice(0, 6)
  const selected = new Set(selectedTags.value)
  return orderedPosts.value.filter(post => post.tags.some(tag => selected.has(tagKey(tag))))
})

const resultHeading = computed(() => {
  const topic = coreTopics.find(item => item.key === selectedTopicKey.value)
  if (topic) return { kicker: 'TOPIC NOTES', title: topic.name }
  if (selectedTags.value.length) {
    const tagNames = new Map(tagOptions.value.map(tag => [tag.key, tag.name]))
    return {
      kicker: 'TAGGED NOTES',
      title: selectedTags.value.map(tag => `#${tagNames.get(tag) || tag}`).join(', '),
    }
  }
  return { kicker: 'RECENT NOTES', title: '최근 기록' }
})

useSiteSeo({
  title: 'Topics',
  description: '주요 주제와 세부 태그로 공부 기록을 탐색합니다.',
})
</script>

<template>
  <section class="ide-page" aria-labelledby="pageTitle">
    <header class="ide-document-header">
      <div class="ide-document-meta">
        <strong>PAGE</strong>
        <span>MINNONG WORKSPACE</span>
      </div>
      <h1 id="pageTitle">Topics</h1>
      <p class="ide-document-deck">Browse by subject and keyword.</p>
    </header>

    <article class="ide-document-content prose">
      <div class="tag-hub">
        <section class="primary-topic-section" aria-labelledby="primaryTopicsTitle">
          <div class="topic-section-heading">
            <span class="section-kicker">CORE TOPICS</span>
            <h2 id="primaryTopicsTitle">주요 주제</h2>
          </div>
          <div class="primary-topic-grid">
            <button
              v-for="topic in coreTopics"
              :key="topic.key"
              class="primary-topic-card"
              :class="{ 'is-active': selectedTopicKey === topic.key }"
              type="button"
              :aria-pressed="selectedTopicKey === topic.key"
              aria-controls="tagResults"
              @click="selectTopic(topic.key)"
            >
              <strong>{{ topic.name }}</strong>
              <span>{{ topic.description }}</span>
              <i class="ri-arrow-right-line" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section class="secondary-topic-section" aria-labelledby="secondaryTopicsTitle">
          <div class="topic-section-heading topic-section-heading-compact">
            <span class="section-kicker">DETAIL TAGS</span>
            <h2 id="secondaryTopicsTitle">세부 태그</h2>
          </div>
          <div class="tag-hub-cloud" aria-label="태그 목록">
            <button
              class="tag-hub-chip"
              :class="{ 'is-active': !selectedTags.length }"
              type="button"
              :aria-pressed="!selectedTags.length"
              aria-controls="tagResults"
              @click="showAll"
            >
              <span>전체</span>
            </button>
            <button
              v-for="tag in tagOptions"
              :key="tag.key"
              class="tag-hub-chip"
              :class="{ 'is-active': selectedTags.includes(tag.key) }"
              type="button"
              :aria-pressed="selectedTags.includes(tag.key)"
              aria-controls="tagResults"
              @click="toggleTag(tag.key)"
            >
              <span>#{{ tag.name }}</span>
              <small>{{ tag.count }}</small>
            </button>
          </div>
        </section>

        <section id="tagResults" class="tag-hub-results" aria-live="polite">
          <div class="topic-results-heading">
            <span class="section-kicker">{{ resultHeading.kicker }}</span>
            <h2>{{ resultHeading.title }}</h2>
          </div>
          <div v-if="visiblePosts.length" class="ide-archive-list">
            <NuxtLink
              v-for="post in visiblePosts"
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
          <p v-else class="ide-empty">선택한 주제나 태그에 해당하는 게시물이 없습니다.</p>
        </section>
      </div>
    </article>
  </section>
</template>
