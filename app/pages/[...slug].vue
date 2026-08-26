<script setup lang="ts">
import { formatPostDate, normalizeContentPath, primaryCategory } from '~/utils/content'

const route = useRoute()
const { posts, findByPath } = await useContentIndex()
const documentContext = useDocumentContext()

const initialPost = findByPath(route.path)
if (!initialPost) {
  throw createError({ statusCode: 404, statusMessage: '게시물을 찾을 수 없습니다.' })
}

const postPath = computed(() => normalizeContentPath(route.path))
const { data: postDocument } = await useAsyncData(
  computed(() => `post-document:${postPath.value}`),
  () => queryCollection('posts')
    .where('published', '=', true)
    .where('legacyPath', '=', postPath.value)
    .first(),
)
if (!postDocument.value) {
  throw createError({ statusCode: 404, statusMessage: '게시물 본문을 찾을 수 없습니다.' })
}

const post = computed(() => findByPath(route.path) || initialPost)
const index = computed(() => posts.value.findIndex(item => item.path === post.value.path))
const previousPost = computed(() => posts.value[index.value + 1])
const nextPost = computed(() => index.value > 0 ? posts.value[index.value - 1] : undefined)

function tagKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replaceAll('_', '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
}

watch(post, (value) => {
  documentContext.currentPost.value = value
}, { immediate: true })

onBeforeUnmount(() => {
  if (documentContext.currentPost.value?.path === post.value.path) documentContext.reset()
})

const seo = useSiteSeo({
  title: () => post.value.title,
  description: () => post.value.description || post.value.summary,
  path: () => post.value.path,
  type: 'article',
  image: () => post.value.image || undefined,
  robots: () => post.value.robots || undefined,
  article: {
    publishedTime: () => post.value.date,
    modifiedTime: () => post.value.lastModifiedAt || post.value.date,
    section: () => primaryCategory(post.value),
    tags: () => post.value.tags,
  },
})

useHead(() => ({
  script: [{
    key: 'article-json-ld',
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.value.title,
      description: post.value.description || post.value.summary,
      image: [seo.imageUrl.value],
      datePublished: post.value.date,
      dateModified: post.value.lastModifiedAt || post.value.date,
      articleSection: primaryCategory(post.value),
      keywords: post.value.tags,
      mainEntityOfPage: { '@type': 'WebPage', '@id': seo.canonicalUrl.value },
      author: { '@type': 'Person', name: seo.author },
    }).replaceAll('<', '\\u003c'),
  }],
}))
</script>

<template>
  <article class="ide-document" data-document="post">
    <header class="ide-document-header">
      <div class="ide-document-meta">
        <strong>{{ post.categories.join(' / ').replaceAll('_', ' ') || 'Study' }}</strong>
        <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
        <span>{{ documentContext.readingMinutes.value }} min read</span>
        <span>{{ post.tags.length }} tags</span>
      </div>
      <h1>{{ post.title }}</h1>
      <p v-if="post.description" class="ide-document-deck">{{ post.description }}</p>
    </header>

    <aside v-if="post.summary || post.keyConcepts.length || post.strengths.length || post.tradeoffs.length" class="ide-reading-summary" aria-labelledby="readingSummaryTitle">
      <section v-if="post.summary" class="ide-summary-card ide-summary-card-primary">
        <span class="ide-panel-label">QUICK SUMMARY</span>
        <h2 id="readingSummaryTitle">핵심 요약</h2>
        <p>{{ post.summary }}</p>
      </section>
      <section v-if="post.keyConcepts.length" class="ide-summary-card">
        <span class="ide-panel-label">KEY CONCEPTS</span>
        <h2>핵심 개념</h2>
        <ul><li v-for="item in post.keyConcepts" :key="item">{{ item }}</li></ul>
      </section>
      <section v-if="post.strengths.length || post.tradeoffs.length" class="ide-summary-card ide-summary-card-split">
        <span class="ide-panel-label">TRADE-OFFS</span>
        <h2>장단점 빠르게 보기</h2>
        <div class="ide-summary-columns">
          <div v-if="post.strengths.length"><h3>장점</h3><ul><li v-for="item in post.strengths" :key="item">{{ item }}</li></ul></div>
          <div v-if="post.tradeoffs.length"><h3>살펴볼 점</h3><ul><li v-for="item in post.tradeoffs" :key="item">{{ item }}</li></ul></div>
        </div>
      </section>
    </aside>

    <div id="postContent" class="ide-document-content prose">
      <ContentRenderer v-if="postDocument" :value="postDocument" />
    </div>

    <footer v-if="post.tags.length" class="ide-document-tags">
      <span class="ide-panel-label">TAGS</span>
      <NuxtLink v-for="tag in post.tags" :key="tag" :to="{ path: '/tags/', hash: `#${tagKey(tag)}` }">#{{ tag }}</NuxtLink>
    </footer>

    <nav v-if="previousPost || nextPost" class="ide-document-navigation" aria-label="게시물 이동">
      <NuxtLink v-if="previousPost" :to="previousPost.path"><span>PREVIOUS</span><strong>{{ previousPost.title }}</strong></NuxtLink>
      <span v-else aria-hidden="true" />
      <NuxtLink v-if="nextPost" :to="nextPost.path"><span>NEXT</span><strong>{{ nextPost.title }}</strong></NuxtLink>
    </nav>

    <IdeGiscus :key="post.path" />
  </article>
</template>
