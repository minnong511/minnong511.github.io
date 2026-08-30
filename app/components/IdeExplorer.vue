<script setup lang="ts">
import type { BlogPost } from '~/types/content'
import { buildExplorerTree, formatPostDate, postMatches } from '~/utils/content'

const props = defineProps<{ posts: BlogPost[] }>()
const emit = defineEmits<{ resize: [event: PointerEvent] }>()
const workspace = useWorkspaceState()
const query = ref('')
const sidebarQuery = ref('')
const sort = ref<'newest' | 'oldest' | 'title'>('newest')
const tree = computed(() => buildExplorerTree(props.posts))
const sidebarResults = computed(() => {
  if (!sidebarQuery.value.trim()) return []
  return props.posts.filter(post => postMatches(post, sidebarQuery.value)).slice(0, 30)
})

function resetExplorer() {
  query.value = ''
  sort.value = 'newest'
}
</script>

<template>
  <aside id="explorerPanel" class="ide-explorer" aria-label="작업 영역">
    <section v-show="workspace.activeSidebar.value === 'explorer'" class="ide-sidebar-panel is-active" aria-labelledby="explorerHeading">
      <div class="ide-panel-heading">
        <div><span class="ide-panel-label">WORKSPACE</span><h2 id="explorerHeading">EXPLORER</h2></div>
        <div class="ide-panel-actions">
          <button class="ide-panel-button" type="button" aria-label="탐색기 새로고침" title="새로고침" @click="resetExplorer"><i class="ri-refresh-line" /></button>
          <button class="ide-panel-button" type="button" aria-label="탐색기 접기" title="탐색기 접기" @click="workspace.sidebarOpen.value = false"><i class="ri-layout-left-line" /></button>
        </div>
      </div>
      <label class="ide-explorer-search">
        <i class="ri-search-line" aria-hidden="true" /><input v-model="query" type="search" placeholder="게시물 필터" autocomplete="off" @keydown.esc="query = ''"><kbd>ESC</kbd>
      </label>
      <div class="ide-explorer-toolbar"><span>{{ posts.filter(post => postMatches(post, query)).length }} POSTS</span><select v-model="sort" aria-label="게시물 정렬"><option value="newest">최신순</option><option value="oldest">오래된순</option><option value="title">제목순</option></select></div>
      <div class="ide-tree" role="tree" aria-label="카테고리와 게시물">
        <div class="ide-tree-root"><i class="ri-folder-open-line" /><strong>BLOG</strong></div>
        <IdeExplorerFolder v-for="node in tree" :key="node.key" :node="node" :query="query" :sort="sort" />
        <p v-if="query && !posts.some(post => postMatches(post, query))" class="ide-explorer-empty">검색 결과가 없습니다.</p>
      </div>
      <button class="ide-resize-handle ide-resize-explorer" type="button" aria-label="Explorer 패널 너비 조절" @pointerdown="emit('resize', $event)" />
    </section>

    <section v-show="workspace.activeSidebar.value === 'search'" class="ide-sidebar-panel" aria-labelledby="sidebarSearchHeading">
      <div class="ide-panel-heading"><div><span class="ide-panel-label">WORKSPACE</span><h2 id="sidebarSearchHeading">SEARCH</h2></div><button class="ide-panel-button" type="button" aria-label="검색 패널 접기" @click="workspace.sidebarOpen.value = false"><i class="ri-layout-left-line" /></button></div>
      <label class="ide-explorer-search"><i class="ri-search-line" /><input v-model="sidebarQuery" type="search" placeholder="제목, 카테고리, 태그 검색" autocomplete="off" @keydown.esc="sidebarQuery = ''"><kbd>ESC</kbd></label>
      <div class="ide-sidebar-results" aria-live="polite">
        <p v-if="!sidebarQuery" class="ide-panel-empty">제목, 카테고리와 태그로 검색하세요.</p>
        <p v-else-if="!sidebarResults.length" class="ide-panel-empty">검색 결과가 없습니다.</p>
        <NuxtLink v-for="post in sidebarResults" :key="post.path" class="ide-sidebar-result" :to="post.path"><i class="ri-markdown-line" /><span>{{ post.title }}<small>{{ post.categories.join(' / ') || 'workspace' }} · {{ formatPostDate(post.date) }}</small></span></NuxtLink>
      </div>
    </section>

    <section v-show="workspace.activeSidebar.value === 'source'" class="ide-sidebar-panel" aria-labelledby="sourceHeading">
      <div class="ide-panel-heading"><div><span class="ide-panel-label">VERSION CONTROL</span><h2 id="sourceHeading">SOURCE CONTROL</h2></div><button class="ide-panel-button" type="button" aria-label="소스 패널 접기" @click="workspace.sidebarOpen.value = false"><i class="ri-layout-left-line" /></button></div>
      <div class="ide-sidebar-content"><div class="ide-source-status"><i class="ri-git-branch-line" /><strong>master</strong><span>GitHub Pages</span></div><a class="ide-sidebar-action" href="https://github.com/minnong511/minnong511.github.io" target="_blank" rel="noopener noreferrer"><i class="ri-github-line" /><span>저장소 열기</span><i class="ri-external-link-line" /></a></div>
    </section>

    <section v-show="workspace.activeSidebar.value === 'run'" class="ide-sidebar-panel" aria-labelledby="runHeading">
      <div class="ide-panel-heading"><div><span class="ide-panel-label">BUILD STATUS</span><h2 id="runHeading">RUN AND DEBUG</h2></div><button class="ide-panel-button" type="button" aria-label="실행 패널 접기" @click="workspace.sidebarOpen.value = false"><i class="ri-layout-left-line" /></button></div>
      <div class="ide-sidebar-content"><p class="ide-panel-empty">게시물은 GitHub Actions에서 검증하고 정적 페이지로 빌드합니다.</p><a class="ide-sidebar-action" href="https://github.com/minnong511/minnong511.github.io/actions" target="_blank" rel="noopener noreferrer"><i class="ri-play-circle-line" /><span>Actions 열기</span><i class="ri-external-link-line" /></a></div>
    </section>

    <section v-show="workspace.activeSidebar.value === 'about'" class="ide-sidebar-panel" aria-labelledby="manageHeading">
      <div class="ide-panel-heading"><div><span class="ide-panel-label">WORKSPACE</span><h2 id="manageHeading">MANAGE</h2></div><button class="ide-panel-button" type="button" aria-label="관리 패널 접기" @click="workspace.sidebarOpen.value = false"><i class="ri-layout-left-line" /></button></div>
      <div class="ide-sidebar-content">
        <NuxtLink class="ide-sidebar-action" to="/"><i class="ri-home-5-line" /><span>홈 열기</span><i class="ri-arrow-right-line" /></NuxtLink>
        <NuxtLink class="ide-sidebar-action" to="/archive/"><i class="ri-file-list-3-line" /><span>전체 게시물</span><i class="ri-arrow-right-line" /></NuxtLink>
        <NuxtLink class="ide-sidebar-action" to="/tags/"><i class="ri-price-tag-3-line" /><span>태그 보기</span><i class="ri-arrow-right-line" /></NuxtLink>
        <NuxtLink class="ide-sidebar-action" to="/about/"><i class="ri-information-line" /><span>블로그 소개</span><i class="ri-arrow-right-line" /></NuxtLink>
      </div>
    </section>
  </aside>
</template>
