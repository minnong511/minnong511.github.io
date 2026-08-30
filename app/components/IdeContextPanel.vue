<script setup lang="ts">
import type { BlogPost } from '~/types/content'
import { formatPostDate, postTimestamp } from '~/utils/content'

const props = defineProps<{ posts: BlogPost[] }>()
const emit = defineEmits<{ resize: [event: PointerEvent] }>()
const route = useRoute()
const workspace = useWorkspaceState()
const documentContext = useDocumentContext()
const main = inject<Ref<HTMLElement | null>>('ideMain', ref(null))
const activeTab = ref<'outline' | 'info' | 'related'>('outline')
const activeHeading = ref('')
const copyState = ref<'idle' | 'copied' | 'error'>('idle')

const post = computed(() => documentContext.currentPost.value)
const isBookmarked = computed(() => Boolean(post.value && workspace.bookmarks.value.some(item => item.url === post.value?.path)))
const related = computed(() => {
  if (!post.value) return props.posts.slice(0, 6)
  const categorySet = new Set(post.value.categories)
  const tagSet = new Set(post.value.tags)
  return props.posts
    .filter(item => item.path !== post.value?.path)
    .map(item => ({
      post: item,
      score: item.categories.filter(category => categorySet.has(category)).length * 3
        + item.tags.filter(tag => tagSet.has(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || postTimestamp(b.post) - postTimestamp(a.post))
    .slice(0, 6)
    .map(item => item.post)
})

function updateActiveHeading() {
  if (!import.meta.client || !documentContext.outline.value.length) return
  const containerTop = main.value?.getBoundingClientRect().top || 0
  const threshold = containerTop + 88
  let current = documentContext.outline.value[0]?.id || ''
  documentContext.outline.value.forEach((item) => {
    const heading = document.getElementById(item.id)
    if (heading && heading.getBoundingClientRect().top <= threshold) current = item.id
  })
  activeHeading.value = current
}

function goToHeading(id: string) {
  const heading = document.getElementById(id)
  if (!heading) return
  const target = main.value
  if (target) {
    const top = heading.getBoundingClientRect().top - target.getBoundingClientRect().top + target.scrollTop - 24
    target.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  } else {
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  history.replaceState(null, '', `${route.path}#${id}`)
  activeHeading.value = id
}

async function copyPageLink() {
  if (!import.meta.client) return
  const url = new URL(route.path, window.location.origin).href
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const input = document.createElement('textarea')
      input.value = url
      input.readOnly = true
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      const copied = document.execCommand('copy')
      input.remove()
      if (!copied) throw new Error('copy failed')
    }
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  window.setTimeout(() => { copyState.value = 'idle' }, 1600)
}

function toggleBookmark() {
  if (!post.value) return
  workspace.toggleBookmark({ url: post.value.path, title: post.value.title })
}

function collapsePanel() {
  if (import.meta.client && window.innerWidth <= 767) workspace.mobileContextOpen.value = false
  else workspace.contextVisible.value = false
}

onMounted(() => {
  main.value?.addEventListener('scroll', updateActiveHeading, { passive: true })
  window.addEventListener('resize', updateActiveHeading, { passive: true })
  updateActiveHeading()
})

onBeforeUnmount(() => {
  main.value?.removeEventListener('scroll', updateActiveHeading)
  window.removeEventListener('resize', updateActiveHeading)
})

watch(() => documentContext.outline.value, () => nextTick(updateActiveHeading), { deep: true })
</script>

<template>
  <aside
    id="contextPanel"
    class="ide-context"
    :class="{ 'mobile-open': workspace.mobileContextOpen.value }"
    aria-label="문서 컨텍스트"
  >
    <div class="ide-context-tabs" role="tablist" aria-label="문서 패널">
      <button
        v-for="tab in (['outline', 'info', 'related'] as const)"
        :key="tab"
        type="button"
        role="tab"
        :class="{ 'is-active': activeTab === tab }"
        :aria-selected="activeTab === tab"
        :aria-controls="`context-${tab}`"
        data-context-tab
        @click="activeTab = tab"
      >{{ tab.toUpperCase() }}</button>
      <button class="ide-context-collapse" type="button" aria-label="목차 패널 숨기기" title="목차 패널 숨기기" @click="collapsePanel"><i class="ri-layout-right-line" aria-hidden="true" /></button>
    </div>

    <section v-show="activeTab === 'outline'" id="context-outline" class="ide-context-view" role="tabpanel">
      <span class="ide-panel-label">DOCUMENT STRUCTURE</span>
      <nav id="postOutline" class="ide-outline-list" aria-label="문서 목차">
        <button
          v-for="item in documentContext.outline.value"
          :key="item.id"
          type="button"
          :class="[{ 'is-h3': item.level === 3, 'is-current': activeHeading === item.id }]"
          :aria-current="activeHeading === item.id ? 'location' : undefined"
          @click="goToHeading(item.id)"
        >{{ item.text }}</button>
        <p v-if="!documentContext.outline.value.length" class="ide-panel-empty">이 문서에는 목차가 없습니다.</p>
      </nav>
    </section>

    <section v-show="activeTab === 'info'" id="context-info" class="ide-context-view" role="tabpanel">
      <span class="ide-panel-label">DOCUMENT INFO</span>
      <dl class="ide-info-list">
        <div><dt>TYPE</dt><dd>{{ post ? 'Markdown' : 'Page' }}</dd></div>
        <div><dt>DATE</dt><dd>{{ post?.date ? formatPostDate(post.date) : '—' }}</dd></div>
        <div><dt>READ</dt><dd>{{ documentContext.readingMinutes.value }} min read</dd></div>
        <div><dt>WORDS</dt><dd>{{ documentContext.wordCount.value.toLocaleString('ko-KR') }}</dd></div>
        <div><dt>CATEGORY</dt><dd>{{ post?.categories.join(' / ').replaceAll('_', ' ') || 'workspace' }}</dd></div>
      </dl>
      <button class="ide-context-link" type="button" @click="copyPageLink">
        <i :class="copyState === 'copied' ? 'ri-check-line' : copyState === 'error' ? 'ri-error-warning-line' : 'ri-link'" aria-hidden="true" />
        {{ copyState === 'copied' ? 'Copied page link' : copyState === 'error' ? 'Copy failed' : 'Copy page link' }}
      </button>
      <button v-if="post" class="ide-context-link" :class="{ 'is-saved': isBookmarked }" type="button" @click="toggleBookmark">
        <i :class="isBookmarked ? 'ri-bookmark-3-fill' : 'ri-bookmark-3-line'" aria-hidden="true" />
        <span>{{ isBookmarked ? 'Remove bookmark' : 'Bookmark document' }}</span>
      </button>
    </section>

    <section v-show="activeTab === 'related'" id="context-related" class="ide-context-view" role="tabpanel">
      <span class="ide-panel-label">RELATED DOCUMENTS</span>
      <div class="ide-related-list">
        <NuxtLink v-for="item in related" :key="item.path" :to="item.path"><i class="ri-markdown-line" aria-hidden="true" /><span>{{ item.title }}</span></NuxtLink>
        <p v-if="!related.length" class="ide-panel-empty">연결된 문서가 없습니다.</p>
      </div>
    </section>

    <div class="ide-minimap" aria-hidden="true"><span /><span /><span /><i /></div>
    <button class="ide-resize-handle ide-resize-context" type="button" aria-label="Context 패널 너비 조절" @pointerdown="emit('resize', $event)" />
  </aside>
</template>
