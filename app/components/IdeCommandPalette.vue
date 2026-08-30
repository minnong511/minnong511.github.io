<script setup lang="ts">
import type { BlogPost } from '~/types/content'
import { formatPostDate, postMatches, primaryCategory } from '~/utils/content'

interface PaletteItem {
  key: string
  title: string
  detail: string
  icon: string
  url?: string
  action?: 'explorer' | 'theme' | 'bookmarks'
  bookmark?: boolean
}

const props = defineProps<{ posts: BlogPost[] }>()
const route = useRoute()
const workspace = useWorkspaceState()
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const selected = ref(0)

const commands = computed<PaletteItem[]>(() => [
  { key: 'home', title: '홈 열기', detail: 'workspace', icon: 'ri-home-5-line', url: '/' },
  { key: 'archive', title: '전체 게시물 열기', detail: 'archive', icon: 'ri-file-list-3-line', url: '/archive/' },
  { key: 'explorer', title: '카테고리 탐색', detail: 'explorer', icon: 'ri-folder-3-line', action: 'explorer' },
  { key: 'tags', title: '태그 열기', detail: 'topics', icon: 'ri-price-tag-3-line', url: '/tags/' },
  { key: 'theme', title: `${workspace.theme.value === 'dark' ? '라이트' : '다크'} 테마 전환`, detail: 'appearance', icon: 'ri-contrast-2-line', action: 'theme' },
  { key: 'bookmarks', title: '북마크 검색', detail: `${workspace.bookmarks.value.length} saved`, icon: 'ri-bookmark-3-line', action: 'bookmarks' },
])

const postItems = computed<PaletteItem[]>(() => props.posts.map(post => ({
  key: `post:${post.path}`,
  title: post.title,
  detail: `${primaryCategory(post).replaceAll('_', ' ')} · ${formatPostDate(post.date)}`,
  icon: 'ri-markdown-line',
  url: post.path,
})))

const bookmarkItems = computed<PaletteItem[]>(() => workspace.bookmarks.value.map(bookmark => ({
  key: `bookmark:${bookmark.url}`,
  title: bookmark.title,
  detail: 'bookmark',
  icon: 'ri-bookmark-3-fill',
  url: bookmark.url,
  bookmark: true,
})))

const items = computed(() => {
  const value = query.value.trim()
  if (value === '@bookmarks') return bookmarkItems.value
  const needle = value.toLocaleLowerCase('ko-KR')
  const all = [...commands.value, ...bookmarkItems.value, ...postItems.value]
  if (!needle) return all.slice(0, 14)
  return all.filter((item) => {
    if (item.key.startsWith('post:')) {
      const post = props.posts.find(candidate => `post:${candidate.path}` === item.key)
      if (post && postMatches(post, needle)) return true
    }
    return `${item.title} ${item.detail}`.toLocaleLowerCase('ko-KR').includes(needle)
  }).slice(0, 20)
})

const recent = computed(() => {
  const seen = new Set<string>()
  return [...workspace.tabs.value].reverse().filter((tab) => {
    if (seen.has(tab.url)) return false
    seen.add(tab.url)
    return true
  }).slice(0, 7)
})

function close() {
  workspace.paletteOpen.value = false
}

async function execute(item: PaletteItem) {
  if (item.url) {
    close()
    await navigateTo(item.url)
    return
  }
  if (item.action === 'explorer') {
    workspace.activeSidebar.value = 'explorer'
    workspace.sidebarOpen.value = true
    close()
  } else if (item.action === 'theme') {
    workspace.setTheme(workspace.theme.value === 'dark' ? 'light' : 'dark')
    close()
  } else if (item.action === 'bookmarks') {
    query.value = '@bookmarks'
    selected.value = 0
  }
}

function handleKey(event: KeyboardEvent) {
  if (!workspace.paletteOpen.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selected.value = Math.min(selected.value + 1, Math.max(0, items.value.length - 1))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selected.value = Math.max(0, selected.value - 1)
  } else if (event.key === 'Enter') {
    const item = items.value[selected.value]
    if (!item) return
    event.preventDefault()
    void execute(item)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(() => workspace.paletteOpen.value, async (open) => {
  if (!open) return
  query.value = ''
  selected.value = 0
  await nextTick()
  input.value?.focus()
})
watch(query, () => { selected.value = 0 })
watch(() => items.value.length, length => { selected.value = Math.min(selected.value, Math.max(0, length - 1)) })
watch(() => route.fullPath, close)

onMounted(() => document.addEventListener('keydown', handleKey))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKey))
</script>

<template>
  <div
    class="ide-palette"
    :hidden="!workspace.paletteOpen.value"
    role="dialog"
    aria-modal="true"
    aria-label="명령 팔레트"
    @click.self="close"
  >
    <section class="ide-palette-card">
      <label class="ide-palette-input-wrap">
        <i class="ri-terminal-line" aria-hidden="true" />
        <input ref="input" v-model="query" type="search" placeholder="게시물 또는 명령 검색" autocomplete="off" aria-label="게시물 또는 명령 검색">
        <kbd>ESC</kbd>
      </label>
      <div class="ide-palette-results" role="listbox" aria-label="검색 결과">
        <button
          v-for="(item, index) in items"
          :key="item.key"
          class="ide-palette-result"
          :class="{ 'is-selected': selected === index }"
          type="button"
          role="option"
          :aria-selected="selected === index"
          @mouseenter="selected = index"
          @click="execute(item)"
        ><i :class="item.icon" aria-hidden="true" /><span>{{ item.title }}</span><small>{{ item.detail }}</small></button>
        <p v-if="!items.length" class="ide-panel-empty">{{ query === '@bookmarks' ? '저장된 북마크가 없습니다.' : '검색 결과가 없습니다.' }}</p>
      </div>
      <div v-if="recent.length && query !== '@bookmarks'" class="ide-palette-recent">
        <div class="ide-palette-recent-heading"><span>RECENTLY OPENED</span><span>{{ recent.length }}</span></div>
        <NuxtLink v-for="tab in recent" :key="tab.url" class="ide-palette-recent-item" :to="tab.url" @click="close"><i class="ri-history-line" aria-hidden="true" /><span>{{ tab.title }}</span><small>recently opened</small></NuxtLink>
      </div>
    </section>
  </div>
</template>
